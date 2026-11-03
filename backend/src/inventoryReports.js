import { config } from './config.js';

function headers(method, prefer) {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('La configuración de Supabase no está completa.');
  }
  const result = {
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`,
    'Content-Type': 'application/json',
    [method === 'GET' ? 'Accept-Profile' : 'Content-Profile']: config.supabaseAuthSchema
  };
  if (prefer) result.Prefer = prefer;
  return result;
}

async function request(table, options = {}) {
  const url = new URL(`/rest/v1/${table}`, config.supabaseUrl);
  for (const [key, value] of Object.entries(options.parameters ?? {})) url.searchParams.set(key, value);
  const response = await fetch(url, {
    method: options.method ?? 'GET',
    headers: headers(options.method ?? 'GET', options.prefer),
    body: options.payload ? JSON.stringify(options.payload) : undefined
  });
  const body = await response.text();
  if (!response.ok) throw new Error(`No fue posible procesar el levantamiento de inventario: ${body}`);
  return body ? JSON.parse(body) : null;
}

function mapReport(report) {
  if (!report) return null;
  return {
    id: report.id,
    equipmentCode: report.equipment_code,
    peripherals: report.peripherals ?? {},
    status: report.status,
    createdAt: report.created_at,
    updatedAt: report.updated_at
  };
}

export async function listInventoryReports() {
  const [reports, users] = await Promise.all([
    request('inventory_reports', {
      parameters: {
        select: 'id,user_id,equipment_code,peripherals,status,created_at,updated_at',
        order: 'updated_at.desc'
      }
    }),
    request('usuarios', { parameters: { select: 'id,name,lastname,username' } })
  ]);
  const usersById = new Map(users.map((user) => [String(user.id), user]));
  return reports.map((report) => ({
    ...mapReport(report),
    userId: report.user_id,
    employeeName: [usersById.get(String(report.user_id))?.name, usersById.get(String(report.user_id))?.lastname].filter(Boolean).join(' '),
    username: usersById.get(String(report.user_id))?.username ?? null
  }));
}

export async function getInventoryReport(userId) {
  const rows = await request('inventory_reports', {
    parameters: {
      select: 'id,equipment_code,peripherals,status,created_at,updated_at',
      user_id: `eq.${encodeURIComponent(userId)}`,
      limit: '1'
    }
  });
  return mapReport(rows[0]);
}

export async function saveInventoryReport({ userId, equipmentCode, peripherals }) {
  const rows = await request('inventory_reports', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    parameters: { on_conflict: 'user_id' },
    payload: {
      user_id: Number(userId),
      equipment_code: equipmentCode,
      peripherals,
      status: 'pending',
      updated_at: new Date().toISOString()
    }
  });
  return mapReport(rows[0]);
}
