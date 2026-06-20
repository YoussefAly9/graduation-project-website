import { Router } from 'express';

import { createProduct, getProductById, listProducts } from '../controllers/productController.js';

const router = Router();

router.get('/', listProducts);
router.get('/:id', getProductById);
router.post('/', createProduct);

export default router;

