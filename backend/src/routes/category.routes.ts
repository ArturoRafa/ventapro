import { Router } from 'express';

import * as categoryController from '../controllers/category.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, categoryController.findAll);
router.get('/:id', authenticate, categoryController.findById);
router.post('/', authenticate, authorize('admin'), categoryController.create);
router.put('/:id', authenticate, authorize('admin'), categoryController.update);
router.patch('/:id/estado', authenticate, authorize('admin'), categoryController.toggleStatus);

export default router;
