import { query } from './db.js';

export async function getSystemMetrics() {
  const [inventoryItems, tickets, maintenances, activeLoans, equipment, records] = await Promise.all([
    query('SELECT COUNT(*)::int AS count FROM public.peripheral_stock'),
    query('SELECT COUNT(*)::int AS count FROM public.tickets'),
    query('SELECT COUNT(*)::int AS count FROM public.maintenances'),
    query("SELECT COUNT(*)::int AS count FROM public.assignments WHERE status='active'"),
    query('SELECT id,equipment_type,company,glpi FROM public.maintenances'),
    query('SELECT id,maintenance_id,maintenance_date,next_maintenance_date FROM public.maintenance_records')
  ]);
  const equipmentRows = equipment.rows;
  const recordRows = records.rows;
  const now = new Date();
  const currentMonth = now.toISOString().slice(0, 7);
  const today = now.toISOString().slice(0, 10);
  const thirtyDayLimit = new Date(now);
  thirtyDayLimit.setDate(thirtyDayLimit.getDate() + 30);
  const limit = thirtyDayLimit.toISOString().slice(0, 10);
  const latest = new Map();
  for (const record of recordRows) {
    const previous = latest.get(record.maintenance_id);
    if (!previous || record.maintenance_date > previous.maintenance_date) latest.set(record.maintenance_id, record);
  }
  const types = ['Portátil', 'Torre', 'Todo en Uno'];
  const byType = Object.entries(equipmentRows.reduce((result, item) => { const type = item.equipment_type || 'Sin tipo'; result[type] = (result[type] ?? 0) + 1; return result; }, {}));
  const byCompany = Object.entries(equipmentRows.reduce((result, item) => { const company = item.company || 'Sin empresa'; result[company] = (result[company] ?? 0) + 1; return result; }, {}));
  return {
    inventoryItems: inventoryItems.rows[0].count,
    tickets: tickets.rows[0].count,
    maintenances: maintenances.rows[0].count,
    activeLoans: activeLoans.rows[0].count,
    stats: {
      maintenancesThisMonth: recordRows.filter((record) => record.maintenance_date?.toISOString?.().startsWith(currentMonth) || String(record.maintenance_date).startsWith(currentMonth)).length,
      equipmentTotal: equipmentRows.length,
      computerTotal: equipmentRows.filter((item) => types.includes(item.equipment_type)).length,
      computerByType: types.map((label) => ({ label, value: byType.find(([key]) => key === label)?.[1] ?? 0 })),
      equipmentByCompany: byCompany.map(([label, value]) => ({ label, value })),
      glpiRegistered: equipmentRows.filter((item) => item.glpi === true).length,
      overdueMaintenances: [...latest.values()].filter((record) => String(record.next_maintenance_date) < today).length,
      dueSoonMaintenances: [...latest.values()].filter((record) => String(record.next_maintenance_date) >= today && String(record.next_maintenance_date) <= limit).length,
      upToDateMaintenances: [...latest.values()].filter((record) => String(record.next_maintenance_date) > limit).length
    }
  };
}
