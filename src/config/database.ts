import pg from 'pg';
import { env } from './env.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: env.databaseUrl || undefined,
  max: env.dbPoolMax,
  idleTimeoutMillis: env.dbIdleTimeoutMs,
  connectionTimeoutMillis: env.dbConnectionTimeoutMs,
  ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error', error);
});

export async function checkDatabaseConnection() {
  const result = await pool.query('SELECT NOW() AS current_time');
  return result.rows[0];
}
