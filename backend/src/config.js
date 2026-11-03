import dotenv from 'dotenv';

// `.env.prod` se usa al ejecutar el backend con NODE_ENV=production.
// En Vercel las variables inyectadas por la plataforma siguen teniendo
// prioridad y este archivo normalmente no existe en el despliegue.
dotenv.config({
  path: process.env.NODE_ENV === 'production' ? '.env.prod' : '.env'
});

const localFrontendUrls = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'https://sigti-petrocasinos.vercel.app'
];

const configuredFrontendUrls = String(process.env.FRONTEND_URL ?? '')
  .split(',')
  .map((url) => url.trim())
  .filter(Boolean);

export const config = {
  port: Number(process.env.PORT ?? 3000),
  frontendUrls: [...new Set([...localFrontendUrls, ...configuredFrontendUrls])],
  jwtSecret: process.env.JWT_SECRET ?? 'desarrollo-no-usar-en-produccion',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '8h',
  databaseUrl: process.env.DATABASE_URL,
  databaseHost: process.env.DATABASE_HOST ?? '127.0.0.1',
  databasePort: Number(process.env.DATABASE_PORT ?? 5432),
  databaseName: process.env.DATABASE_NAME ?? 'SIGTI',
  databaseUser: process.env.DATABASE_USER ?? 'postgres',
  databasePassword: process.env.DATABASE_PASSWORD ?? process.env.PGPASSWORD ?? '',
  supabaseUrl: process.env.SUPABASE_URL,
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  // Producción usa el esquema estándar de Supabase. Las variables de entorno
  // siguen permitiendo cambiarlo explícitamente en otro ambiente.
  supabaseAuthSchema: process.env.SUPABASE_AUTH_SCHEMA ?? 'public',
  supabaseMaintenanceSchema: process.env.SUPABASE_MAINTENANCE_SCHEMA ?? 'public'
};
