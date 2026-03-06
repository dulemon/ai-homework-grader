import { Router } from 'express';
import multer from 'multer';
import { recognizeHomeworkImage } from '../services/ocrService.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configure multer for image uploads
const uploadsDir = join(__dirname, '..', 'uploads');
if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop();
    cb(null, `ocr_${Date.now()}.${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/bmp', 'image/tiff'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('仅支持 JPG/PNG/WebP/BMP/TIFF 图片格式'));
    }
  }
});

const router = Router();

/**
 * POST /api/ocr/recognize
 * Upload an image and extract text using OCR
 */
router.post('/recognize', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '请上传图片文件' });
    }

    console.log(`📸 OCR request: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    const result = await recognizeHomeworkImage(req.file.path);

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('OCR route error:', error);
    res.status(500).json({
      error: error.message || '图片识别失败'
    });
  }
});

export default router;
