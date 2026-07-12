import { Router } from 'express';
import { getKPIs, getCharts, startTour, endTour } from '../controllers/dashboardController';
import { requireAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validation';
import { dashboardFiltersSchema, chartParamsSchema } from '@transport-ops/shared/schemas';

const router = Router();

router.post('/tour', requireAuth, startTour);
router.post('/tour/end', requireAuth, endTour);
router.get('/kpis', requireAuth, validateQuery(dashboardFiltersSchema), getKPIs);
router.get('/charts', requireAuth, validateQuery(chartParamsSchema), getCharts);

export default router;