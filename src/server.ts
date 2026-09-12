import { app } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/database.js';

const server = app.listen(env.port, () => {
  console.log(`Maskank API listening on port ${env.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received, shutting down gracefully`);
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
