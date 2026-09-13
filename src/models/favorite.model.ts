import { pool } from '../config/database.js';

const propertyColumns = `
  p.id,
  p.owner_id,
  p.title,
  p.description,
  p.property_type,
  p.purpose,
  p.price,
  p.currency,
  p.area_sqm,
  p.bedrooms,
  p.bathrooms,
  p.floor,
  p.furnished,
  p.construction_year,
  p.governorate_id,
  g.name_en AS governorate,
  p.city_id,
  c.name_en AS city,
  p.address,
  p.latitude,
  p.longitude,
  p.status,
  p.created_at,
  p.updated_at,
  COALESCE((
    SELECT json_agg(json_build_object(
      'id', pi.id,
      'filePath', pi.file_path,
      'displayOrder', pi.display_order,
      'isMain', pi.is_main
    ) ORDER BY pi.display_order)
    FROM property_images pi
    WHERE pi.property_id = p.id
  ), '[]'::json) AS images
`;

const propertyJoins = `
  JOIN governorates g ON g.id = p.governorate_id
  JOIN cities c ON c.id = p.city_id
`;

export async function findUserFavorites(userId) {
  const result = await pool.query(
    `SELECT ${propertyColumns}, f.created_at AS favorited_at
     FROM favorites f
     JOIN properties p ON p.id = f.property_id
     ${propertyJoins}
     WHERE f.user_id = $1 AND p.status = 'approved'
     ORDER BY f.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function addFavorite(userId, propertyId) {
  const result = await pool.query(
    `INSERT INTO favorites (user_id, property_id)
     SELECT $1, p.id
     FROM properties p
     WHERE p.id = $2 AND p.status = 'approved'
     ON CONFLICT (user_id, property_id) DO NOTHING
     RETURNING user_id, property_id, created_at`,
    [userId, propertyId]
  );

  if (result.rows[0]) return result.rows[0];

  const property = await pool.query(
    "SELECT id FROM properties WHERE id = $1 AND status = 'approved'",
    [propertyId]
  );
  if (!property.rows[0]) return null;

  const existing = await pool.query(
    'SELECT user_id, property_id, created_at FROM favorites WHERE user_id = $1 AND property_id = $2',
    [userId, propertyId]
  );
  return existing.rows[0] || null;
}

export async function removeFavorite(userId, propertyId) {
  const result = await pool.query(
    `DELETE FROM favorites
     WHERE user_id = $1 AND property_id = $2
     RETURNING user_id, property_id`,
    [userId, propertyId]
  );
  return result.rows[0] || null;
}
