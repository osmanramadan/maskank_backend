import fs from 'node:fs/promises';
import path from 'node:path';
import { cloudinary, assertCloudinaryConfigured } from '../config/cloudinary.js';
import { pool } from '../config/database.js';
import { env } from '../config/env.js';
import { uploadDirectory } from '../middleware/upload.middleware.js';

function imageError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function parseId(value, field) {
  const id = Number(value);
  if (!Number.isInteger(id) || id < 1) throw imageError(`Invalid ${field}`);
  return id;
}

function uploadToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: env.cloudinaryFolder,
        resource_type: 'image'
      },
      (error, result) => {
        if (error) reject(error);
        else if (!result) reject(new Error('Cloudinary returned no upload result'));
        else resolve(result);
      }
    );
    stream.end(file.buffer);
  });
}

async function removeCloudinaryImages(images) {
  await Promise.all(
    images
      .filter((image) => image.public_id)
      .map((image) => cloudinary.uploader.destroy(image.public_id, { resource_type: 'image' }))
  );
}

async function findOwnedProperty(client, propertyId, ownerId) {
  const result = await client.query(
    'SELECT id FROM properties WHERE id = $1 AND owner_id = $2',
    [propertyId, ownerId]
  );
  return result.rows[0] || null;
}

export async function addPropertyImages(propertyIdValue, ownerId, files) {
  const propertyId = parseId(propertyIdValue, 'property id');
  if (!files || files.length === 0) throw imageError('At least one image is required');
  assertCloudinaryConfigured();

  const client = await pool.connect();
  const uploadedImages = [];
  try {
    const property = await findOwnedProperty(client, propertyId, ownerId);
    if (!property) throw imageError('Property not found', 404);

    const existing = await client.query(
      'SELECT COUNT(*)::int AS total FROM property_images WHERE property_id = $1',
      [propertyId]
    );
    const existingCount = existing.rows[0].total;
    if (existingCount + files.length > env.maxPropertyImages) {
      throw imageError(`A property can have at most ${env.maxPropertyImages} images`);
    }

    for (const file of files) {
      uploadedImages.push(await uploadToCloudinary(file));
    }

    await client.query('BEGIN');
    const insertedImages = [];
    for (const [index, image] of uploadedImages.entries()) {
      const file = files[index];
      const result = await client.query(
        `INSERT INTO property_images (
          property_id, file_path, cloudinary_public_id, original_name, mime_type, file_size_bytes,
          display_order, is_main
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, property_id, file_path, cloudinary_public_id, original_name, mime_type, file_size_bytes, display_order, is_main`,
        [
          propertyId,
          image.secure_url,
          image.public_id,
          file.originalname,
          file.mimetype,
          file.size,
          existingCount + index,
          existingCount === 0 && index === 0
        ]
      );
      insertedImages.push(result.rows[0]);
    }

    await client.query('COMMIT');
    return insertedImages;
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    await removeCloudinaryImages(uploadedImages).catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function deletePropertyImage(propertyIdValue, imageIdValue, ownerId) {
  const propertyId = parseId(propertyIdValue, 'property id');
  const imageId = parseId(imageIdValue, 'image id');
  const client = await pool.connect();

  try {
    const result = await client.query(
      `DELETE FROM property_images pi
       USING properties p
       WHERE pi.id = $1 AND pi.property_id = $2
         AND p.id = pi.property_id AND p.owner_id = $3
       RETURNING pi.file_path, pi.cloudinary_public_id`,
      [imageId, propertyId, ownerId]
    );
    if (!result.rows[0]) throw imageError('Image not found', 404);

    if (result.rows[0].cloudinary_public_id) {
      await cloudinary.uploader.destroy(result.rows[0].cloudinary_public_id, { resource_type: 'image' });
    } else {
      const filePath = path.resolve(process.cwd(), result.rows[0].file_path);
      const relativePath = path.relative(uploadDirectory, filePath);
      if (relativePath && !relativePath.startsWith('..') && !path.isAbsolute(relativePath)) {
        await fs.unlink(filePath).catch(() => undefined);
      }
    }
  } finally {
    client.release();
  }
}

export async function setMainPropertyImage(propertyIdValue, imageIdValue, ownerId) {
  const propertyId = parseId(propertyIdValue, 'property id');
  const imageId = parseId(imageIdValue, 'image id');
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    const ownedImage = await client.query(
      `SELECT pi.id FROM property_images pi
       JOIN properties p ON p.id = pi.property_id
       WHERE pi.id = $1 AND pi.property_id = $2 AND p.owner_id = $3`,
      [imageId, propertyId, ownerId]
    );
    if (!ownedImage.rows[0]) throw imageError('Image not found', 404);

    await client.query('UPDATE property_images SET is_main = FALSE WHERE property_id = $1', [propertyId]);
    const result = await client.query(
      `UPDATE property_images SET is_main = TRUE
       WHERE id = $1
       RETURNING id, property_id, file_path, cloudinary_public_id, original_name, mime_type, file_size_bytes, display_order, is_main`,
      [imageId]
    );
    await client.query('COMMIT');
    return result.rows[0];
  } catch (error) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}
