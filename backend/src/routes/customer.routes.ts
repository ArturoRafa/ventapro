import { Router } from 'express';

import * as customerController from '../controllers/customer.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, customerController.findAll);
router.get('/:id', authenticate, customerController.findById);
router.post('/', authenticate, customerController.create);
router.put('/:id', authenticate, authorize('admin'), customerController.update);
router.patch('/:id/estado', authenticate, authorize('admin'), customerController.toggleStatus);

export default router;
