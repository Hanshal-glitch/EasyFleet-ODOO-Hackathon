import { Router } from 'express';
import { listFuelLogs, getFuelLog, createFuelLog } from '../controllers/fuelController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateQuery, validateBody, validateParams } from '../middleware/validation';
import { createFuelLogSchema, fuelFiltersSchema } from '@transport-ops/shared/schemas';
import { idParamSchema } from './commonSchemas';

const router = Router();

router.get('/', requireAuth, validateQuery(fuelFiltersSchema), listFuelLogs);
router.get('/:id', requireAuth, validateParams(idParamSchema), getFuelLog);
router.post('/', requireAuth, requireRole('ADMIN', 'MANAGER'), validateBody(createFuelLogSchema), createFuelLog);

export default router;