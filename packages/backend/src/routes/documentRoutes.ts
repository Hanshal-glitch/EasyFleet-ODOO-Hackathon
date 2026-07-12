import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { getDocuments, uploadDocument, deleteDocument, getExpiringDocuments } from '../controllers/documentController';
import { requireRole } from '../middleware/auth';

const router = Router();

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, and PNG are allowed.'));
    }
  },
});

router.get('/', getDocuments);
router.get('/expiring', requireRole('ADMIN', 'MANAGER'), getExpiringDocuments);
router.post('/', requireRole('ADMIN', 'MANAGER'), upload.single('file'), uploadDocument);
router.delete('/:id', requireRole('ADMIN', 'MANAGER'), deleteDocument);

export default router;
