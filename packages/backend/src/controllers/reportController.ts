import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import { reportFiltersSchema, exportParamsSchema } from '@transport-ops/shared/schemas';
import { TripStatus, MaintenanceStatus } from '@transport-ops/shared/enums';
import PDFDocument from 'pdfkit';
import { stringify } from 'csv-stringify/sync';

async function getFuelEfficiencyData(filters: any) {
  const where: any = {};
  if (filters.vehicleId) where.vehicleId = filters.vehicleId;
  if (filters.vehicleType) where.vehicle = { type: filters.vehicleType };
  if (filters.region) where.vehicle = { ...where.vehicle, region: filters.region };
  const fuelWhere: any = { ...where };
  const tripWhere: any = { ...where };

  if (filters.dateFrom || filters.dateTo) {
    fuelWhere.date = {};
    tripWhere.completedAt = {};
    if (filters.dateFrom) {
      fuelWhere.date.gte = new Date(filters.dateFrom);
      tripWhere.completedAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      fuelWhere.date.lte = new Date(filters.dateTo);
      tripWhere.completedAt.lte = new Date(filters.dateTo);
    }
  }

  const fuelLogs = await prisma.fuelLog.findMany({
    where: fuelWhere,
    include: { vehicle: { select: { id: true, registrationNumber: true, name: true } } },
    orderBy: { date: 'asc' },
  });

  const trips = await prisma.trip.findMany({
    where: { ...tripWhere, status: TripStatus.COMPLETED },
    select: { vehicleId: true, actualDistanceKm: true },
  });

  const distanceByVehicle = trips.reduce((acc: Record<string, number>, t: any) => {
    acc[t.vehicleId] = (acc[t.vehicleId] || 0) + (t.actualDistanceKm || 0);
    return acc;
  }, {} as Record<string, number>);

  const vehicleStats: Record<string, any> = {};

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

  return Object.entries(vehicleStats).map(([vehicleId, v]) => ({
    vehicleId,
    vehicleRegistration: v.registration,
    vehicleName: v.name,
    totalDistanceKm: v.distance,
    totalFuelLiters: v.fuel,
    efficiencyKmPerLiter: v.fuel > 0 ? Math.round((v.distance / v.fuel) * 100) / 100 : 0,
  }));
}

export const getFuelEfficiency = asyncHandler(async (req: Request, res: Response) => {
  const filters = reportFiltersSchema.parse(req.query);
  const data = await getFuelEfficiencyData(filters);
  res.json({ data });
});

async function getFleetUtilizationData(filters: any) {
  const vehicleWhere: any = {};
  if (filters.vehicleType) vehicleWhere.type = filters.vehicleType;
  if (filters.region) vehicleWhere.region = filters.region;

  const vehicles = await prisma.vehicle.findMany({
    where: vehicleWhere,
    select: { id: true, registrationNumber: true, name: true, createdAt: true },
  });

  const tripWhere: any = { status: TripStatus.COMPLETED };
  if (filters.dateFrom || filters.dateTo) {
    tripWhere.completedAt = {};
    if (filters.dateFrom) tripWhere.completedAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) tripWhere.completedAt.lte = new Date(filters.dateTo);
  }

  const trips = await prisma.trip.findMany({
    where: tripWhere,
    select: { vehicleId: true, completedAt: true },
  });

  const tripDaysByVehicle: Record<string, Set<string>> = {};
  for (const trip of trips) {
    if (!trip.completedAt) continue;
    const dateStr = trip.completedAt.toISOString().split('T')[0];
    if (!tripDaysByVehicle[trip.vehicleId]) tripDaysByVehicle[trip.vehicleId] = new Set();
    tripDaysByVehicle[trip.vehicleId].add(dateStr);
  }

  return vehicles.map((v: any) => {
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
}

export const getFleetUtilization = asyncHandler(async (req: Request, res: Response) => {
  const filters = reportFiltersSchema.parse(req.query);
  const data = await getFleetUtilizationData(filters);
  res.json({ data });
});

async function getOperationalCostData(filters: any) {
  const vehicleWhere: any = {};
  if (filters.vehicleId) vehicleWhere.id = filters.vehicleId;
  if (filters.vehicleType) vehicleWhere.type = filters.vehicleType;
  if (filters.region) vehicleWhere.region = filters.region;

  const vehicles = await prisma.vehicle.findMany({
    where: vehicleWhere,
    select: { id: true, registrationNumber: true, name: true },
  });

  const dateWhereFuelExpense: any = {};
  const dateWhereMaintenance: any = {};
  if (filters.dateFrom || filters.dateTo) {
    dateWhereFuelExpense.date = {};
    dateWhereMaintenance.completedAt = {};
    if (filters.dateFrom) {
      dateWhereFuelExpense.date.gte = new Date(filters.dateFrom);
      dateWhereMaintenance.completedAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      dateWhereFuelExpense.date.lte = new Date(filters.dateTo);
      dateWhereMaintenance.completedAt.lte = new Date(filters.dateTo);
    }
  }

  const [fuelLogs, maintenanceLogs, otherExpenses] = await Promise.all([
    prisma.fuelLog.findMany({ where: { vehicleId: { in: vehicles.map((v: any) => v.id) }, ...dateWhereFuelExpense }, select: { vehicleId: true, totalCost: true } }),
    prisma.maintenanceLog.findMany({ where: { vehicleId: { in: vehicles.map((v: any) => v.id) }, status: MaintenanceStatus.COMPLETED, ...dateWhereMaintenance }, select: { vehicleId: true, cost: true } }),
    prisma.expense.findMany({ where: { vehicleId: { in: vehicles.map((v: any) => v.id) }, type: { not: 'FUEL' }, ...dateWhereFuelExpense }, select: { vehicleId: true, amount: true, type: true } }),
  ]);

  const fuelCostByVehicle = fuelLogs.reduce((acc: Record<string, number>, log: any) => {
    acc[log.vehicleId] = (acc[log.vehicleId] || 0) + log.totalCost;
    return acc;
  }, {} as Record<string, number>);

  const maintenanceCostByVehicle = maintenanceLogs.reduce((acc: Record<string, number>, log: any) => {
    acc[log.vehicleId] = (acc[log.vehicleId] || 0) + log.cost;
    return acc;
  }, {} as Record<string, number>);

  const otherCostByVehicle = otherExpenses.reduce((acc: Record<string, number>, exp: any) => {
    acc[exp.vehicleId] = (acc[exp.vehicleId] || 0) + exp.amount;
    return acc;
  }, {} as Record<string, number>);

  return vehicles.map((v: any) => ({
    vehicleId: v.id,
    vehicleRegistration: v.registrationNumber,
    vehicleName: v.name,
    fuelCost: fuelCostByVehicle[v.id] || 0,
    maintenanceCost: maintenanceCostByVehicle[v.id] || 0,
    totalCost: (fuelCostByVehicle[v.id] || 0) + (maintenanceCostByVehicle[v.id] || 0) + (otherCostByVehicle[v.id] || 0),
  }));
}

export const getOperationalCost = asyncHandler(async (req: Request, res: Response) => {
  const filters = reportFiltersSchema.parse(req.query);
  const data = await getOperationalCostData(filters);
  res.json({ data });
});

async function getVehicleROIData(filters: any) {
  const vehicleWhere: any = {};
  if (filters.vehicleId) vehicleWhere.id = filters.vehicleId;
  if (filters.vehicleType) vehicleWhere.type = filters.vehicleType;
  if (filters.region) vehicleWhere.region = filters.region;

  const vehicles = await prisma.vehicle.findMany({
    where: vehicleWhere,
    select: { id: true, registrationNumber: true, name: true, acquisitionCost: true },
  });

  const tripWhere: any = {};
  const fuelWhere: any = {};
  const maintenanceWhere: any = {};
  
  if (filters.dateFrom || filters.dateTo) {
    tripWhere.completedAt = {};
    fuelWhere.date = {};
    maintenanceWhere.completedAt = {};
    if (filters.dateFrom) {
      tripWhere.completedAt.gte = new Date(filters.dateFrom);
      fuelWhere.date.gte = new Date(filters.dateFrom);
      maintenanceWhere.completedAt.gte = new Date(filters.dateFrom);
    }
    if (filters.dateTo) {
      tripWhere.completedAt.lte = new Date(filters.dateTo);
      fuelWhere.date.lte = new Date(filters.dateTo);
      maintenanceWhere.completedAt.lte = new Date(filters.dateTo);
    }
  }

  const vehicleIds = vehicles.map((v: any) => v.id);

  const [trips, fuelLogs, maintenanceLogs] = await Promise.all([
    prisma.trip.findMany({ where: { vehicleId: { in: vehicleIds }, status: TripStatus.COMPLETED, ...tripWhere }, select: { vehicleId: true, revenue: true } }),
    prisma.fuelLog.findMany({ where: { vehicleId: { in: vehicleIds }, ...fuelWhere }, select: { vehicleId: true, totalCost: true } }),
    prisma.maintenanceLog.findMany({ where: { vehicleId: { in: vehicleIds }, status: MaintenanceStatus.COMPLETED, ...maintenanceWhere }, select: { vehicleId: true, cost: true } }),
  ]);

  const revenueByVehicle = trips.reduce((acc: Record<string, number>, t: any) => {
    acc[t.vehicleId] = (acc[t.vehicleId] || 0) + (t.revenue || 0);
    return acc;
  }, {} as Record<string, number>);

  const fuelCostByVehicle = fuelLogs.reduce((acc: Record<string, number>, log: any) => {
    acc[log.vehicleId] = (acc[log.vehicleId] || 0) + log.totalCost;
    return acc;
  }, {} as Record<string, number>);

  const maintenanceCostByVehicle = maintenanceLogs.reduce((acc: Record<string, number>, log: any) => {
    acc[log.vehicleId] = (acc[log.vehicleId] || 0) + log.cost;
    return acc;
  }, {} as Record<string, number>);

  return vehicles.map((v: any) => {
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
}

export const getVehicleROI = asyncHandler(async (req: Request, res: Response) => {
  const filters = reportFiltersSchema.parse(req.query);
  const data = await getVehicleROIData(filters);
  res.json({ data });
});

export const getReportSummary = asyncHandler(async (req: Request, res: Response) => {
  const filters = reportFiltersSchema.parse(req.query);
  
  const vehicleWhere: any = {};
  if (filters.vehicleType) vehicleWhere.type = filters.vehicleType;
  if (filters.region) vehicleWhere.region = filters.region;

  const totalVehicles = await prisma.vehicle.count({ where: vehicleWhere });
  
  const tripWhere: any = { ...vehicleWhere, status: TripStatus.COMPLETED };
  if (filters.dateFrom || filters.dateTo) {
    tripWhere.completedAt = {};
    if (filters.dateFrom) tripWhere.completedAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) tripWhere.completedAt.lte = new Date(filters.dateTo);
  }

  const trips = await prisma.trip.findMany({
    where: tripWhere,
    select: { revenue: true, actualDistanceKm: true }
  });

  const totalTrips = trips.length;
  const totalRevenue = trips.reduce((sum, t) => sum + (t.revenue || 0), 0);
  const totalDistance = trips.reduce((sum, t) => sum + (t.actualDistanceKm || 0), 0);

  const fuelWhere: any = { vehicle: vehicleWhere };
  if (filters.dateFrom || filters.dateTo) {
    fuelWhere.date = {};
    if (filters.dateFrom) fuelWhere.date.gte = new Date(filters.dateFrom);
    if (filters.dateTo) fuelWhere.date.lte = new Date(filters.dateTo);
  }

  const fuelLogs = await prisma.fuelLog.findMany({
    where: fuelWhere,
    select: { liters: true }
  });
  
  const totalFuel = fuelLogs.reduce((sum, l) => sum + l.liters, 0);
  const avgFuelEfficiency = totalFuel > 0 ? Math.round((totalDistance / totalFuel) * 100) / 100 : 0;

  res.json({
    totalVehicles,
    totalTrips,
    avgFuelEfficiency,
    totalRevenue
  });
});

export const exportReport = asyncHandler(async (req: Request, res: Response) => {
  const params = exportParamsSchema.parse(req.query);
  const { reportType, format, ...filters } = params;

  let data: any[] = [];
  let headers: string[] = [];
  let rows: string[][] = [];

  switch (reportType) {
    case 'fuel-efficiency':
      data = await getFuelEfficiencyData(filters);
      headers = ['Vehicle Name', 'Registration', 'Total Distance (km)', 'Total Fuel (L)', 'Efficiency (km/L)'];
      rows = data.map(r => [r.vehicleName, r.vehicleRegistration, String(r.totalDistanceKm), String(r.totalFuelLiters), String(r.efficiencyKmPerLiter)]);
      break;
    case 'fleet-utilization':
      data = await getFleetUtilizationData(filters);
      headers = ['Vehicle Name', 'Registration', 'Trip Days', 'Total Days', 'Utilization %'];
      rows = data.map(r => [r.vehicleName, r.vehicleRegistration, String(r.tripDays), String(r.totalDays), String(r.utilizationPct)]);
      break;
    case 'operational-cost':
      data = await getOperationalCostData(filters);
      headers = ['Vehicle Name', 'Registration', 'Fuel Cost (INR)', 'Maintenance Cost (INR)', 'Total Cost (INR)'];
      rows = data.map(r => [r.vehicleName, r.vehicleRegistration, String(r.fuelCost), String(r.maintenanceCost), String(r.totalCost)]);
      break;
    case 'vehicle-roi':
      data = await getVehicleROIData(filters);
      headers = ['Vehicle Name', 'Registration', 'Revenue (INR)', 'Fuel Cost (INR)', 'Maintenance Cost (INR)', 'Acquisition Cost (INR)', 'ROI %'];
      rows = data.map(r => [r.vehicleName, r.vehicleRegistration, String(r.revenue), String(r.fuelCost), String(r.maintenanceCost), String(r.acquisitionCost), String(r.roi)]);
      break;
    default:
      return res.status(400).json({ error: 'Unsupported report type' });
  }

  if (format === 'csv') {
    const csvData = stringify([headers, ...rows]);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-export.csv"`);
    res.send(csvData);
  } else if (format === 'pdf') {
    const doc = new PDFDocument({ margin: 30, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${reportType}-export.pdf"`);
    doc.pipe(res);

    doc.fontSize(20).text(`Report: ${reportType.replace('-', ' ').toUpperCase()}`, { align: 'center' });
    doc.moveDown();
    
    let filterText = 'Filters: ';
    if (filters.dateFrom) filterText += `From: ${filters.dateFrom} `;
    if (filters.dateTo) filterText += `To: ${filters.dateTo} `;
    if (filters.vehicleType) filterText += `Type: ${filters.vehicleType} `;
    if (filters.region) filterText += `Region: ${filters.region} `;
    if (filterText === 'Filters: ') filterText = 'Filters: None';
    
    doc.fontSize(10).text(filterText);
    doc.moveDown();

    const columnWidth = (doc.page.width - 60) / headers.length;
    let startY = doc.y;

    // Print headers
    doc.font('Helvetica-Bold');
    headers.forEach((header, i) => {
      doc.text(header, 30 + i * columnWidth, startY, { width: columnWidth, align: 'left' });
    });
    
    doc.moveDown();
    doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).stroke();
    doc.moveDown();

    doc.font('Helvetica');
    rows.forEach(row => {
      // Check if we need to add a new page
      if (doc.y > doc.page.height - 50) {
        doc.addPage();
        startY = doc.y;
        doc.font('Helvetica-Bold');
        headers.forEach((header, i) => {
          doc.text(header, 30 + i * columnWidth, startY, { width: columnWidth, align: 'left' });
        });
        doc.moveDown();
        doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).stroke();
        doc.moveDown();
        doc.font('Helvetica');
      }

      startY = doc.y;
      row.forEach((cell, i) => {
        doc.text(String(cell), 30 + i * columnWidth, startY, { width: columnWidth, align: 'left' });
      });
      doc.moveDown();
      doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y).strokeColor('#e5e5e5').stroke();
      doc.moveDown();
    });

    doc.end();
  } else {
    res.status(400).json({ error: 'Unsupported format' });
  }
});