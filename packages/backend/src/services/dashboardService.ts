import { prisma } from '../config/database';
import { VehicleStatus, DriverStatus, TripStatus } from '@transport-ops/shared/enums';

export const getDashboardStats = async () => {
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
    prisma.vehicle.count({ where: { status: VehicleStatus.ON_TRIP } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.AVAILABLE } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.IN_SHOP } }),
    prisma.vehicle.count({ where: { status: VehicleStatus.RETIRED } }),
    prisma.trip.count({ where: { status: TripStatus.DISPATCHED } }),
    prisma.trip.count({ where: { status: TripStatus.DRAFT } }),
    prisma.driver.count({ where: { status: DriverStatus.ON_TRIP } }),
    prisma.driver.count({ where: { status: DriverStatus.AVAILABLE, licenseExpiryDate: { gt: new Date() } } }),
  ]);

  const totalVehicles = activeVehicles + availableVehicles + inShopVehicles;
  const fleetUtilizationPct = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

  return {
    activeVehicles,
    availableVehicles,
    inShopVehicles,
    retiredVehicles,
    activeTrips,
    pendingTrips,
    driversOnDuty,
    availableDrivers,
    fleetUtilizationPct,
  };
};
