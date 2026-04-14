import { Router } from 'express';

import * as saleController from '../controllers/sale.controller';
import * as ticketController from '../controllers/ticket.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// Any authenticated user (must have open cash register — checked in service)
router.post('/', authenticate, saleController.create);

// Admin only
router.get('/', authenticate, authorize('admin'), saleController.findAll);

// Ticket PDF — any authenticated user (must be before /:id)
router.get('/:id/ticket', authenticate, ticketController.generateTicket);

router.get('/:id', authenticate, authorize('admin'), saleController.findById);

export default router;
