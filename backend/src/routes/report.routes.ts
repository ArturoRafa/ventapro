import { Router } from 'express';

import * as reportController from '../controllers/report.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// All report endpoints are admin-only
router.get('/ventas', authenticate, authorize('admin'), reportController.salesSummary);
router.get('/productos-top', authenticate, authorize('admin'), reportController.topProducts);
router.get('/ventas-por-cajero', authenticate, authorize('admin'), reportController.salesByCashier);
router.get('/creditos', authenticate, authorize('admin'), reportController.creditSummary);
router.get('/cajas', authenticate, authorize('admin'), reportController.cashRegisterSummary);

export default router;
