import { Router } from 'express';

import * as productController from '../controllers/product.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, productController.findAll);
router.get('/low-stock', authenticate, authorize('admin'), productController.getLowStock);
router.get('/:id', authenticate, productController.findById);
router.post('/', authenticate, authorize('admin'), productController.create);
router.put('/:id', authenticate, authorize('admin'), productController.update);
router.patch('/:id/estado', authenticate, authorize('admin'), productController.toggleStatus);

export default router;
