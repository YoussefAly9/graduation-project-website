import { Router } from 'express';

import { getStatus } from '../controllers/healthController.js';
import productRoutes from './productRoutes.js';
import orderRoutes from './orderRoutes.js';
import robotRoutes from './robotRoutes.js';

const router = Router();

router.get('/status', getStatus);
router.use('/products', productRoutes);
router.use('/orders', orderRoutes);
router.use('/robot', robotRoutes);

export default router;

