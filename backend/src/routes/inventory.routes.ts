import { Router } from 'express';

import * as inventoryController from '../controllers/inventory.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', authenticate, authorize('admin'), inventoryController.getStockView);
router.patch('/:id', authenticate, authorize('admin'), inventoryController.adjustStock);

export default router;
