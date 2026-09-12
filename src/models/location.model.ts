import { pool } from '../config/database.js';

export async function findLocations() {
  const [governorates, cities] = await Promise.all([
    pool.query('SELECT id, name_ar, name_en FROM governorates ORDER BY name_en'),
    pool.query('SELECT id, governorate_id, name_ar, name_en FROM cities ORDER BY name_en')
  ]);

  return {
    governorates: governorates.rows,
    cities: cities.rows
  };
}
