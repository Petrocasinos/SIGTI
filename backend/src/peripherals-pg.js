import { query, withTransaction } from './db.js';
import { normalizeArea } from './areas.js';

export async function listEquipmentPeripheralCounts(equipmentId) {
  const result = await query("SELECT id,equipment_id,item_type,quantity,notes,counted_at,updated_at FROM public.equipment_peripheral_counts WHERE equipment_id=$1 ORDER BY item_type", [equipmentId]);
  return result.rows;
}

export async function listPhysicalPeripheralSummary() {
  const result = await query('SELECT c.equipment_id,c.item_type,c.quantity,m.area FROM public.equipment_peripheral_counts c LEFT JOIN public.maintenances m ON m.id=c.equipment_id');
  const byArea = new Map();
  for (const row of result.rows) { const area = normalizeArea(row.area); const current = byArea.get(area) ?? { area, total: 0, quantities: {} }; current.total += row.quantity; current.quantities[row.item_type] = (current.quantities[row.item_type] ?? 0) + row.quantity; byArea.set(area, current); }
  return [...byArea.values()].sort((left, right) => left.area.localeCompare(right.area, 'es-CO'));
}

export async function saveEquipmentPeripheralCounts({ equipmentId, countedBy, items, notes }) {
  return withTransaction(async (client) => {
    const equipment = await client.query('SELECT equipment_type FROM public.maintenances WHERE id=$1', [equipmentId]);
    const type = String(equipment.rows[0]?.equipment_type ?? '');
    const isPortable = type === 'Portátil';
    const hasCharger = isPortable || type === 'Todo en Uno';
    await client.query('DELETE FROM public.equipment_peripheral_counts WHERE equipment_id=$1', [equipmentId]);
    const rows = [];
    for (const item of items) {
      if (item.quantity <= 0 || (item.itemType === 'charge' && !hasCharger) || (item.itemType === 'cooling_base' && !isPortable)) continue;
      const result = await client.query('INSERT INTO public.equipment_peripheral_counts (equipment_id,item_type,quantity,notes,counted_by) VALUES ($1,$2,$3,$4,$5) RETURNING *', [equipmentId, item.itemType, item.quantity, notes || null, countedBy]);
      rows.push(result.rows[0]);
    }
    return rows;
  });
}
