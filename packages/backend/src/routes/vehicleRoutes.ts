import { Router } from 'express';
import {
  listVehicles,
  getVehicle,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  getAvailableForDispatch,
} from '../controllers/vehicleController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateQuery, validateBody, validateParams } from '../middleware/validation';
import { createVehicleSchema, updateVehicleSchema, vehicleFiltersSchema, availableVehiclesSchema } from '@transport-ops/shared/schemas';
import { idParamSchema } from './commonSchemas';

const router = Router();

router.get('/', requireAuth, validateQuery(vehicleFiltersSchema), listVehicles);
router.get('/available-for-dispatch', requireAuth, validateQuery(availableVehiclesSchema), getAvailableForDispatch);
router.get('/:id', requireAuth, validateParams(idParamSchema), getVehicle);
router.post('/', requireAuth, requireRole('ADMIN', 'MANAGER'), validateBody(createVehicleSchema), createVehicle);
router.patch('/:id', requireAuth, requireRole('ADMIN', 'MANAGER'), validateParams(idParamSchema), validateBody(updateVehicleSchema), updateVehicle);
router.delete('/:id', requireAuth, requireRole('ADMIN', 'MANAGER'), validateParams(idParamSchema), deleteVehicle);

export default router;