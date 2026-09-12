import { pool } from '../config/database.js';

export async function createPropertyReport(propertyId: number, reporterId: number, reason: string, details: string | null) {
  const result = await pool.query(
    `INSERT INTO property_reports (property_id, reporter_id, reason, details)
     SELECT p.id, $2, $3::report_reason, $4
     FROM properties p
     WHERE p.id = $1 AND p.status = 'approved'
     RETURNING id, property_id, reason, details, resolved, created_at`,
    [propertyId, reporterId, reason, details]
  );
  return result.rows[0] || null;
}
