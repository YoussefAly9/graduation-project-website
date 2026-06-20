import { Router } from 'express';

import {
  cancelOrder,
  getNextTask,
  getStatus,
  heartbeat,
  listControllers,
  sendOrder,
  updateStatus,
  updateTaskStatus
} from '../controllers/robotController.js';

const router = Router();

// --- Website <-> Robot integration (ROS 2 bridge talks to these) ---
router.post('/send-order', sendOrder); // website -> queue an order for the robot
router.get('/status', getStatus); // website polls robot/task status
router.post('/update-status', updateStatus); // robot/bridge -> push execution updates
router.post('/cancel-order', cancelOrder); // website -> cancel a robot task

// --- Robot/controller lifecycle (existing polling worker API) ---
router.get('/controllers', listControllers);
router.post('/controllers/heartbeat', heartbeat);
router.get('/tasks/next', getNextTask); // robot/bridge pulls the next queued task
router.patch('/tasks/:id/status', updateTaskStatus); // legacy granular task update

export default router;
