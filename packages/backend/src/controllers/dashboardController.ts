import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { VehicleStatus, DriverStatus, TripStatus, VehicleType, MaintenanceStatus } from '@transport-ops/shared/enums';
import { dashboardFiltersSchema, chartParamsSchema } from '@transport-ops/shared/schemas';
import { subDays, startOfDay, endOfDay, format, eachDayOfInterval } from 'date-fns';

export const startTour = asyncHandler(async (req: Request, res: Response) => {
  // The tour is a UI walkthrough and must never alter shared operational data.
  res.json({ success: true });
});

export const endTour = asyncHandler(async (req: Request, res: Response) => {
  const user = await prisma.user.update({
    where: { id: req.session.userId! },
    data: { hasCompletedOnboardingTour: true },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      isActive: true,
      hasCompletedOnboardingTour: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  res.json({ success: true, user });
});

export const getKPIs = asyncHandler(async (req: Request, res: Response) => {
  const filters = dashboardFiltersSchema.parse(req.query);

  const vehicleWhere: any = {};
  if (filters.vehicleType) vehicleWhere.type = filters.vehicleType;
  if (filters.region) vehicleWhere.region = filters.region;

  const tripWhere: any = {};
  if (filters.dateFrom || filters.dateTo) {
    tripWhere.createdAt = {};
    if (filters.dateFrom) tripWhere.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) tripWhere.createdAt.lte = new Date(filters.dateTo);
  }

  const [
    activeVehicles,
    availableVehicles,
    inShopVehicles,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    availableDrivers,
  ] = await Promise.all([
    prisma.vehicle.count({ where: { ...vehicleWhere, status: VehicleStatus.ON_TRIP } }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: VehicleStatus.AVAILABLE } }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: VehicleStatus.IN_SHOP } }),
    prisma.vehicle.count({ where: { ...vehicleWhere, status: VehicleStatus.RETIRED } }),
    prisma.trip.count({ where: { ...tripWhere, status: TripStatus.DISPATCHED } }),
    prisma.trip.count({ where: { ...tripWhere, status: TripStatus.DRAFT } }),
    prisma.driver.count({ where: { status: DriverStatus.ON_TRIP } }),
    prisma.driver.count({ where: { status: DriverStatus.AVAILABLE, licenseExpiryDate: { gt: new Date() } } }),
  ]);

  const totalVehicles = activeVehicles + availableVehicles + inShopVehicles;
  const fleetUtilizationPct = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

  res.json({
    activeVehicles,
    availableVehicles,
    inShopVehicles,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    availableDrivers,
    fleetUtilizationPct,
  });
});

export const getCharts = asyncHandler(async (req: Request, res: Response) => {
  const { metric, period } = chartParamsSchema.parse(req.query);
  const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
  const startDate = subDays(new Date(), days);
  const daysArray = eachDayOfInterval({ start: startDate, end: new Date() });

  let data: any[] = [];

  switch (metric) {
    case 'utilization': {
      for (const day of daysArray) {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const [totalVehicles, onTripVehicles] = await Promise.all([
          prisma.vehicle.count({ where: { status: { not: VehicleStatus.RETIRED } } }),
          prisma.trip.count({
            where: {
              status: TripStatus.DISPATCHED,
              dispatchedAt: { gte: dayStart, lte: dayEnd },
            },
          }),
        ]);

        data.push({
          label: format(day, 'MMM dd'),
          value: totalVehicles > 0 ? Math.round((onTripVehicles / totalVehicles) * 100) : 0,
          date: day.toISOString(),
        });
      }
      break;
    }
    case 'fuelEfficiency': {
      for (const day of daysArray) {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const trips = await prisma.trip.findMany({
          where: {
            status: TripStatus.COMPLETED,
            completedAt: { gte: dayStart, lte: dayEnd },
            actualDistanceKm: { not: null },
            fuelConsumedLiters: { not: null, gt: 0 },
          },
          select: { actualDistanceKm: true, fuelConsumedLiters: true },
        });

        const totalDistance = trips.reduce((sum: number, t: { actualDistanceKm: number | null; fuelConsumedLiters: number | null }) => sum + (t.actualDistanceKm || 0), 0);
        const totalFuel = trips.reduce((sum: number, t: { actualDistanceKm: number | null; fuelConsumedLiters: number | null }) => sum + (t.fuelConsumedLiters || 0), 0);

        data.push({
          label: format(day, 'MMM dd'),
          value: totalFuel > 0 ? Math.round((totalDistance / totalFuel) * 100) / 100 : 0,
          date: day.toISOString(),
        });
      }
      break;
    }
    case 'operationalCost': {
      for (const day of daysArray) {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const [fuelLogs, maintenanceLogs] = await Promise.all([
          prisma.fuelLog.findMany({ where: { date: { gte: dayStart, lte: dayEnd } }, select: { totalCost: true } }),
          prisma.maintenanceLog.findMany({ where: { startedAt: { gte: dayStart, lte: dayEnd }, status: MaintenanceStatus.COMPLETED }, select: { cost: true } }),
        ]);

        const fuelCost = fuelLogs.reduce((sum: number, log: { totalCost: number }) => sum + log.totalCost, 0);
        const maintenanceCost = maintenanceLogs.reduce((sum: number, log: { cost: number }) => sum + log.cost, 0);

        data.push({
          label: format(day, 'MMM dd'),
          value: Math.round(fuelCost + maintenanceCost),
          date: day.toISOString(),
        });
      }
      break;
    }
    case 'revenue': {
      for (const day of daysArray) {
        const dayStart = startOfDay(day);
        const dayEnd = endOfDay(day);

        const revenueAgg = await prisma.trip.aggregate({
          where: {
            status: TripStatus.COMPLETED,
            completedAt: { gte: dayStart, lte: dayEnd },
            revenue: { not: null },
          },
          _sum: { revenue: true },
        });

        data.push({
          label: format(day, 'MMM dd'),
          value: Math.round(revenueAgg._sum.revenue || 0),
          date: day.toISOString(),
        });
      }
      break;
    }
  }

  res.json({
    labels: data.map(d => d.label),
    datasets: [{
      label: metric,
      data: data.map(d => d.value),
      borderColor: 'hsl(var(--color-primary))',
      backgroundColor: 'hsl(var(--color-primary) / 0.1)',
    }],
  });
});
