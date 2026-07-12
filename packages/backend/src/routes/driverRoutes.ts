import { Router } from 'express';
import {
  listDrivers,
  getDriver,
  createDriver,
  updateDriver,
  deleteDriver,
  getAvailableForDispatch,
  getExpiringLicenses,
} from '../controllers/driverController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateQuery, validateBody, validateParams } from '../middleware/validation';
import { createDriverSchema, updateDriverSchema, driverFiltersSchema } from '@transport-ops/shared/schemas';
import { idParamSchema } from './commonSchemas';

const router = Router();

router.get('/', requireAuth, validateQuery(driverFiltersSchema), listDrivers);
router.get('/available-for-dispatch', requireAuth, getAvailableForDispatch);
router.get('/expiring-licenses', requireAuth, requireRole('ADMIN', 'MANAGER'), getExpiringLicenses);
router.get('/:id', requireAuth, validateParams(idParamSchema), getDriver);
router.post('/', requireAuth, requireRole('ADMIN', 'MANAGER'), validateBody(createDriverSchema), createDriver);
router.patch('/:id', requireAuth, requireRole('ADMIN', 'MANAGER'), validateParams(idParamSchema), validateBody(updateDriverSchema), updateDriver);
router.delete('/:id', requireAuth, requireRole('ADMIN', 'MANAGER'), validateParams(idParamSchema), deleteDriver);

export default router;