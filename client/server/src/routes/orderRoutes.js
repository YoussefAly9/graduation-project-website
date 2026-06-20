import { Router } from 'express';

import {
  createOrder,
  getOrderById,
  listOrders,
  updateOrderStatus,
  cancelOrder,
  modifyOrder,
  updateDeliveryTracking,
  getOrderTimeline
} from '../controllers/orderController.js';

const router = Router();

router.get('/', listOrders);
router.get('/:id', getOrderById);
router.get('/:id/timeline', getOrderTimeline);
router.post('/', createOrder);
router.patch('/:id/status', updateOrderStatus);
router.post('/:id/cancel', cancelOrder);
router.patch('/:id/modify', modifyOrder);
router.patch('/:id/delivery', updateDeliveryTracking);

export default router;


