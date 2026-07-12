import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { BusinessRuleError } from '../middleware/errorHandler';
import { VehicleStatus, VehicleType } from '@transport-ops/shared/enums';
import { createVehicleSchema, updateVehicleSchema, vehicleFiltersSchema, availableVehiclesSchema } from '@transport-ops/shared/schemas';

export const listVehicles = asyncHandler(async (req: Request, res: Response) => {
  const filters = vehicleFiltersSchema.parse(req.query);
  const { page, limit, sort, order, ...where } = filters;

  const whereClause: any = {};
  if (where.status) whereClause.status = where.status;
  if (where.type) whereClause.type = where.type;
  if (where.region) whereClause.region = where.region;
  if (where.search) {
    whereClause.OR = [
      { registrationNumber: { contains: where.search, mode: 'insensitive' } },
      { name: { contains: where.search, mode: 'insensitive' } },
      { model: { contains: where.search, mode: 'insensitive' } },
    ];
  }

  const [vehicles, total] = await Promise.all([
    prisma.vehicle.findMany({
      where: whereClause,
      orderBy: sort ? { [sort]: order || 'asc' } : { registrationNumber: 'asc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { trips: true, maintenanceLogs: true, fuelLogs: true, expenses: true, documents: true } },
      },
    }),
    prisma.vehicle.count({ where: whereClause }),
  ]);

  res.json({
    data: vehicles,
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

export const getVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: req.params.id },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { trips: true, maintenanceLogs: true, fuelLogs: true, expenses: true, documents: true } },
    },
  });

  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  res.json({ vehicle });
});

export const createVehicle = asyncHandler(async (req: Request, res: Response) => {
  const data = createVehicleSchema.parse(req.body);

  const existing = await prisma.vehicle.findUnique({
    where: { registrationNumber: data.registrationNumber },
  });
  if (existing) {
    throw new BusinessRuleError('Registration number already exists');
  }

  const vehicle = await prisma.vehicle.create({
    data: {
      ...data,
      createdById: req.session.userId!,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  res.status(201).json({ vehicle });
});

export const updateVehicle = asyncHandler(async (req: Request, res: Response) => {
  const data = updateVehicleSchema.parse(req.body);

  const existing = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  if (data.registrationNumber && data.registrationNumber !== existing.registrationNumber) {
    const duplicate = await prisma.vehicle.findUnique({
      where: { registrationNumber: data.registrationNumber },
    });
    if (duplicate) {
      throw new BusinessRuleError('Registration number already exists');
    }
  }

  const vehicle = await prisma.vehicle.update({
    where: { id: req.params.id },
    data: { ...data, updatedById: req.session.userId },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  res.json({ vehicle });
});

export const deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
  const vehicle = await prisma.vehicle.findUnique({ where: { id: req.params.id } });
  if (!vehicle) {
    return res.status(404).json({ error: 'Vehicle not found' });
  }

  if (vehicle.status === VehicleStatus.ON_TRIP) {
    throw new BusinessRuleError('Cannot retire vehicle that is on a trip');
  }

  await prisma.vehicle.update({
    where: { id: req.params.id },
    data: { status: VehicleStatus.RETIRED, updatedById: req.session.userId },
  });

  res.json({ success: true });
});

export const getAvailableForDispatch = asyncHandler(async (req: Request, res: Response) => {
  const { cargoWeightKg } = availableVehiclesSchema.parse(req.query);

  const where: any = {
    status: VehicleStatus.AVAILABLE,
  };

  if (cargoWeightKg) {
    where.maxLoadCapacityKg = { gte: cargoWeightKg };
  }

  const vehicles = await prisma.vehicle.findMany({
    where,
    select: {
      id: true,
      registrationNumber: true,
      name: true,
      type: true,
      maxLoadCapacityKg: true,
      odometerKm: true,
    },
    orderBy: { registrationNumber: 'asc' },
  });

  res.json({ vehicles });
});