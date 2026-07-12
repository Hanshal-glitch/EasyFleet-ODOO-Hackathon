import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { BusinessRuleError } from '../middleware/errorHandler';
import { createDriverSchema, updateDriverSchema, driverFiltersSchema } from '@transport-ops/shared/schemas';
import { DriverStatus } from '@transport-ops/shared/enums';

export const listDrivers = asyncHandler(async (req: Request, res: Response) => {
  const filters = driverFiltersSchema.parse(req.query);
  const { page, limit, sort, order, licenseExpiring, search, ...where } = filters;

  const whereClause: any = {};
  if (where.status) whereClause.status = where.status;
  if (search) {
    whereClause.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { licenseNumber: { contains: search, mode: 'insensitive' } },
      { contactNumber: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (licenseExpiring) {
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + licenseExpiring);
    whereClause.licenseExpiryDate = { lte: expiryDate };
  }

  const [drivers, total] = await Promise.all([
    prisma.driver.findMany({
      where: whereClause,
      orderBy: sort ? { [sort]: order || 'asc' } : { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { trips: true } },
      },
    }),
    prisma.driver.count({ where: whereClause }),
  ]);

  res.json({
    data: drivers,
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

export const getDriver = asyncHandler(async (req: Request, res: Response) => {
  const driver = await prisma.driver.findUnique({
    where: { id: req.params.id },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true } },
      _count: { select: { trips: true } },
    },
  });

  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  res.json({ driver });
});

export const createDriver = asyncHandler(async (req: Request, res: Response) => {
  const data = createDriverSchema.parse(req.body);

  const existing = await prisma.driver.findUnique({
    where: { licenseNumber: data.licenseNumber },
  });
  if (existing) {
    throw new BusinessRuleError('License number already exists');
  }

  const driver = await prisma.driver.create({
    data: {
      ...data,
      licenseExpiryDate: new Date(data.licenseExpiryDate),
      createdById: req.session.userId!,
    },
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  res.status(201).json({ driver });
});

export const updateDriver = asyncHandler(async (req: Request, res: Response) => {
  const data = updateDriverSchema.parse(req.body);

  const existing = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!existing) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  const updateData: any = { ...data, updatedById: req.session.userId };
  if (data.licenseExpiryDate) {
    updateData.licenseExpiryDate = new Date(data.licenseExpiryDate);
  }

  const driver = await prisma.driver.update({
    where: { id: req.params.id },
    data: updateData,
    include: {
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  res.json({ driver });
});

export const deleteDriver = asyncHandler(async (req: Request, res: Response) => {
  const driver = await prisma.driver.findUnique({ where: { id: req.params.id } });
  if (!driver) {
    return res.status(404).json({ error: 'Driver not found' });
  }

  if (driver.status === DriverStatus.ON_TRIP) {
    throw new BusinessRuleError('Cannot delete driver that is on a trip');
  }

  await prisma.driver.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

export const getAvailableForDispatch = asyncHandler(async (req: Request, res: Response) => {
  const drivers = await prisma.driver.findMany({
    where: {
      status: DriverStatus.AVAILABLE,
      licenseExpiryDate: { gt: new Date() },
    },
    select: {
      id: true,
      name: true,
      licenseNumber: true,
      licenseCategory: true,
      safetyScore: true,
    },
    orderBy: { name: 'asc' },
  });

  res.json({ drivers });
});

export const getExpiringLicenses = asyncHandler(async (req: Request, res: Response) => {
  const { days = 30 } = req.query;
  const expiryDate = new Date();
  expiryDate.setDate(expiryDate.getDate() + parseInt(days as string));

  const drivers = await prisma.driver.findMany({
    where: {
      licenseExpiryDate: { lte: expiryDate },
    },
    include: {
      user: { select: { id: true, email: true, firstName: true, lastName: true } },
    },
    orderBy: { licenseExpiryDate: 'asc' },
  });

  res.json({ drivers });
});