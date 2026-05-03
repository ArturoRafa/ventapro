import { Router } from 'express';

import * as creditController from '../controllers/credit.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Admin only: list credits with filters
router.get('/', authenticate, authorize('admin'), creditController.findAll);

// Admin only: credit detail with payments
router.get('/:id', authenticate, authorize('admin'), creditController.findById);

// Any authenticated user (must have open cash register — checked in service)
router.post('/:id/abonos', authenticate, creditController.createPayment);

export default router;
