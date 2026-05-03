import { Router } from 'express';

import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize('admin'), userController.getAll);
router.post('/', authenticate, authorize('admin'), userController.create);
router.put('/:id', authenticate, authorize('admin'), userController.update);
router.patch('/:id/status', authenticate, authorize('admin'), userController.toggleStatus);

export default router;
