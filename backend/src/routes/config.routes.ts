import { Router } from 'express';

import * as configController from '../controllers/config.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, configController.get);
router.put('/', authenticate, authorize('admin'), configController.update);

export default router;
