# FreshMart MERN Starter

This repository contains a modernised version of the FreshMart landing page, migrated from a static HTML file into a Vite-powered React application. A backend scaffold built with Express and MongoDB is also provided to jump-start a full MERN stack implementation.

## Project Structure

```
.
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── components/   # Reusable UI building blocks
│   │   ├── sections/     # Page-level sections
│   │   ├── data/         # Static seed fallbacks for offline mode
│   │   ├── services/     # Axios API clients
│   │   └── styles/       # Global styles
│   └── ...
├── server/          # Express backend scaffold
│   ├── src/
│   │   ├── config/       # Database configuration
│   │   ├── controllers/  # Request handlers
│   │   ├── models/       # Mongoose models
│   │   └── routes/       # API routes
│   └── ...
└── project.html     # Original static prototype (kept for reference)
```

## Getting Started

### Frontend

```bash
cd client
npm install
npm run dev
```

The app will launch at <http://localhost:5173>.

### Backend

```bash
cd server
npm install
cp env.example .env
# Update .env with your Mongo connection string
# Ensure MongoDB is running (Windows service or `mongod --dbpath C:\data\db`)
npm run dev
```

The API boots on <http://localhost:5000>. Swagger/Postman collections can be added later.

> **Environment variables**: copy `client/env.example` to `client/.env` and `server/env.example` to `server/.env`, then customise the connection string and API base URL if needed.

## Key Features

- **Real-time inventory catalogue** powered by Express + MongoDB with fallback data for offline demos.
- **Cart and checkout pipeline** that captures line-items client side and persists orders to MongoDB.
- **Robot orchestration APIs** that queue tasks, log YOLO detections, and track controller heartbeats.
- **Device inventory** seeded with three Arduino controllers and a Raspberry Pi 4 (8 GB) hub for YOLOv8 inference.
- **YOLO-friendly metadata** on every product: SKU, stock, storage zone/aisle/shelf/bin, and weight.
- **Orders dashboard** in the frontend spotlighting the latest fulfilment jobs.
- **Progressive Web App (PWA)** with offline support, install prompt, and app-like experience on mobile devices.

## MongoDB Collections

On first boot the API seeds:

- `products` – robot-readable stock catalogue (`sku`, `stock`, storage zones, weight, imagery).
- `robotcontrollers` – three Arduino boards plus a Raspberry Pi 4 Model B hub (recommended for YOLOv8).
- `orders` – customer requests with embedded items, totals, channel, and status.
- `robottasks` – queue of robot pick/restock jobs with YOLO detection logs.

Indexes stay in sync automatically at startup.

## API Overview

| Method & Path | Purpose |
| --- | --- |
| `GET /api/status` | Basic health check |
| `GET /api/products?tag=featured` | Fetch filtered products (supports `tag`, `category`, `search`, `limit`) |
| `POST /api/products` | Create products (admin tasks) |
| `POST /api/orders` | Create a customer order (automatically queues a robot task) |
| `GET /api/orders` | List recent orders (filter by `status`) |
| `GET /api/orders/:id` | Inspect a single order |
| `PATCH /api/orders/:id/status` | Update order lifecycle (ready, completed, cancelled, etc.) |
| `GET /api/robot/controllers` | List registered controllers (3× Arduino + Raspberry Pi hub) |
| `POST /api/robot/controllers/heartbeat` | Update controller heartbeat/battery/IP |
| `GET /api/robot/tasks/next` | Robot (Python) requests the next queued task |
| `PATCH /api/robot/tasks/:id/status` | Robot reports progress, completion, or YOLO detections |

All endpoints return JSON. CORS is enabled so the Raspberry Pi or any external service can call the API directly.

## Frontend Data Flow

The Vite/React client talks to the API via Axios (`client/src/services`).

- Products load from `/api/products`; failed calls fall back to static seed data for demos.
- The cart drawer stores line items locally while placing a real `POST /api/orders` when `_id` is available.
- The “Recent Orders” board consumes `/api/orders` to highlight live fulfilment activity.

Configure the frontend base URL with `VITE_API_BASE_URL` in `client/.env` when hosting the API elsewhere.

## Robot Integration

1. **Hardware topology**
   - 3× Arduino boards (two Mega 2560 for picker arms, one Due for the drive/lift stack) already seeded in the database.
   - 1× Raspberry Pi 4 Model B (8 GB RAM) designated as `RPI-HUB-01`, responsible for YOLOv8 inference and high-level coordination.

2. **Python (YOLO) workflow**
   - Poll the queue: `GET /api/robot/tasks/next?identifier=RPI-HUB-01`
   - Perform pick/vision cycle and send progress: `PATCH /api/robot/tasks/:id/status`
   - Optional: include YOLO detections in the payload (`detections: [{ label, confidence, productId, imageUrl, meta }]`). These are appended to the task record for audit and UI visualisation.
   - Keep the heartbeat alive from every controller (including Arduinos via their gateways) using `POST /api/robot/controllers/heartbeat`.

3. **Sample Python snippet**

```python
import requests

API_BASE = "http://localhost:5000/api"

def fetch_task():
    response = requests.get(f"{API_BASE}/robot/tasks/next", params={"identifier": "RPI-HUB-01"}, timeout=5)
    response.raise_for_status()
    return response.json()["data"]

def complete_task(task_id, detections=None):
    payload = {"status": "completed", "detections": detections or []}
    response = requests.patch(f"{API_BASE}/robot/tasks/{task_id}/status", json=payload, timeout=5)
    response.raise_for_status()
    return response.json()["data"]

if __name__ == "__main__":
    task = fetch_task()
    if task:
        # Run YOLOv8 inference + motion control here
        detections = [{"label": "apple", "confidence": 0.94, "productId": task['items'][0]['product']['_id']}]
        complete_task(task["_id"], detections)
```

This script can be extended to command the Arduino controllers over serial/I²C and upload detection imagery for post-run analysis.

## Progressive Web App (PWA)

FreshMart is now a fully functional PWA! This means:

- **📱 Install to Home Screen** - Add FreshMart as an app on any device
- **🔌 Offline Support** - Browse cached products even without internet
- **⚡ Fast Loading** - Instant loading with service worker caching
- **🔔 Push Notifications** - Infrastructure ready for order updates
- **📲 App-like Experience** - Fullscreen mode, splash screen, and app icons

### Quick Start with PWA

1. **Generate icons** - Open `client/public/icons/icon-generator.html` in your browser
2. **Test locally** - Run `npm run build && npm run preview` from the client directory
3. **Install the app** - Look for "Install" prompt in your browser
4. **Read the guide** - See `client/PWA-GUIDE.md` for complete documentation

For detailed PWA setup, customization, and testing instructions, see **[client/PWA-GUIDE.md](client/PWA-GUIDE.md)**.

## What's Next

1. **Secure the platform** – Add auth (JWT/OAuth), rate limiting, and TLS before exposing hardware endpoints.
2. **Realtime updates** – Push robot and order status via WebSockets or server-sent events.
3. **Validation & testing** – Introduce schema validators (Zod/Joi) and automated tests (Jest/Vitest) across client and server.
4. **YOLO insights UI** – Surface detection imagery and confidence metrics inside the order timeline.
5. **Enhanced operations** – Add roles, inventory adjustments, payment flow, and analytics dashboards.

Feel free to adapt the structure to match your team's conventions—the starter keeps frontend and backend concerns cleanly separated so each can evolve independently.

