import { v2 as cloudinary } from 'cloudinary';
import { env } from './env.js';

const hasCloudinaryCredentials = Boolean(
  env.cloudinaryCloudName &&
  env.cloudinaryApiKey &&
  env.cloudinaryApiSecret &&
  !env.cloudinaryCloudName.includes('your_') &&
  !env.cloudinaryApiKey.includes('your_') &&
  !env.cloudinaryApiSecret.includes('your_')
);

if (hasCloudinaryCredentials) {
  cloudinary.config({
    cloud_name: env.cloudinaryCloudName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret
  });
}

export function assertCloudinaryConfigured() {
  if (!hasCloudinaryCredentials) {
    throw Object.assign(new Error('Cloudinary credentials are not configured'), { statusCode: 503 });
  }
}

export { cloudinary };
