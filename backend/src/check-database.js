import { query, pool } from './db.js';

try {
  const result = await query('SELECT COUNT(*)::int AS count FROM public.usuarios');
  console.log(`Conexión a PostgreSQL confirmada. Usuarios: ${result.rows[0].count}.`);
} finally {
  await pool.end();
}
