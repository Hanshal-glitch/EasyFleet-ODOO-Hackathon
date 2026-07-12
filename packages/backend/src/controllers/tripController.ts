import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { BusinessRuleError } from '../middleware/errorHandler';
import {
  createTripSchema,
  completeTripSchema,
  cancelTripSchema,
  tripFiltersSchema,
  availableVehiclesSchema,
  availableDriversSchema,
} from '@transport-ops/shared/schemas';
import { BusinessRulesService } from '../services/businessRulesService';
import { TripStatus, VehicleStatus, DriverStatus } from '@transport-ops/shared/enums';

export const listTrips = asyncHandler(async (req: Request, res: Response) => {
  const filters = tripFiltersSchema.parse(req.query);
  const { page, limit, sort, order, ...where } = filters;

  const whereClause: any = {};
  if (where.status) whereClause.status = where.status;
  if (where.vehicleId) whereClause.vehicleId = where.vehicleId;
  if (where.driverId) whereClause.driverId = where.driverId;
  if (where.dateFrom || where.dateTo) {
    whereClause.createdAt = {};
    if (where.dateFrom) whereClause.createdAt.gte = new Date(where.dateFrom);
    if (where.dateTo) whereClause.createdAt.lte = new Date(where.dateTo);
  }

  const [trips, total] = await Promise.all([
    prisma.trip.findMany({
      where: whereClause,
      orderBy: sort ? { [sort]: order || 'desc' } : { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        vehicle: { select: { id: true, registrationNumber: true, name: true, type: true, maxLoadCapacityKg: true } },
        driver: { select: { id: true, name: true, licenseNumber: true, status: true } },
        createdBy: { select: { id: true, firstName: true, lastName: true } },
        updatedBy: { select: { id: true, firstName: true, lastName: true } },
      },
    }),
    prisma.trip.count({ where: whereClause }),
  ]);

  res.json({
    data: trips,
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

export const getTrip = asyncHandler(async (req: Request, res: Response) => {
  const trip = await prisma.trip.findUnique({
    where: { id: req.params.id },
    include: {
      vehicle: {
        select: {
          id: true,
          registrationNumber: true,
          name: true,
          type: true,
          maxLoadCapacityKg: true,
          odometerKm: true,
          status: true,
        },
      },
      driver: {
        select: {
          id: true,
          name: true,
          licenseNumber: true,
          licenseCategory: true,
          licenseExpiryDate: true,
          safetyScore: true,
          status: true,
        },
      },
      createdBy: { select: { id: true, firstName: true, lastName: true } },
      updatedBy: { select: { id: true, firstName: true, lastName: true } },
    },
  });

  if (!trip) {
    return res.status(404).json({ error: 'Trip not found' });
  }

  res.json({ trip });
});

export const createTrip = asyncHandler(async (req: Request, res: Response) => {
  const data = createTripSchema.parse(req.body);

  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) throw new BusinessRuleError('Vehicle not found');

  const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
  if (!driver) throw new BusinessRuleError('Driver not found');

  await BusinessRulesService.assertVehicleAvailable(data.vehicleId);
  await BusinessRulesService.assertDriverEligible(data.driverId);
  BusinessRulesService.assertCargoWeightValid(vehicle, data.cargoWeightKg);

  const trip = await prisma.trip.create({
    data: {
      ...data,
      createdById: req.session.userId!,
      status: TripStatus.DRAFT,
    },
    include: {
      vehicle: { select: { id: true, registrationNumber: true, name: true } },
      driver: { select: { id: true, name: true, licenseNumber: true } },
    },
  });

  res.status(201).json({ trip });
});

export const dispatchTrip = asyncHandler(async (req: Request, res: Response) => {
  const trip = await BusinessRulesService.dispatchTrip(req.params.id, req.session.userId!);
  res.json({ trip });
});

export const completeTrip = asyncHandler(async (req: Request, res: Response) => {
  const data = completeTripSchema.parse(req.body);
  const trip = await BusinessRulesService.completeTrip(req.params.id, data, req.session.userId!);
  res.json({ trip });
});

export const cancelTrip = asyncHandler(async (req: Request, res: Response) => {
  const data = cancelTripSchema.parse(req.body);
  const trip = await BusinessRulesService.cancelTrip(req.params.id, data.reason, req.session.userId!);
  res.json({ trip });
});

export const getTripStats = asyncHandler(async (req: Request, res: Response) => {
  const { dateFrom, dateTo, vehicleType, region } = req.query;

  const where: any = {};
  if (dateFrom || dateTo) {
    where.createdAt = {};
    if (dateFrom) where.createdAt.gte = new Date(dateFrom as string);
    if (dateTo) where.createdAt.lte = new Date(dateTo as string);
  }

  const [activeTrips, pendingTrips, completedTrips, cancelledTrips, totalRevenue, totalDistance] = await Promise.all([
    prisma.trip.count({ where: { ...where, status: TripStatus.DISPATCHED } }),
    prisma.trip.count({ where: { ...where, status: TripStatus.DRAFT } }),
    prisma.trip.count({ where: { ...where, status: TripStatus.COMPLETED } }),
    prisma.trip.count({ where: { ...where, status: TripStatus.CANCELLED } }),
    prisma.trip.aggregate({
      where: { ...where, status: TripStatus.COMPLETED },
      _sum: { revenue: true },
    }),
    prisma.trip.aggregate({
      where: { ...where, status: TripStatus.COMPLETED },
      _sum: { actualDistanceKm: true },
    }),
  ]);

  res.json({
    activeTrips,
    pendingTrips,
    completedTrips,
    cancelledTrips,
    totalRevenue: totalRevenue._sum.revenue || 0,
    totalDistance: totalDistance._sum.actualDistanceKm || 0,
  });
});

export const getAvailableVehicles = asyncHandler(async (req: Request, res: Response) => {
  const { cargoWeightKg } = availableVehiclesSchema.parse(req.query);
  const vehicles = await BusinessRulesService.getAvailableVehiclesForDispatch(cargoWeightKg);
  res.json({ vehicles });
});

export const getAvailableDrivers = asyncHandler(async (req: Request, res: Response) => {
  const drivers = await BusinessRulesService.getAvailableDriversForDispatch();
  res.json({ drivers });
});