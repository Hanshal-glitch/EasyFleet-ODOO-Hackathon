import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { BusinessRuleError } from '../middleware/errorHandler';
import { createFuelLogSchema, fuelFiltersSchema } from '@transport-ops/shared/schemas';

export const listFuelLogs = asyncHandler(async (req: Request, res: Response) => {
  const filters = fuelFiltersSchema.parse(req.query);
  const { page, limit, sort, order, ...where } = filters;

  const whereClause: any = {};
  if (where.vehicleId) whereClause.vehicleId = where.vehicleId;
  if (where.dateFrom || where.dateTo) {
    whereClause.date = {};
    if (where.dateFrom) whereClause.date.gte = new Date(where.dateFrom);
    if (where.dateTo) whereClause.date.lte = new Date(where.dateTo);
  }

  const [fuelLogs, total] = await Promise.all([
    prisma.fuelLog.findMany({
      where: whereClause,
      orderBy: sort ? { [sort]: order || 'desc' } : { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        vehicle: { select: { id: true, registrationNumber: true, name: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.fuelLog.count({ where: whereClause }),
  ]);

  res.json({
    data: fuelLogs,
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

export const getFuelLog = asyncHandler(async (req: Request, res: Response) => {
  const fuelLog = await prisma.fuelLog.findUnique({
    where: { id: req.params.id },
    include: {
      vehicle: { select: { id: true, registrationNumber: true, name: true, type: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!fuelLog) {
    return res.status(404).json({ error: 'Fuel log not found' });
  }

  res.json({ fuelLog });
});

export const createFuelLog = asyncHandler(async (req: Request, res: Response) => {
  const data = createFuelLogSchema.parse(req.body);

  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) {
    throw new BusinessRuleError('Vehicle not found');
  }

  const totalCost = data.liters * data.costPerLiter;

  const fuelLog = await prisma.fuelLog.create({
    data: {
      ...data,
      totalCost,
      date: new Date(data.date),
      createdById: req.session.userId!,
    },
    include: {
      vehicle: { select: { id: true, registrationNumber: true, name: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  res.status(201).json({ fuelLog });
});