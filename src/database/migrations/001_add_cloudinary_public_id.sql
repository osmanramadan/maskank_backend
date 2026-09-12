ALTER TABLE property_images
ADD COLUMN IF NOT EXISTS cloudinary_public_id TEXT;
