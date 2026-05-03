import { Router } from 'express';

import * as cashRegisterController from '../controllers/cash-register.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Any authenticated user (admin or cashier)
router.post('/abrir', authenticate, cashRegisterController.open);
router.post('/cerrar', authenticate, cashRegisterController.close);
router.get('/actual', authenticate, cashRegisterController.findCurrent);

// Admin only
router.get('/', authenticate, authorize('admin'), cashRegisterController.findAll);
router.get('/:id', authenticate, authorize('admin'), cashRegisterController.findById);

export default router;
