# Website ↔ ROS 2 Robot Integration

This document explains how the smart-grocery website integrates with a ROS 2
robot for autonomous order fulfillment (navigation, product detection, and
pick-and-place), and how to run and test the whole system.

---

## 1. Architecture overview

```
┌────────────┐   HTTPS    ┌─────────────────────┐   Mongo   ┌────────────┐
│  Frontend  │ ─────────► │   Backend REST API  │ ────────► │  MongoDB   │
│  (React)   │ ◄───────── │ (Express, /api/...) │ ◄──────── │  Atlas     │
└────────────┘  poll /    └─────────┬───────────┘           └────────────┘
   live UI      Socket.IO           │  ▲
                                    │  │  REST (outbound from robot)
                       GET /tasks/next │  │ POST /robot/update-status
                                    ▼  │
                          ┌────────────────────────┐
                          │  ROS 2 Website Bridge   │  (rclpy node on the robot/Pi)
                          │  website_bridge_node    │
                          └─────────┬──────────────┘
                            publish │  ▲ action feedback
                         /website/orders │  │
                            ExecuteOrder ▼  │
                          ┌────────────────────────┐
                          │   Robot Executor        │  (your nav + perception +
                          │   (action server)       │   manipulation stack;
                          └────────────────────────┘   simulated node included)
```

### Order lifecycle

```
User places order on website
  → Backend stores order in MongoDB (+ creates a RobotTask)
  → POST /api/robot/send-order  (or auto on checkout) queues the task
  → ROS 2 bridge polls GET /api/robot/tasks/next and pulls the task
  → Bridge publishes OrderTask on /website/orders + sends ExecuteOrder goal
  → Robot navigates → detects → picks → places (per item)
  → Robot streams TaskFeedback; bridge POSTs /api/robot/update-status
  → Backend updates RobotTask + Order, emits a realtime event
  → Frontend shows live status (Socket.IO if available, else polling)
```

### Why REST polling for the bridge (the key design decision)

We chose a **custom ROS 2 Python bridge node that talks to the backend over REST**
(polling for tasks + POSTing status), with **Socket.IO** for the live UI on the
standalone server. Reasons:

| Option | Verdict |
| --- | --- |
| **Custom ROS 2 node + REST (chosen)** | rclpy is native to the robot; REST is **outbound** from the robot so it works through NAT/firewalls and on **serverless** (Vercel) with zero extra infra. Decouples cloud from robot network. |
| rosbridge_suite (WebSocket) | Great for browser↔ROS, but needs the robot to expose an inbound WS endpoint the cloud can reach — not serverless-friendly. |
| MQTT | Solid for fleets, but adds a broker to deploy/secure — overkill for one robot + a serverless backend. |
| Direct WebSocket from backend | Vercel serverless **cannot** hold persistent connections. |

The backend is deployed as **Vercel serverless functions**, which cannot keep
long-lived connections. REST polling sidesteps that entirely while staying fully
ROS 2-native on the robot. The same backend also runs as a **standalone Node
server** (`server/src/index.js`) that adds **Socket.IO** for instant UI updates;
when Socket.IO isn't present (serverless), the frontend automatically falls back
to polling `GET /api/robot/status`.

---

## 2. Backend API (robot integration)

Base path: `/api/robot`

| Method & path | Purpose | Body / Query |
| --- | --- | --- |
| `POST /send-order` | Queue an order for the robot (idempotent, no duplicates) | `{ orderId, priority? }` |
| `GET /status` | Robots + active tasks, or one task (`?orderId=` / `?taskId=`) | query |
| `POST /update-status` | Robot/bridge pushes execution updates | see payload below |
| `POST /cancel-order` | Cancel a robot task (safe mid-execution) | `{ orderId|taskId, reason? }` |
| `GET /tasks/next` | Robot/bridge pulls the next queued task | `?identifier=RPI-HUB-01` |
| `POST /controllers/heartbeat` | Robot liveness + battery | `{ identifier, status?, batteryLevel? }` |
| `GET /controllers` | List registered robots | — |
| `PATCH /tasks/:id/status` | Legacy granular task update | `{ status, errorMessage?, detections? }` |

### Example: dispatch an order
```bash
curl -X POST "$BASE/api/robot/send-order" \
  -H "Content-Type: application/json" \
  -d '{ "orderId": "6a368e886648d3defece94a0", "priority": 4 }'
```

### Example robot status payload (`POST /update-status`)
```json
{
  "taskId": "6a3690...",
  "orderId": "6a368e...",
  "state": "picking",
  "step": "Picking 2 x Apple Juice",
  "progress": 75,
  "robotId": "RPI-HUB-01",
  "location": { "zone": "A", "label": "Aisle A - Shelf 3", "x": 1.2, "y": 4.5 },
  "detections": [
    { "productId": "6a149c...", "label": "apple_juice", "confidence": 0.94 }
  ]
}
```
`state` must be one of:
`pending, sent, accepted, rejected, navigating, product_found, picking, placing, completed, failed, cancelled`.

### Status mapping
| Robot `state` | Order `status` | Order `robotStatus` |
| --- | --- | --- |
| sent / pending | queued | sent |
| accepted, navigating, product_found, picking, placing | picking | (same as state) |
| completed | ready | completed |
| failed / rejected | pending (retryable) | failed/rejected |
| cancelled | cancelled | cancelled |

---

## 3. Database changes

**Order** (added): `robotTaskId`, `robotStatus`, `assignedRobotId`, `currentStep`,
`startedAt`, `completedAt`, `failureReason`.

**RobotTask** (added): `executionStatus` (granular states), `currentStep`,
`progress`, `currentLocation`, `assignedRobotId`, `failureReason`, and a
`feedback[]` timeline. The original `status` (`queued/in_progress/completed/
failed/cancelled`) is preserved for backward compatibility.

No migration is required — new fields default sensibly on existing documents.

---

## 4. ROS 2 interfaces (`grocery_robot_interfaces`)

**Topics**
| Topic | Type | Direction |
| --- | --- | --- |
| `/website/orders` | `OrderTask` | bridge → robot |
| `/robot/status` | `RobotStatus` | robot → bridge |
| `/robot/location` | `RobotLocation` | robot → bridge |
| `/robot/task_feedback` | `TaskFeedback` | robot → bridge |

**Service / Action mapping to your requested API**
| Requested | Implemented as |
| --- | --- |
| `send_order_task` | `ExecuteOrder` **action** goal (+ `/website/orders` topic) |
| `cancel_order_task` | `CancelOrderTask` **service** (+ backend `POST /cancel-order`) |
| `get_robot_status` | `GetRobotStatus` **service** (+ backend `GET /status`) |
| `update_order_status` | backend `POST /update-status` (from bridge) |

An **action** is used for order execution because it is long-running, streams
feedback, and supports cancellation — exactly the pick-and-place use case.

---

## 5. Running everything

### A. Backend (standalone, with realtime)
```bash
cd client
npm install
# .env needs MONGODB_URI (and optionally PORT)
npm run server        # http://localhost:5000  (+ Socket.IO)
```

### B. Frontend
```bash
cd client
npm run dev
# Optional realtime: set VITE_SOCKET_URL=http://localhost:5000 in client/.env
```
Open an order in **Orders → (order) → Robot Fulfillment** to see the live tracker.
Without `VITE_SOCKET_URL`, the tracker polls `/api/robot/status` automatically.

### C. Option 1 — Test WITHOUT ROS 2 (recommended for quick demos)
```bash
cd ros2/tools
pip install -r ../requirements.txt
python rest_robot_simulator.py --base-url http://localhost:5000 --robot RPI-HUB-01
# or against the deployed site:
python rest_robot_simulator.py --base-url https://graduation-project-website-phi.vercel.app
```

### D. Option 2 — Full ROS 2 (Humble/Iron)
```bash
cd ros2
colcon build
source install/setup.bash
export BACKEND_BASE_URL=http://localhost:5000
export ROBOT_IDENTIFIER=RPI-HUB-01
ros2 launch grocery_robot_bridge integration.launch.py
```
This starts the simulated `robot_executor` (action server) and the
`website_bridge`. Replace `robot_executor` with your real stack, keeping the
same `ExecuteOrder` action / topic contract.

---

## 6. Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `MONGODB_URI` | backend | Mongo connection string |
| `PORT` | backend (standalone) | API port (default 5000) |
| `SOCKET_CORS_ORIGIN` | backend (standalone) | Socket.IO CORS origin (default `*`) |
| `VITE_SOCKET_URL` | frontend | Socket.IO server URL (enables push; else polling) |
| `BACKEND_BASE_URL` | bridge/sim | Website API base (with/without `/api`) |
| `ROBOT_IDENTIFIER` | bridge/sim | Controller id (seeded default `RPI-HUB-01`) |
| `POLL_INTERVAL` | bridge | Task poll / heartbeat interval (s) |
| `FEEDBACK_SOURCE` | bridge | `action` (default) or `topic` |
| `SIM_STEP_DELAY` / `FAIL_ON_ITEM` | executor/sim | Demo pacing / failure injection |

---

## 7. Testing

### End-to-end (no ROS)
1. Start backend + frontend.
2. Place an order on the site (or `POST /api/orders`).
3. In the order's **Robot Fulfillment** panel, click **Send to Robot**
   (or `POST /api/robot/send-order`).
4. Run `rest_robot_simulator.py`. Watch the pipeline advance live:
   `sent → accepted → navigating → product_found → picking → placing → completed`.
5. Verify the order `status` becomes `ready` and `GET /api/orders/:id` shows
   `robotStatus: "completed"`.

### Simulate failures
```bash
python rest_robot_simulator.py --once --fail-on-item 0
```
The tracker shows a red **Execution failed** state and the order keeps a
`failureReason`; the order returns to `pending` so it can be re-dispatched.

### WebSocket live updates
Set `VITE_SOCKET_URL=http://localhost:5000`, run the standalone backend, and
confirm the tracker updates instantly (no 2.5s poll delay).

### Backend route smoke test
```bash
curl "$BASE/api/robot/status"
curl -X POST "$BASE/api/robot/send-order" -H "Content-Type: application/json" -d '{"orderId":"<id>"}'
curl -X POST "$BASE/api/robot/update-status" -H "Content-Type: application/json" \
  -d '{"orderId":"<id>","state":"navigating","step":"to aisle A","progress":20}'
curl -X POST "$BASE/api/robot/cancel-order" -H "Content-Type: application/json" -d '{"orderId":"<id>"}'
```

### Failure cases covered
| Case | Behavior |
| --- | --- |
| Robot offline | No heartbeat → robot shows offline; tasks stay `queued` until a robot polls. |
| Robot rejects task | `state: rejected` → order back to `pending`, `failureReason` recorded. |
| Product not found / nav / pick failed | `state: failed` + `errorMessage` → red UI, order `pending`. |
| Backend connection error | Bridge logs + retries on next poll; no data loss. |
| Duplicate dispatch | `send-order` reuses the active task (no duplicate execution). |
| Cancel while executing | `cancel-order` marks task/order cancelled; late updates are ignored. |

---

## 8. Scaling to multiple robots

- Each robot uses a unique `ROBOT_IDENTIFIER`; register it via
  `POST /api/robot/controllers/heartbeat` (or seed it).
- `GET /tasks/next` hands one queued task at a time, ordered by `priority` then
  age, so multiple bridges can pull work concurrently without collisions.
- `assignedRobotId` on the task/order records which robot executed it.
- Add capability-based routing later by filtering `tasks/next` on robot
  capabilities (the field already exists on `RobotController`).
