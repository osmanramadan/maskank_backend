import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';

export const uploadDirectory = path.resolve(process.cwd(), env.uploadDirectory);

const allowedMimeTypes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp']
]);

function fileFilter(_request, file, callback) {
  if (!allowedMimeTypes.has(file.mimetype)) {
    const error = new Error('Only JPEG, PNG, and WebP images are allowed');
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    return callback(error);
  }
  callback(null, true);
}

export const uploadPropertyImages = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: env.maxUploadFileSizeBytes,
    files: env.maxPropertyImages
  }
});
