import { Router } from 'express';

import * as subcategoryController from '../controllers/subcategory.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, subcategoryController.findAll);
router.get('/:id', authenticate, subcategoryController.findById);
router.post('/', authenticate, authorize('admin'), subcategoryController.create);
router.put('/:id', authenticate, authorize('admin'), subcategoryController.update);
router.patch('/:id/estado', authenticate, authorize('admin'), subcategoryController.toggleStatus);
router.delete('/:id', authenticate, authorize('admin'), subcategoryController.remove);

export default router;
