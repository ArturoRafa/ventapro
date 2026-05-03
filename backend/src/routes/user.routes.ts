import { Router } from 'express';

import * as userController from '../controllers/user.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize('admin'), userController.getAll);

export default router;
