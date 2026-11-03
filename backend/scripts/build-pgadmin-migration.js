import fs from 'node:fs';
import path from 'node:path';

const projectRoot = path.resolve(process.cwd(), '..');
const sourceRoot = process.env.SIGTI_SOURCE_ROOT ?? 'C:/Julian/SistemaIntegradoGestionTI-SIGTI';
const schemaPath = path.join(projectRoot, 'database', '023_consolidate_public_production.sql');
const dataPath = path.join(sourceRoot, 'data.sql');
const outputPath = path.join(projectRoot, 'backend', 'pgadmin_migration.sql');

const schema = fs.readFileSync(schemaPath, 'utf8');
const portableSchema = schema.replace(
  /\n-- Los clientes de PostgREST usan service_role; se mantiene explícito el acceso\.[\s\S]*?GRANT EXECUTE ON FUNCTION public\.return_assignment\(BIGINT, BIGINT, JSONB, TEXT\) TO service_role;\n/,
  '\n-- Permisos service_role omitidos: ese rol solo existe en Supabase.\n',
);
const dump = fs.readFileSync(dataPath, 'utf8');

function parseCopyTable(tableName) {
  const expression = new RegExp(
    `COPY "public"\."${tableName}" \\(([^\\n]+)\\) FROM stdin;\\r?\\n([\\s\\S]*?)\\r?\\n\\\\\\.`,
  );
  const match = dump.match(expression);
  if (!match) return { columns: [], rows: [] };
  const columns = match[1].split(',').map((column) => column.replaceAll('"', '').trim());
  const rows = match[2]
    .split(/\r?\n/)
    .filter(Boolean)
    .map((row) => row.split('\t'));
  return { columns, rows };
}

function value(row, columns, name) {
  const index = columns.indexOf(name);
  if (index < 0) return null;
  const raw = row[index];
  return raw === '\\N' || raw === '' ? null : raw;
}

function sql(valueToQuote) {
  if (valueToQuote === null || valueToQuote === undefined || valueToQuote === '' || valueToQuote === '\\N') return 'NULL';
  if (valueToQuote === true || valueToQuote === 't') return 'TRUE';
  if (valueToQuote === false || valueToQuote === 'f') return 'FALSE';
  return `'${String(valueToQuote).replaceAll("'", "''")}'`;
}

function insert(table, columns, rows) {
  if (!rows.length) return '';
  const values = rows.map((row) => `(${row.map(sql).join(', ')})`).join(',\n');
  return `INSERT INTO public.${table} (${columns.join(', ')}) VALUES\n${values}\nON CONFLICT DO NOTHING;\n`;
}

const roles = parseCopyTable('roles');
const users = parseCopyTable('users');
const items = parseCopyTable('inventory_items');
const records = parseCopyTable('maintenance_records');

const userRows = users.rows.map((row) => [
  value(row, users.columns, 'id'),
  value(row, users.columns, 'name'),
  value(row, users.columns, 'lastname'),
  value(row, users.columns, 'username'),
  value(row, users.columns, 'email'),
  value(row, users.columns, 'password'),
  value(row, users.columns, 'role_id'),
  'ÁREA NO DEFINIDA',
  value(row, users.columns, 'created_at'),
]);

const itemRows = items.rows.map((row) => {
  const type = value(row, items.columns, 'asset_type');
  const equipmentType = { laptop: 'Portátil', tower: 'Torre', all_in_one: 'Todo en Uno' }[type] ?? 'Torre';
  const assetCode = value(row, items.columns, 'asset_code') ?? `EF${String(value(row, items.columns, 'id')).padStart(4, '0')}`;
  const textOrFallback = (name) => value(row, items.columns, name) ?? 'N/D';
  return [
    value(row, items.columns, 'id'), 'Petrocasinos', 1,
    value(row, items.columns, 'created_at')?.slice(0, 10), assetCode, assetCode,
    value(row, items.columns, 'ip_address'), textOrFallback('area'), textOrFallback('assigned_user'),
    textOrFallback('brand'), textOrFallback('model'), textOrFallback('serial_number'), equipmentType,
    textOrFallback('processor'), null, textOrFallback('ram'), textOrFallback('operating_system'),
    value(row, items.columns, 'hdd'), value(row, items.columns, 'ssd'), value(row, items.columns, 'nvme') === 't',
    value(row, items.columns, 'nvme') === 't' ? value(row, items.columns, 'nvme') : null,
    textOrFallback('screen_size'), value(row, items.columns, 'antivirus') ?? 'Sophos', null,
    value(row, items.columns, 'notes'), value(row, items.columns, 'created_at'),
  ];
});

const recordRows = records.rows.map((row) => [
  value(row, records.columns, 'id'), value(row, records.columns, 'item_id'),
  value(row, records.columns, 'performed_at'), 'Preventivo', value(row, records.columns, 'technician_id'),
  'Mantenimiento histórico importado desde el respaldo original.', null,
  value(row, records.columns, 'notes'), value(row, records.columns, 'created_at'),
]);

const output = [
  '-- SIGTI: migración preparada para ejecutar en pgAdmin sobre la base SIGTI.',
  '-- Fuente: schema actual 023 + datos públicos de data.sql.',
  '-- Se excluyen los esquemas internos auth/storage de Supabase.',
  portableSchema,
  'BEGIN;',
  "INSERT INTO public.sites (id, company, name, city, active) VALUES (1, 'Petrocasinos', 'Principal', NULL, TRUE) ON CONFLICT DO NOTHING;",
  insert('roles', ['id', 'name'], roles.rows),
  insert('usuarios', ['id', 'name', 'lastname', 'username', 'email', 'password', 'role_id', 'area', 'created_at'], userRows),
  insert('maintenances', ['id', 'company', 'site_id', 'last_maintenance', 'equipment_code', 'full_equipment_code', 'ip_address', 'area', 'responsible', 'brand', 'model', 'serial_number', 'equipment_type', 'processor_model', 'processor_detail', 'ram', 'os', 'hdd_size', 'ssd_size', 'is_nvme', 'nvme_size', 'screen_size', 'antivirus', 'glpi', 'observations', 'created_at'], itemRows),
  insert('maintenance_records', ['id', 'maintenance_id', 'maintenance_date', 'maintenance_type', 'technician_id', 'description', 'actions_taken', 'observations', 'created_at'], recordRows),
  "SELECT setval(pg_get_serial_sequence('public.roles', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM public.roles), 1), 1), TRUE);",
  "SELECT setval(pg_get_serial_sequence('public.usuarios', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM public.usuarios), 1), 1), TRUE);",
  "SELECT setval(pg_get_serial_sequence('public.sites', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM public.sites), 1), 1), TRUE);",
  "SELECT setval(pg_get_serial_sequence('public.maintenances', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM public.maintenances), 1), 1), TRUE);",
  "SELECT setval(pg_get_serial_sequence('public.maintenance_records', 'id'), GREATEST(COALESCE((SELECT MAX(id) FROM public.maintenance_records), 1), 1), TRUE);",
  'COMMIT;',
].join('\n\n');

fs.writeFileSync(outputPath, output, 'utf8');
console.log(JSON.stringify({ outputPath, users: userRows.length, items: itemRows.length, maintenanceRecords: recordRows.length }));
