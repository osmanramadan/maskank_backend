import 'dotenv/config';
import type { SignOptions } from 'jsonwebtoken';

const requiredInProduction = ['DATABASE_URL', 'JWT_SECRET'];

if (process.env.NODE_ENV === 'production') {
  const missing = requiredInProduction.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

export const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT || 5000),
  databaseUrl: process.env.DATABASE_URL || '',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtSecret: process.env.JWT_SECRET || 'development-only-secret',
  jwtExpiresIn: (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'],
  bcryptSaltRounds: Number(process.env.BCRYPT_SALT_ROUNDS || 12),
  uploadDirectory: process.env.UPLOAD_DIRECTORY || 'uploads',
  maxUploadFileSizeBytes: Number(process.env.MAX_UPLOAD_FILE_SIZE_BYTES || 5242880),
  maxPropertyImages: Number(process.env.MAX_PROPERTY_IMAGES || 10),
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || '',
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || '',
  cloudinaryFolder: process.env.CLOUDINARY_FOLDER || 'maskank/properties',
  dbPoolMax: Number(process.env.DB_POOL_MAX || 10),
  dbIdleTimeoutMs: Number(process.env.DB_IDLE_TIMEOUT_MS || 10000),
  dbConnectionTimeoutMs: Number(process.env.DB_CONNECTION_TIMEOUT_MS || 5000)
  , smtpHost: process.env.SMTP_HOST?.trim() || ''
  , smtpPort: Number(process.env.SMTP_PORT || 587)
  , smtpSecure: process.env.SMTP_SECURE?.trim().toLowerCase() === 'true'
  , smtpUser: process.env.SMTP_USER?.trim() || ''
  , smtpPassword: process.env.SMTP_PASSWORD || ''
  , contactEmail: process.env.CONTACT_EMAIL?.trim() || ''
};
