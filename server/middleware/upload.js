const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { isConfigured: cloudinaryConfigured, uploadBuffer } = require('../config/cloudinary');

// ─── Constants ────────────────────────────────────────────────────────────────
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp'];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

// ─── File filter (shared) ─────────────────────────────────────────────────────
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return cb(new Error(`Invalid file type. Allowed: JPG, PNG, WebP.`), false);
  }

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(new Error(`Invalid file extension. Allowed: .jpg, .jpeg, .png, .webp`), false);
  }

  cb(null, true);
};

// ─── Storage strategy ─────────────────────────────────────────────────────────
let storage;

if (cloudinaryConfigured) {
  // Use memory storage — file stays in RAM, then we upload to Cloudinary
  storage = multer.memoryStorage();
} else {
  // Fallback: local disk storage for development
  const UPLOADS_DIR = path.join(__dirname, '../uploads');
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }

  storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
      // Never trust the original filename — generate a UUID-based safe filename
      const ext = path.extname(file.originalname).toLowerCase();
      const safeName = crypto.randomUUID() + ext;
      cb(null, safeName);
    },
  });
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

/**
 * Middleware: After multer processes the file, upload to Cloudinary if configured.
 * Sets req.fileUrl to the resulting URL (Cloudinary secure_url or local path).
 *
 * @param {string} folder — Cloudinary folder (e.g. 'honeychain/rescue')
 */
function processUpload(folder = 'honeychain') {
  return async (req, res, next) => {
    if (!req.file) return next();

    if (cloudinaryConfigured) {
      try {
        const result = await uploadBuffer(req.file.buffer, folder);
        req.fileUrl = result.secure_url;
        req.filePublicId = result.public_id;
      } catch (err) {
        console.error('Cloudinary upload error:', err.message);
        return res.status(500).json({ error: 'Image upload failed. Please try again.' });
      }
    } else {
      // Local storage — URL is relative to server
      req.fileUrl = `/uploads/${req.file.filename}`;
    }

    next();
  };
}

module.exports = upload;
module.exports.processUpload = processUpload;
