import { Router } from 'express';

import {
  getNextTask,
  heartbeat,
  listControllers,
  updateTaskStatus
} from '../controllers/robotController.js';

const router = Router();

router.get('/controllers', listControllers);
router.post('/controllers/heartbeat', heartbeat);
router.get('/tasks/next', getNextTask);
router.patch('/tasks/:id/status', updateTaskStatus);

export default router;


