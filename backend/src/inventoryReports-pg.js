import { query } from './db.js';

function mapReport(report) { return report ? { id: report.id, equipmentCode: report.equipment_code, peripherals: report.peripherals ?? {}, status: report.status, createdAt: report.created_at, updatedAt: report.updated_at } : null; }

export async function listInventoryReports() {
  const result = await query(`SELECT r.id,r.user_id,r.equipment_code,r.peripherals,r.status,r.created_at,r.updated_at,u.name,u.lastname,u.username FROM public.inventory_reports r JOIN public.usuarios u ON u.id=r.user_id ORDER BY r.updated_at DESC`);
  return result.rows.map((report) => ({ ...mapReport(report), userId: report.user_id, employeeName: [report.name, report.lastname].filter(Boolean).join(' '), username: report.username }));
}

export async function getInventoryReport(userId) {
  const result = await query('SELECT id,equipment_code,peripherals,status,created_at,updated_at FROM public.inventory_reports WHERE user_id=$1 LIMIT 1', [userId]);
  return mapReport(result.rows[0]);
}

export async function saveInventoryReport({ userId, equipmentCode, peripherals }) {
  const result = await query(`INSERT INTO public.inventory_reports (user_id,equipment_code,peripherals,status,updated_at) VALUES ($1,$2,$3::jsonb,'pending',NOW()) ON CONFLICT (user_id) DO UPDATE SET equipment_code=EXCLUDED.equipment_code,peripherals=EXCLUDED.peripherals,status=EXCLUDED.status,updated_at=EXCLUDED.updated_at RETURNING id,equipment_code,peripherals,status,created_at,updated_at`, [Number(userId), equipmentCode, JSON.stringify(peripherals)]);
  return mapReport(result.rows[0]);
}
