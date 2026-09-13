import { pool } from '../config/database.js';

export const propertyColumns = `
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
  p.rejection_reason,
  p.approved_by,
  p.approved_at,
  p.created_at,
  p.updated_at,
  COALESCE((
    SELECT json_agg(json_build_object(
      'id', pi.id,
      'filePath', pi.file_path,
      'originalName', pi.original_name,
      'mimeType', pi.mime_type,
      'displayOrder', pi.display_order,
      'isMain', pi.is_main
    ) ORDER BY pi.display_order)
    FROM property_images pi
    WHERE pi.property_id = p.id
  ), '[]'::json) AS images
`;

export const fromClause = `
  FROM properties p
  JOIN governorates g ON g.id = p.governorate_id
  JOIN cities c ON c.id = p.city_id
`;

export async function findPublicProperties({ page, limit, filters, sort }) {
  const values = [];
  const conditions = ['p.status = \'approved\''];

  if (filters.keyword) {
    values.push(`%${filters.keyword}%`);
    conditions.push(`(
      p.title ILIKE $${values.length}
      OR p.description ILIKE $${values.length}
      OR p.address ILIKE $${values.length}
    )`);
  }
  if (filters.purpose) {
    values.push(filters.purpose);
    conditions.push(`p.purpose = $${values.length}`);
  }
  if (filters.propertyType) {
    values.push(filters.propertyType);
    conditions.push(`p.property_type = $${values.length}`);
  }
  if (filters.cityId) {
    values.push(filters.cityId);
    conditions.push(`p.city_id = $${values.length}`);
  }
  if (filters.governorateId) {
    values.push(filters.governorateId);
    conditions.push(`p.governorate_id = $${values.length}`);
  }
  if (filters.governorateName) {
    values.push(filters.governorateName);
    conditions.push(`g.name_en ILIKE $${values.length}`);
  }
  if (filters.cityName) {
    values.push(filters.cityName);
    conditions.push(`c.name_en ILIKE $${values.length}`);
  }
  if (filters.minPrice !== undefined) {
    values.push(filters.minPrice);
    conditions.push(`p.price >= $${values.length}`);
  }
  if (filters.maxPrice !== undefined) {
    values.push(filters.maxPrice);
    conditions.push(`p.price <= $${values.length}`);
  }
  if (filters.minArea !== undefined) {
    values.push(filters.minArea);
    conditions.push(`p.area_sqm >= $${values.length}`);
  }
  if (filters.maxArea !== undefined) {
    values.push(filters.maxArea);
    conditions.push(`p.area_sqm <= $${values.length}`);
  }
  if (filters.bedrooms !== undefined) {
    values.push(filters.bedrooms);
    conditions.push(`p.bedrooms >= $${values.length}`);
  }
  if (filters.bathrooms !== undefined) {
    values.push(filters.bathrooms);
    conditions.push(`p.bathrooms >= $${values.length}`);
  }
  if (filters.furnished !== undefined) {
    values.push(filters.furnished);
    conditions.push(`p.furnished = $${values.length}`);
  }

  const whereClause = `WHERE ${conditions.join(' AND ')}`;
  const countResult = await pool.query(
    `SELECT COUNT(*)::int AS total ${fromClause} ${whereClause}`,
    values
  );

  const offset = (page - 1) * limit;
  const dataValues = [...values, limit, offset];
  const result = await pool.query(
    `SELECT ${propertyColumns} ${fromClause} ${whereClause}
     ORDER BY ${sort}
     LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );

  return { rows: result.rows, total: countResult.rows[0].total };
}

export async function findPublicPropertyById(id) {
  const result = await pool.query(
    `SELECT ${propertyColumns} ${fromClause}
     WHERE p.id = $1 AND p.status = 'approved'`,
    [id]
  );
  return result.rows[0] || null;
}

export async function findPropertiesByOwner(ownerId) {
  const result = await pool.query(
    `SELECT ${propertyColumns} ${fromClause}
     WHERE p.owner_id = $1
     ORDER BY p.created_at DESC`,
    [ownerId]
  );
  return result.rows;
}

export async function findPropertyByIdForOwner(id, ownerId) {
  const result = await pool.query(
    `SELECT ${propertyColumns} ${fromClause}
     WHERE p.id = $1 AND p.owner_id = $2`,
    [id, ownerId]
  );
  return result.rows[0] || null;
}

export async function createProperty(property) {
  const result = await pool.query(
    `INSERT INTO properties (
      owner_id, title, description, property_type, purpose, price, currency,
      area_sqm, bedrooms, bathrooms, floor, furnished,
      construction_year, governorate_id, city_id, address,
      latitude, longitude
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
      $14, $15, $16, $17, $18
    ) RETURNING id`,
    [
      property.ownerId, property.title, property.description, property.propertyType,
      property.purpose, property.price, property.currency, property.areaSqm,
      property.bedrooms, property.bathrooms, property.floor, property.furnished,
      property.constructionYear, property.governorateId,
      property.cityId, property.address, property.latitude, property.longitude
    ]
  );
  return findPropertyByIdForOwner(result.rows[0].id, property.ownerId);
}

export async function updateProperty(id, ownerId, property) {
  const result = await pool.query(
    `UPDATE properties SET
      title = $1, description = $2, property_type = $3, purpose = $4,
      price = $5, currency = $6, area_sqm = $7, bedrooms = $8, bathrooms = $9,
      floor = $10, furnished = $11, construction_year = $12,
      governorate_id = $13, city_id = $14, address = $15,
      latitude = $16, longitude = $17,
      status = 'pending', rejection_reason = NULL, approved_by = NULL, approved_at = NULL
     WHERE id = $18 AND owner_id = $19
     RETURNING id`,
    [
      property.title, property.description, property.propertyType, property.purpose,
      property.price, property.currency, property.areaSqm, property.bedrooms,
      property.bathrooms, property.floor, property.furnished,
      property.constructionYear, property.governorateId, property.cityId,
      property.address, property.latitude, property.longitude, id, ownerId
    ]
  );
  return result.rows[0] ? findPropertyByIdForOwner(id, ownerId) : null;
}

export async function deleteProperty(id, ownerId) {
  const result = await pool.query(
    'DELETE FROM properties WHERE id = $1 AND owner_id = $2 RETURNING id',
    [id, ownerId]
  );
  return result.rows[0] || null;
}
