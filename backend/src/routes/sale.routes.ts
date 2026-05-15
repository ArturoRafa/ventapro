import { Router } from 'express';

import * as saleController from '../controllers/sale.controller';
import * as ticketController from '../controllers/ticket.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Any authenticated user (must have open cash register — checked in service)
router.post('/', authenticate, saleController.create);

// Any authenticated user — cashier scope enforced in controller
router.get('/', authenticate, saleController.findAll);

// Ticket PDF — any authenticated user (must be before /:id)
router.get('/:id/ticket', authenticate, ticketController.generateTicket);

// Any authenticated user — ownership enforced in controller
router.get('/:id', authenticate, saleController.findById);

export default router;
