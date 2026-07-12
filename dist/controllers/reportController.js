"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportReport = exports.getVehicleROI = exports.getOperationalCost = exports.getFleetUtilization = exports.getFuelEfficiency = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const schemas_1 = require("@transport-ops/shared/schemas");
const enums_1 = require("@transport-ops/shared/enums");
exports.getFuelEfficiency = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = schemas_1.reportFiltersSchema.parse(req.query);
    const where = {};
    if (filters.vehicleId)
        where.vehicleId = filters.vehicleId;
    if (filters.vehicleType)
        where.vehicle = { type: filters.vehicleType };
    if (filters.region)
        where.vehicle = { ...where.vehicle, region: filters.region };
    if (filters.dateFrom || filters.dateTo) {
        where.date = {};
        if (filters.dateFrom)
            where.date.gte = new Date(filters.dateFrom);
        if (filters.dateTo)
            where.date.lte = new Date(filters.dateTo);
    }
    const fuelLogs = await database_1.prisma.fuelLog.findMany({
        where,
        include: { vehicle: { select: { id: true, registrationNumber: true, name: true } } },
        orderBy: { date: 'asc' },
    });
    const trips = await database_1.prisma.trip.findMany({
        where: { ...where, status: enums_1.TripStatus.COMPLETED },
        select: { vehicleId: true, actualDistanceKm: true },
    });
    const distanceByVehicle = trips.reduce((acc, t) => {
        acc[t.vehicleId] = (acc[t.vehicleId] || 0) + (t.actualDistanceKm || 0);
        return acc;
    }, {});
    const vehicleStats = {};
    for (const log of fuelLogs) {
        if (!vehicleStats[log.vehicleId]) {
            vehicleStats[log.vehicleId] = {
                registration: log.vehicle.registrationNumber,
                name: log.vehicle.name,
                distance: 0,
                fuel: 0,
            };
        }
        vehicleStats[log.vehicleId].fuel += log.liters;
        vehicleStats[log.vehicleId].distance = distanceByVehicle[log.vehicleId] || 0;
    }
    const data = Object.entries(vehicleStats).map(([vehicleId, v]) => ({
        vehicleId,
        vehicleRegistration: v.registration,
        vehicleName: v.name,
        totalDistanceKm: v.distance,
        totalFuelLiters: v.fuel,
        efficiencyKmPerLiter: v.fuel > 0 ? Math.round((v.distance / v.fuel) * 100) / 100 : 0,
    }));
    res.json({ data });
});
exports.getFleetUtilization = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = schemas_1.reportFiltersSchema.parse(req.query);
    const vehicleWhere = {};
    if (filters.vehicleType)
        vehicleWhere.type = filters.vehicleType;
    if (filters.region)
        vehicleWhere.region = filters.region;
    const vehicles = await database_1.prisma.vehicle.findMany({
        where: vehicleWhere,
        select: { id: true, registrationNumber: true, name: true, createdAt: true },
    });
    const tripWhere = { status: enums_1.TripStatus.COMPLETED };
    if (filters.dateFrom || filters.dateTo) {
        tripWhere.completedAt = {};
        if (filters.dateFrom)
            tripWhere.completedAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo)
            tripWhere.completedAt.lte = new Date(filters.dateTo);
    }
    const trips = await database_1.prisma.trip.findMany({
        where: tripWhere,
        select: { vehicleId: true, completedAt: true },
    });
    const tripDaysByVehicle = {};
    for (const trip of trips) {
        if (!trip.completedAt)
            continue;
        const dateStr = trip.completedAt.toISOString().split('T')[0];
        if (!tripDaysByVehicle[trip.vehicleId])
            tripDaysByVehicle[trip.vehicleId] = new Set();
        tripDaysByVehicle[trip.vehicleId].add(dateStr);
    }
    const data = vehicles.map((v) => {
        const tripDays = tripDaysByVehicle[v.id]?.size || 0;
        const daysSinceCreation = Math.max(1, Math.floor((Date.now() - v.createdAt.getTime()) / (1000 * 60 * 60 * 24)));
        return {
            vehicleId: v.id,
            vehicleRegistration: v.registrationNumber,
            vehicleName: v.name,
            tripDays,
            totalDays: daysSinceCreation,
            utilizationPct: daysSinceCreation > 0 ? Math.round((tripDays / daysSinceCreation) * 10000) / 100 : 0,
        };
    });
    res.json({ data });
});
exports.getOperationalCost = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = schemas_1.reportFiltersSchema.parse(req.query);
    const vehicleWhere = {};
    if (filters.vehicleId)
        vehicleWhere.id = filters.vehicleId;
    if (filters.vehicleType)
        vehicleWhere.type = filters.vehicleType;
    if (filters.region)
        vehicleWhere.region = filters.region;
    const vehicles = await database_1.prisma.vehicle.findMany({
        where: vehicleWhere,
        select: { id: true, registrationNumber: true, name: true },
    });
    const dateWhere = {};
    if (filters.dateFrom || filters.dateTo) {
        dateWhere.date = {};
        if (filters.dateFrom)
            dateWhere.date.gte = new Date(filters.dateFrom);
        if (filters.dateTo)
            dateWhere.date.lte = new Date(filters.dateTo);
    }
    const [fuelLogs, maintenanceLogs, otherExpenses] = await Promise.all([
        database_1.prisma.fuelLog.findMany({ where: { vehicleId: { in: vehicles.map(v => v.id) }, ...dateWhere }, select: { vehicleId: true, totalCost: true } }),
        database_1.prisma.maintenanceLog.findMany({ where: { vehicleId: { in: vehicles.map(v => v.id) }, status: enums_1.MaintenanceStatus.COMPLETED, ...dateWhere }, select: { vehicleId: true, cost: true } }),
        database_1.prisma.expense.findMany({ where: { vehicleId: { in: vehicles.map(v => v.id) }, type: { not: 'FUEL' }, ...dateWhere }, select: { vehicleId: true, amount: true, type: true } }),
    ]);
    const fuelCostByVehicle = fuelLogs.reduce((acc, log) => {
        acc[log.vehicleId] = (acc[log.vehicleId] || 0) + log.totalCost;
        return acc;
    }, {});
    const maintenanceCostByVehicle = maintenanceLogs.reduce((acc, log) => {
        acc[log.vehicleId] = (acc[log.vehicleId] || 0) + log.cost;
        return acc;
    }, {});
    const otherCostByVehicle = otherExpenses.reduce((acc, exp) => {
        acc[exp.vehicleId] = (acc[exp.vehicleId] || 0) + exp.amount;
        return acc;
    }, {});
    const data = vehicles.map((v) => ({
        vehicleId: v.id,
        vehicleRegistration: v.registrationNumber,
        vehicleName: v.name,
        fuelCost: fuelCostByVehicle[v.id] || 0,
        maintenanceCost: maintenanceCostByVehicle[v.id] || 0,
        totalCost: (fuelCostByVehicle[v.id] || 0) + (maintenanceCostByVehicle[v.id] || 0) + (otherCostByVehicle[v.id] || 0),
    }));
    res.json({ data });
});
exports.getVehicleROI = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const filters = schemas_1.reportFiltersSchema.parse(req.query);
    const vehicleWhere = {};
    if (filters.vehicleId)
        vehicleWhere.id = filters.vehicleId;
    if (filters.vehicleType)
        vehicleWhere.type = filters.vehicleType;
    if (filters.region)
        vehicleWhere.region = filters.region;
    const vehicles = await database_1.prisma.vehicle.findMany({
        where: vehicleWhere,
        select: { id: true, registrationNumber: true, name: true, acquisitionCost: true },
    });
    const dateWhere = {};
    if (filters.dateFrom || filters.dateTo) {
        dateWhere.completedAt = {};
        if (filters.dateFrom)
            dateWhere.completedAt.gte = new Date(filters.dateFrom);
        if (filters.dateTo)
            dateWhere.completedAt.lte = new Date(filters.dateTo);
    }
    const vehicleIds = vehicles.map((v) => v.id);
    const [trips, fuelLogs, maintenanceLogs] = await Promise.all([
        database_1.prisma.trip.findMany({ where: { vehicleId: { in: vehicleIds }, status: enums_1.TripStatus.COMPLETED, ...dateWhere }, select: { vehicleId: true, revenue: true } }),
        database_1.prisma.fuelLog.findMany({ where: { vehicleId: { in: vehicleIds }, ...dateWhere }, select: { vehicleId: true, totalCost: true } }),
        database_1.prisma.maintenanceLog.findMany({ where: { vehicleId: { in: vehicleIds }, status: enums_1.MaintenanceStatus.COMPLETED, ...dateWhere }, select: { vehicleId: true, cost: true } }),
    ]);
    const revenueByVehicle = trips.reduce((acc, t) => {
        acc[t.vehicleId] = (acc[t.vehicleId] || 0) + (t.revenue || 0);
        return acc;
    }, {});
    const fuelCostByVehicle = fuelLogs.reduce((acc, log) => {
        acc[log.vehicleId] = (acc[log.vehicleId] || 0) + log.totalCost;
        return acc;
    }, {});
    const maintenanceCostByVehicle = maintenanceLogs.reduce((acc, log) => {
        acc[log.vehicleId] = (acc[log.vehicleId] || 0) + log.cost;
        return acc;
    }, {});
    const data = vehicles.map((v) => {
        const revenue = revenueByVehicle[v.id] || 0;
        const fuelCost = fuelCostByVehicle[v.id] || 0;
        const maintenanceCost = maintenanceCostByVehicle[v.id] || 0;
        const totalCost = fuelCost + maintenanceCost;
        const roi = v.acquisitionCost > 0 ? Math.round(((revenue - totalCost) / v.acquisitionCost) * 10000) / 100 : 0;
        return {
            vehicleId: v.id,
            vehicleRegistration: v.registrationNumber,
            vehicleName: v.name,
            revenue,
            fuelCost,
            maintenanceCost,
            acquisitionCost: v.acquisitionCost,
            roi,
        };
    });
    res.json({ data });
});
exports.exportReport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const params = schemas_1.exportParamsSchema.parse(req.query);
    const { reportType, format, ...filters } = params;
    // This is a simplified version - in production you'd implement actual CSV/PDF generation
    // For now, we'll return a message indicating the feature is in progress
    res.json({
        message: `Export ${reportType} as ${format.toUpperCase()} - Implementation in progress`,
        filters,
    });
});
