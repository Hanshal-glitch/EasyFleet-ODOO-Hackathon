import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { asyncHandler } from '../middleware/errorHandler';
import fs from 'fs';
import path from 'path';

export const getDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { vehicleId, driverId, type } = req.query;
  const where: any = {};
  
  if (vehicleId) where.vehicleId = vehicleId as string;
  if (driverId) where.driverId = driverId as string;
  if (type) where.type = type as string;

  const documents = await prisma.document.findMany({
    where,
    include: {
      vehicle: { select: { name: true, registrationNumber: true } },
      driver: { select: { name: true } },
      uploadedBy: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ data: documents });
});

export const getExpiringDocuments = asyncHandler(async (req: Request, res: Response) => {
  const { days = '30' } = req.query;
  const daysNum = parseInt(days as string, 10);
  
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysNum);

  const documents = await prisma.document.findMany({
    where: {
      expiryDate: {
        not: null,
        lte: futureDate,
        gte: new Date(),
      }
    },
    include: {
      vehicle: { select: { name: true, registrationNumber: true } },
      driver: { select: { name: true } },
    },
    orderBy: { expiryDate: 'asc' },
  });

  res.json({ data: documents });
});

export const uploadDocument = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { title, type, vehicleId, driverId, expiryDate } = req.body;

  if (!title || !type) {
    fs.unlinkSync(req.file.path); // Clean up
    return res.status(400).json({ error: 'Title and type are required' });
  }

  const userId = req.session.userId!;
  const fileUrl = `/uploads/${req.file.filename}`;

  const document = await prisma.document.create({
    data: {
      title,
      type,
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      fileUrl,
      fileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedById: userId,
    },
  });

  res.status(201).json({ data: document });
});

export const deleteDocument = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  // Delete file from disk
  const filePath = path.join(__dirname, '../../', document.fileUrl);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await prisma.document.delete({ where: { id } });

  res.json({ message: 'Document deleted successfully' });
});
