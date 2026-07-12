import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { BusinessRuleError } from '../middleware/errorHandler';
import { createExpenseSchema, expenseFiltersSchema } from '@transport-ops/shared/schemas';
import { ExpenseType } from '@transport-ops/shared/enums';

export const listExpenses = asyncHandler(async (req: Request, res: Response) => {
  const filters = expenseFiltersSchema.parse(req.query);
  const { page, limit, sort, order, ...where } = filters;

  const whereClause: any = {};
  if (where.vehicleId) whereClause.vehicleId = where.vehicleId;
  if (where.type) whereClause.type = where.type;
  if (where.dateFrom || where.dateTo) {
    whereClause.date = {};
    if (where.dateFrom) whereClause.date.gte = new Date(where.dateFrom);
    if (where.dateTo) whereClause.date.lte = new Date(where.dateTo);
  }

  const [expenses, total] = await Promise.all([
    prisma.expense.findMany({
      where: whereClause,
      orderBy: sort ? { [sort]: order || 'desc' } : { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        vehicle: { select: { id: true, registrationNumber: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.expense.count({ where: whereClause }),
  ]);

  res.json({
    data: expenses,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

export const createExpense = asyncHandler(async (req: Request, res: Response) => {
  const data = createExpenseSchema.parse(req.body);

  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) {
    throw new BusinessRuleError('Vehicle not found');
  }

  const expense = await prisma.expense.create({
    data: {
      ...data,
      date: new Date(data.date),
      createdById: req.session.userId!,
    },
    include: {
      vehicle: { select: { id: true, registrationNumber: true, name: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  res.status(201).json({ expense });
});

export const getVehicleOperationalCost = asyncHandler(async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const { dateFrom, dateTo } = req.query;

  const where: any = { vehicleId };
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = new Date(dateFrom as string);
    if (dateTo) where.date.lte = new Date(dateTo as string);
  }

  const [fuelLogs, expenses] = await Promise.all([
    prisma.fuelLog.findMany({ where: { vehicleId, ...(dateFrom || dateTo ? { date: where.date } : {}) }, select: { totalCost: true } }),
    prisma.expense.findMany({ where: { vehicleId, type: { not: ExpenseType.FUEL }, ...(dateFrom || dateTo ? { date: where.date } : {}) }, select: { amount: true } }),
  ]);

  const fuelCost = fuelLogs.reduce((sum: number, log: { totalCost: number }) => sum + log.totalCost, 0);
  const maintenanceCost = expenses.reduce((sum: number, exp: { amount: number }) => sum + exp.amount, 0);

  res.json({
    vehicleId,
    fuelCost,
    maintenanceCost,
    totalCost: fuelCost + maintenanceCost,
  });
});