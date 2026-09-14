import { cloudinary, assertCloudinaryConfigured } from '../config/cloudinary.js';
import { env } from '../config/env.js';
import { updateUserAvatar } from '../models/user.model.js';

type AvatarUploadResult = { secure_url: string };

function uploadAvatarToCloudinary(file): Promise<AvatarUploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `${env.cloudinaryFolder}/avatars`,
        resource_type: 'image',
        public_id: `user-${Date.now()}`
      },
      (error, result) => {
        if (error) reject(error);
        else if (!result || typeof result.secure_url !== 'string') reject(new Error('Cloudinary returned no upload URL'));
        else resolve({ secure_url: result.secure_url });
      }
    );
    stream.end(file.buffer);
  });
}

export async function updateAvatar(userId, file) {
  if (!file) {
    const error = new Error('An avatar image is required');
    error.statusCode = 400;
    throw error;
  }

  assertCloudinaryConfigured();
  const uploaded = await uploadAvatarToCloudinary(file);
  const user = await updateUserAvatar(userId, uploaded.secure_url);
  if (!user) {
    const error = new Error('User account not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
}
