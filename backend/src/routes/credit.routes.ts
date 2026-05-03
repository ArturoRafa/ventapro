import { Router } from 'express';

import * as creditController from '../controllers/credit.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Any authenticated user: list and view credits
router.get('/', authenticate, creditController.findAll);
router.get('/:id', authenticate, creditController.findById);

// Any authenticated user (must have open cash register — checked in service)
router.post('/:id/abonos', authenticate, creditController.createPayment);

export default router;
