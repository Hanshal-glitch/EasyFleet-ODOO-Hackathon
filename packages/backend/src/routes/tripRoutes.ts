import { Router } from 'express';
import {
  listTrips,
  getTrip,
  createTrip,
  dispatchTrip,
  completeTrip,
  cancelTrip,
  getTripStats,
  getAvailableVehicles,
  getAvailableDrivers,
} from '../controllers/tripController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateQuery, validateBody, validateParams } from '../middleware/validation';
import {
  createTripSchema,
  completeTripSchema,
  cancelTripSchema,
  tripFiltersSchema,
  availableVehiclesSchema,
} from '@transport-ops/shared/schemas';
import { idParamSchema } from './commonSchemas';

const router = Router();

router.get('/', requireAuth, validateQuery(tripFiltersSchema), listTrips);
router.get('/stats', requireAuth, getTripStats);
router.get('/available-vehicles', requireAuth, validateQuery(availableVehiclesSchema), getAvailableVehicles);
router.get('/available-drivers', requireAuth, getAvailableDrivers);
router.get('/:id', requireAuth, validateParams(idParamSchema), getTrip);
router.post('/', requireAuth, requireRole('ADMIN', 'MANAGER'), validateBody(createTripSchema), createTrip);
router.post('/:id/dispatch', requireAuth, requireRole('ADMIN', 'MANAGER'), validateParams(idParamSchema), dispatchTrip);
router.post('/:id/complete', requireAuth, requireRole('ADMIN', 'MANAGER'), validateParams(idParamSchema), validateBody(completeTripSchema), completeTrip);
router.post('/:id/cancel', requireAuth, requireRole('ADMIN', 'MANAGER'), validateParams(idParamSchema), validateBody(cancelTripSchema), cancelTrip);

export default router;