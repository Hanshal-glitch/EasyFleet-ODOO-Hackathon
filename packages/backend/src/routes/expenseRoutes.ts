import { Router } from 'express';
import { z } from 'zod';
import { listExpenses, createExpense, getVehicleOperationalCost } from '../controllers/expenseController';
import { requireAuth, requireRole } from '../middleware/auth';
import { validateQuery, validateBody, validateParams } from '../middleware/validation';
import { createExpenseSchema, expenseFiltersSchema } from '@transport-ops/shared/schemas';
import { idParamSchema } from './commonSchemas';

const router = Router();

router.get('/', requireAuth, validateQuery(expenseFiltersSchema), listExpenses);
router.get('/vehicle/:vehicleId/operational-cost', requireAuth, validateParams(z.object({ vehicleId: idParamSchema.shape.id })), getVehicleOperationalCost);
router.post('/', requireAuth, requireRole('ADMIN', 'MANAGER'), validateBody(createExpenseSchema), createExpense);

export default router;