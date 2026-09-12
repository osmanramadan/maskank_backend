import { pool } from '../config/database.js';

const messageColumns = `
  m.id,
  m.sender_id,
  sender.full_name AS sender_name,
  m.receiver_id,
  receiver.full_name AS receiver_name,
  m.property_id,
  p.title AS property_title,
  m.message,
  m.created_at,
  m.read_at
`;

export async function createMessage({ senderId, propertyId, message }) {
  const result = await pool.query(
    `INSERT INTO messages (sender_id, receiver_id, property_id, message)
     SELECT $1, p.owner_id, p.id, $3
     FROM properties p
     JOIN users owner ON owner.id = p.owner_id AND owner.is_active = TRUE
     WHERE p.id = $2 AND p.status = 'approved' AND p.owner_id <> $1
     RETURNING id, sender_id, receiver_id, property_id, message, created_at, read_at`,
    [senderId, propertyId, message]
  );
  return result.rows[0] || null;
}

export async function findUserMessages(userId) {
  const result = await pool.query(
    `SELECT ${messageColumns}
     FROM messages m
     JOIN users sender ON sender.id = m.sender_id
     JOIN users receiver ON receiver.id = m.receiver_id
     JOIN properties p ON p.id = m.property_id
     WHERE m.sender_id = $1 OR m.receiver_id = $1
     ORDER BY m.created_at DESC`,
    [userId]
  );
  return result.rows;
}

export async function markMessageAsRead(messageId, userId) {
  const result = await pool.query(
    `UPDATE messages
     SET read_at = COALESCE(read_at, NOW())
     WHERE id = $1 AND receiver_id = $2
     RETURNING id, read_at`,
    [messageId, userId]
  );
  return result.rows[0] || null;
}
