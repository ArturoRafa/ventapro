import { Router } from 'express';

import * as saleController from '../controllers/sale.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Any authenticated user (must have open cash register — checked in service)
router.post('/', authenticate, saleController.create);

// Admin only
router.get('/', authenticate, authorize('admin'), saleController.findAll);
router.get('/:id', authenticate, authorize('admin'), saleController.findById);

export default router;
