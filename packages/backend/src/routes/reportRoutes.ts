import { Router } from 'express';
import {
  getFuelEfficiency,
  getFleetUtilization,
  getOperationalCost,
  getVehicleROI,
  exportReport,
  getReportSummary,
} from '../controllers/reportController';
import { requireAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { reportFiltersSchema, exportParamsSchema } from '@transport-ops/shared/schemas';

const router = Router();

router.get('/summary', requireAuth, validateQuery(reportFiltersSchema), getReportSummary);
router.get('/fuel-efficiency', requireAuth, validateQuery(reportFiltersSchema), getFuelEfficiency);
router.get('/fleet-utilization', requireAuth, validateQuery(reportFiltersSchema), getFleetUtilization);
router.get('/operational-cost', requireAuth, validateQuery(reportFiltersSchema), getOperationalCost);
router.get('/vehicle-roi', requireAuth, validateQuery(reportFiltersSchema), getVehicleROI);
router.get('/export', requireAuth, validateQuery(exportParamsSchema), exportReport);

export default router;