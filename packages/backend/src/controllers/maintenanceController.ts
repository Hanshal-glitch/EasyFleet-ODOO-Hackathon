import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { BusinessRuleError } from '../middleware/errorHandler';
import { MaintenanceStatus } from '@transport-ops/shared/enums';
import { createMaintenanceSchema, closeMaintenanceSchema, maintenanceFiltersSchema } from '@transport-ops/shared/schemas';
import { BusinessRulesService } from '../services/businessRulesService';

export const listMaintenance = asyncHandler(async (req: Request, res: Response) => {
  const filters = maintenanceFiltersSchema.parse(req.query);
  const { page, limit, sort, order, ...where } = filters;

  const whereClause: any = {};
  if (where.vehicleId) whereClause.vehicleId = where.vehicleId;
  if (where.status) whereClause.status = where.status;
  if (where.dateFrom || where.dateTo) {
    whereClause.startedAt = {};
    if (where.dateFrom) whereClause.startedAt.gte = new Date(where.dateFrom);
    if (where.dateTo) whereClause.startedAt.lte = new Date(where.dateTo);
  }

  const [maintenance, total] = await Promise.all([
    prisma.maintenanceLog.findMany({
      where: whereClause,
      orderBy: sort ? { [sort]: order || 'asc' } : { startedAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        vehicle: { select: { id: true, registrationNumber: true, name: true, status: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.maintenanceLog.count({ where: whereClause }),
  ]);

  res.json({
    data: maintenance,
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

export const getMaintenance = asyncHandler(async (req: Request, res: Response) => {
  const maintenance = await prisma.maintenanceLog.findUnique({
    where: { id: req.params.id },
    include: {
      vehicle: { select: { id: true, registrationNumber: true, name: true, status: true, odometerKm: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!maintenance) {
    return res.status(404).json({ error: 'Maintenance record not found' });
  }

  res.json({ maintenance });
});

export const createMaintenance = asyncHandler(async (req: Request, res: Response) => {
  const data = createMaintenanceSchema.parse(req.body);
  const maintenance = await BusinessRulesService.openMaintenance(data, req.session.userId!);
  res.status(201).json({ maintenance });
});

export const closeMaintenance = asyncHandler(async (req: Request, res: Response) => {
  const data = closeMaintenanceSchema.parse(req.body);
  const maintenance = await BusinessRulesService.closeMaintenance(req.params.id, data, req.session.userId!);
  res.json({ maintenance });
});

export const getVehicleMaintenanceHistory = asyncHandler(async (req: Request, res: Response) => {
  const logs = await prisma.maintenanceLog.findMany({
    where: { vehicleId: req.params.vehicleId },
    orderBy: { startedAt: 'desc' },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  res.json({ logs });
});