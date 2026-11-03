import pg from 'pg';
import { config } from './config.js';

const { Pool } = pg;

export const pool = new Pool({
  connectionString: config.databaseUrl || undefined,
  host: config.databaseUrl ? undefined : config.databaseHost,
  port: config.databaseUrl ? undefined : config.databasePort,
  database: config.databaseUrl ? undefined : config.databaseName,
  user: config.databaseUrl ? undefined : config.databaseUser,
  password: config.databaseUrl ? undefined : config.databasePassword,
  max: Number(process.env.DATABASE_POOL_MAX ?? 10),
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000
});

export const query = (text, params = []) => pool.query(text, params);

export async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
