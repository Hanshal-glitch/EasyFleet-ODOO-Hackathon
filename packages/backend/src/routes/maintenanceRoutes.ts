import { Router } from 'express';
import { z } from 'zod';
import {
  listMaintenance,
  getMaintenance,
  createMaintenance,
  closeMaintenance,
  getVehicleMaintenanceHistory,
} from '../controllers/maintenanceController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateQuery, validateBody, validateParams } from '../middleware/validation';
import { createMaintenanceSchema, closeMaintenanceSchema, maintenanceFiltersSchema } from '@transport-ops/shared/schemas';
import { idParamSchema } from './commonSchemas';

const router = Router();

router.get('/', requireAuth, validateQuery(maintenanceFiltersSchema), listMaintenance);
router.get('/vehicle/:vehicleId/history', requireAuth, validateParams(z.object({ vehicleId: idParamSchema.shape.id })), getVehicleMaintenanceHistory);
router.get('/:id', requireAuth, validateParams(idParamSchema), getMaintenance);
router.post('/', requireAuth, requireRole('ADMIN', 'MANAGER'), validateBody(createMaintenanceSchema), createMaintenance);
router.post('/:id/close', requireAuth, requireRole('ADMIN', 'MANAGER'), validateParams(idParamSchema), validateBody(closeMaintenanceSchema), closeMaintenance);

export default router;