'use strict';
/**
 * Cloudinary configuration for HoneyChain image uploads.
 *
 * Required environment variables (backend-only, NEVER expose to frontend):
 *   CLOUDINARY_CLOUD_NAME
 *   CLOUDINARY_API_KEY
 *   CLOUDINARY_API_SECRET
 *
 * If not configured, falls back to local disk storage (server/uploads/).
 */

const cloudinary = require('cloudinary').v2;
const { Readable } = require('stream');

const isConfigured = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (isConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('☁️  Cloudinary configured for persistent image storage');
} else {
  console.warn(
    '⚠️  Cloudinary NOT configured — images will use local disk (ephemeral on Render).\n' +
    '   Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in server/.env'
  );
}

/**
 * Upload a file buffer to Cloudinary.
 * @param {Buffer} buffer — file buffer from multer memoryStorage
 * @param {string} folder — Cloudinary folder (e.g. 'honeychain/rescue')
 * @returns {Promise<{ secure_url: string, public_id: string }>}
 */
async function uploadBuffer(buffer, folder = 'honeychain') {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({ secure_url: result.secure_url, public_id: result.public_id });
      }
    );
    const readable = Readable.from(buffer);
    readable.pipe(uploadStream);
  });
}

module.exports = {
  cloudinary,
  isConfigured,
  uploadBuffer,
};
