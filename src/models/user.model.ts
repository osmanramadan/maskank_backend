import { pool } from '../config/database.js';

const publicUserColumns = `
  id,
  full_name,
  email,
  phone,
  role,
  avatar_url,
  is_active,
  created_at,
  updated_at
`;

export async function findUserByEmail(email) {
  const result = await pool.query(
    `SELECT ${publicUserColumns}, password_hash
     FROM users
     WHERE email = $1
     LIMIT 1`,
    [email]
  );
  return result.rows[0] || null;
}

export async function findUserByPhone(phone) {
  const result = await pool.query(
    `SELECT ${publicUserColumns}
     FROM users
     WHERE phone = $1
     LIMIT 1`,
    [phone]
  );
  return result.rows[0] || null;
}

export async function findUserById(id) {
  const result = await pool.query(
    `SELECT ${publicUserColumns}
     FROM users
     WHERE id = $1
     LIMIT 1`,
    [id]
  );
  return result.rows[0] || null;
}

export async function createUser({ fullName, email, phone, passwordHash, role }) {
  const result = await pool.query(
    `INSERT INTO users (full_name, email, phone, password_hash, role)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING ${publicUserColumns}`,
    [fullName, email, phone, passwordHash, role]
  );
  return result.rows[0];
}

export async function updateUserRole(id, role) {
  const result = await pool.query(
    `UPDATE users
     SET role = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING ${publicUserColumns}`,
    [role, id]
  );
  return result.rows[0] || null;
}

export async function updateUserPhone(id, phone) {
  const result = await pool.query(
    `UPDATE users
     SET phone = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING ${publicUserColumns}`,
    [phone, id]
  );
  return result.rows[0] || null;
}

export async function updateUserAvatar(id, avatarUrl) {
  const result = await pool.query(
    `UPDATE users
     SET avatar_url = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING ${publicUserColumns}`,
    [avatarUrl, id]
  );
  return result.rows[0] || null;
}
