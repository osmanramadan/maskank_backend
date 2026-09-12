import { pool } from '../config/database.js';

const userColumns = `
  id, full_name, email, phone, role, avatar_url, is_active, created_at, updated_at
`;

export async function getAdminStats() {
  const result = await Promise.all([
    pool.query('SELECT COUNT(*)::int AS total FROM users'),
    pool.query("SELECT COUNT(*)::int AS total FROM users WHERE role IN ('OWNER', 'BROKER')"),
    pool.query('SELECT COUNT(*)::int AS total FROM properties'),
    pool.query("SELECT COUNT(*)::int AS total FROM properties WHERE status = 'pending'"),
    pool.query("SELECT COUNT(*)::int AS total FROM properties WHERE status = 'approved'"),
    pool.query("SELECT COUNT(*)::int AS total FROM properties WHERE status = 'sold'"),
    pool.query("SELECT COUNT(*)::int AS total FROM properties WHERE status = 'rented'"),
    pool.query('SELECT COUNT(*)::int AS total FROM property_views')
  ]);

  const values = result.map((query) => query.rows[0].total);
  return {
    totalUsers: values[0],
    totalOwnersAndBrokers: values[1],
    totalProperties: values[2],
    pendingProperties: values[3],
    approvedProperties: values[4],
    soldProperties: values[5],
    rentedProperties: values[6],
    totalPropertyViews: values[7]
  };
}

export async function findAdminUsers({ page, limit, role, search }) {
  const values = [];
  const conditions = [];
  if (role) {
    values.push(role);
    conditions.push(`role = $${values.length}`);
  }
  if (search) {
    values.push(`%${search}%`);
    conditions.push(`(full_name ILIKE $${values.length} OR email ILIKE $${values.length} OR phone ILIKE $${values.length})`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const count = await pool.query(`SELECT COUNT(*)::int AS total FROM users ${where}`, values);
  const dataValues = [...values, limit, (page - 1) * limit];
  const data = await pool.query(
    `SELECT ${userColumns} FROM users ${where}
     ORDER BY created_at DESC LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );
  return { rows: data.rows, total: count.rows[0].total };
}

export async function findAdminProperties({ page, limit, status }) {
  const values = [];
  const where = status ? 'WHERE p.status = $1' : '';
  if (status) values.push(status);
  const count = await pool.query(`SELECT COUNT(*)::int AS total FROM properties p ${where}`, values);
  const dataValues = [...values, limit, (page - 1) * limit];
  const data = await pool.query(
    `SELECT p.id, p.title, p.property_type, p.purpose, p.price, p.currency,
            p.status, p.created_at, p.updated_at, p.owner_id,
            u.full_name AS owner_name, u.email AS owner_email
     FROM properties p
     JOIN users u ON u.id = p.owner_id
     ${where}
     ORDER BY p.created_at DESC LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );
  return { rows: data.rows, total: count.rows[0].total };
}

export async function setPropertyStatus(propertyId, status, adminId, rejectionReason = null) {
  const result = await pool.query(
    `UPDATE properties SET
      status = $1::property_status,
       rejection_reason = $2,
       approved_by = CASE WHEN $1::property_status = 'approved'::property_status THEN $3::bigint ELSE NULL END,
      approved_at = CASE WHEN $1::property_status = 'approved'::property_status THEN NOW() ELSE NULL END
     WHERE id = $4::bigint
     RETURNING id, title, status, rejection_reason, approved_by, approved_at, updated_at`,
    [status, rejectionReason, adminId, propertyId]
  );
  return result.rows[0] || null;
}

export async function deleteAdminProperty(propertyId) {
  const result = await pool.query(
    'DELETE FROM properties WHERE id = $1 RETURNING id',
    [propertyId]
  );
  return result.rows[0] || null;
}

export async function findAdminReports({ page, limit, resolved }) {
  const values = [];
  const where = resolved === undefined ? '' : 'WHERE r.resolved = $1';
  if (resolved !== undefined) values.push(resolved);
  const count = await pool.query(`SELECT COUNT(*)::int AS total FROM property_reports r ${where}`, values);
  const dataValues = [...values, limit, (page - 1) * limit];
  const data = await pool.query(
    `SELECT r.id, r.property_id, p.title AS property_title,
            r.reporter_id, u.full_name AS reporter_name, r.reason, r.details,
            r.resolved, r.resolved_by, r.resolved_at, r.created_at
     FROM property_reports r
     JOIN properties p ON p.id = r.property_id
     JOIN users u ON u.id = r.reporter_id
     ${where}
     ORDER BY r.created_at DESC LIMIT $${dataValues.length - 1} OFFSET $${dataValues.length}`,
    dataValues
  );
  return { rows: data.rows, total: count.rows[0].total };
}

export async function resolveAdminReport(reportId, adminId) {
  const result = await pool.query(
    `UPDATE property_reports SET resolved = TRUE, resolved_by = $1, resolved_at = NOW()
     WHERE id = $2
     RETURNING id, resolved, resolved_by, resolved_at`,
    [adminId, reportId]
  );
  return result.rows[0] || null;
}
