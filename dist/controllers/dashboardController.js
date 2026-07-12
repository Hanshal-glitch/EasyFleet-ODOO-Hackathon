"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCharts = exports.getKPIs = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const enums_1 = require("@transport-ops/shared/enums");
const schemas_1 = require("@transport-ops/shared/schemas");
const date_fns_1 = require("date-fns");
exports.getKPIs = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = schemas_1.dashboardFiltersSchema.parse(req.query);
    const vehicleWhere = {};
    if (filters.vehicleType)
        vehicleWhere.type = filters.vehicleType;
    if (filters.region)
        vehicleWhere.region = filters.region;
    const tripWhere = {};
    if (filters.dateFrom || filters.dateTo) {
        tripWhere.createdAt = {};
        if (filters.dateFrom)
            tripWhere.createdAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo)
            tripWhere.createdAt.lte = new Date(filters.dateTo);
    }
    const [activeVehicles, availableVehicles, inShopVehicles, retiredVehicles, activeTrips, pendingTrips, driversOnDuty, availableDrivers,] = await Promise.all([
        database_1.prisma.vehicle.count({ where: { ...vehicleWhere, status: enums_1.VehicleStatus.ON_TRIP } }),
        database_1.prisma.vehicle.count({ where: { ...vehicleWhere, status: enums_1.VehicleStatus.AVAILABLE } }),
        database_1.prisma.vehicle.count({ where: { ...vehicleWhere, status: enums_1.VehicleStatus.IN_SHOP } }),
        database_1.prisma.vehicle.count({ where: { ...vehicleWhere, status: enums_1.VehicleStatus.RETIRED } }),
        database_1.prisma.trip.count({ where: { ...tripWhere, status: enums_1.TripStatus.DISPATCHED } }),
        database_1.prisma.trip.count({ where: { ...tripWhere, status: enums_1.TripStatus.DRAFT } }),
        database_1.prisma.driver.count({ where: { status: enums_1.DriverStatus.ON_TRIP } }),
        database_1.prisma.driver.count({ where: { status: enums_1.DriverStatus.AVAILABLE, licenseExpiryDate: { gt: new Date() } } }),
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
exports.getCharts = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { metric, period } = schemas_1.chartParamsSchema.parse(req.query);
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    const startDate = (0, date_fns_1.subDays)(new Date(), days);
    const daysArray = (0, date_fns_1.eachDayOfInterval)({ start: startDate, end: new Date() });
    let data = [];
    switch (metric) {
        case 'utilization': {
            for (const day of daysArray) {
                const dayStart = (0, date_fns_1.startOfDay)(day);
                const dayEnd = (0, date_fns_1.endOfDay)(day);
                const [totalVehicles, onTripVehicles] = await Promise.all([
                    database_1.prisma.vehicle.count({ where: { status: { not: enums_1.VehicleStatus.RETIRED } } }),
                    database_1.prisma.trip.count({
                        where: {
                            status: enums_1.TripStatus.DISPATCHED,
                            dispatchedAt: { gte: dayStart, lte: dayEnd },
                        },
                    }),
                ]);
                data.push({
                    label: (0, date_fns_1.format)(day, 'MMM dd'),
                    value: totalVehicles > 0 ? Math.round((onTripVehicles / totalVehicles) * 100) : 0,
                    date: day.toISOString(),
                });
            }
            break;
        }
        case 'fuelEfficiency': {
            for (const day of daysArray) {
                const dayStart = (0, date_fns_1.startOfDay)(day);
                const dayEnd = (0, date_fns_1.endOfDay)(day);
                const trips = await database_1.prisma.trip.findMany({
                    where: {
                        status: enums_1.TripStatus.COMPLETED,
                        completedAt: { gte: dayStart, lte: dayEnd },
                        actualDistanceKm: { not: null },
                        fuelConsumedLiters: { not: null, gt: 0 },
                    },
                    select: { actualDistanceKm: true, fuelConsumedLiters: true },
                });
                const totalDistance = trips.reduce((sum, t) => sum + (t.actualDistanceKm || 0), 0);
                const totalFuel = trips.reduce((sum, t) => sum + (t.fuelConsumedLiters || 0), 0);
                data.push({
                    label: (0, date_fns_1.format)(day, 'MMM dd'),
                    value: totalFuel > 0 ? Math.round((totalDistance / totalFuel) * 100) / 100 : 0,
                    date: day.toISOString(),
                });
            }
            break;
        }
        case 'operationalCost': {
            for (const day of daysArray) {
                const dayStart = (0, date_fns_1.startOfDay)(day);
                const dayEnd = (0, date_fns_1.endOfDay)(day);
                const [fuelLogs, maintenanceLogs] = await Promise.all([
                    database_1.prisma.fuelLog.findMany({ where: { date: { gte: dayStart, lte: dayEnd } }, select: { totalCost: true } }),
                    database_1.prisma.maintenanceLog.findMany({ where: { startedAt: { gte: dayStart, lte: dayEnd }, status: enums_1.MaintenanceStatus.COMPLETED }, select: { cost: true } }),
                ]);
                const fuelCost = fuelLogs.reduce((sum, log) => sum + log.totalCost, 0);
                const maintenanceCost = maintenanceLogs.reduce((sum, log) => sum + log.cost, 0);
                data.push({
                    label: (0, date_fns_1.format)(day, 'MMM dd'),
                    value: Math.round(fuelCost + maintenanceCost),
                    date: day.toISOString(),
                });
            }
            break;
        }
        case 'revenue': {
            for (const day of daysArray) {
                const dayStart = (0, date_fns_1.startOfDay)(day);
                const dayEnd = (0, date_fns_1.endOfDay)(day);
                const revenueAgg = await database_1.prisma.trip.aggregate({
                    where: {
                        status: enums_1.TripStatus.COMPLETED,
                        completedAt: { gte: dayStart, lte: dayEnd },
                        revenue: { not: null },
                    },
                    _sum: { revenue: true },
                });
                data.push({
                    label: (0, date_fns_1.format)(day, 'MMM dd'),
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
