import { query } from './db.js';

export async function listPeripheralStock() {
  const result = await query('SELECT id,item_type,brand,reference,model,location,quantity_total,quantity_available,quantity_assigned,quantity_cleaning,quantity_damaged,quantity_retired,status,notes,created_at FROM public.peripheral_stock ORDER BY item_type,brand,reference');
  return result.rows;
}

export async function createPeripheralStock(data) {
  const result = await query('INSERT INTO public.peripheral_stock (item_type,brand,reference,model,location,quantity_total,quantity_available,notes) VALUES ($1,$2,$3,$4,$5,$6,$6,$7) RETURNING *', [data.itemType, data.brand || null, data.reference || null, data.model || null, data.location, data.quantity, data.notes || null]);
  return result.rows[0];
}

export async function listActiveAssignments() {
  const [assignments, users, equipment, items, stock] = await Promise.all([
    query("SELECT id,employee_id,equipment_id,delivered_at,delivery_notes FROM public.assignments WHERE status='active' ORDER BY delivered_at DESC"),
    query('SELECT id,name,lastname FROM public.usuarios'),
    query('SELECT id,full_equipment_code,brand,model,equipment_type,area FROM public.maintenances'),
    query('SELECT id,assignment_id,peripheral_stock_id,quantity_delivered FROM public.assignment_items'),
    query('SELECT id,item_type FROM public.peripheral_stock')
  ]);
  const usersById = new Map(users.rows.map((user) => [String(user.id), [user.name, user.lastname].filter(Boolean).join(' ')]));
  const equipmentById = new Map(equipment.rows.map((item) => [String(item.id), item]));
  const stockById = new Map(stock.rows.map((item) => [String(item.id), item.item_type]));
  return assignments.rows.map((assignment) => ({ ...assignment, employee_name: usersById.get(String(assignment.employee_id)) ?? 'No definido', equipment: equipmentById.get(String(assignment.equipment_id)) ?? null, items: items.rows.filter((item) => String(item.assignment_id) === String(assignment.id)).map((item) => ({ id: item.id, item_type: stockById.get(String(item.peripheral_stock_id)) ?? 'periférico', quantity: item.quantity_delivered })) }));
}

export async function getActiveAssignmentByEquipment(equipmentId) {
  const assignmentResult = await query("SELECT id,employee_id,equipment_id,delivered_at,delivery_notes FROM public.assignments WHERE equipment_id=$1 AND status='active' LIMIT 1", [equipmentId]);
  const assignment = assignmentResult.rows[0];
  if (!assignment) return null;
  const [user, items, stock] = await Promise.all([
    query('SELECT id,name,lastname FROM public.usuarios WHERE id=$1', [assignment.employee_id]),
    query('SELECT id,assignment_id,peripheral_stock_id,quantity_delivered FROM public.assignment_items WHERE assignment_id=$1', [assignment.id]),
    query('SELECT id,item_type,brand,reference,model FROM public.peripheral_stock')
  ]);
  const stockById = new Map(stock.rows.map((item) => [String(item.id), item]));
  return { ...assignment, employee_name: user.rows[0] ? [user.rows[0].name, user.rows[0].lastname].filter(Boolean).join(' ') : 'No definido', items: items.rows.map((item) => { const peripheral = stockById.get(String(item.peripheral_stock_id)); return { id: item.id, quantity: item.quantity_delivered, item_type: peripheral?.item_type ?? 'periférico', label: [peripheral?.brand, peripheral?.reference, peripheral?.model].filter(Boolean).join(' ') || null }; }) };
}

export async function returnAssignment({ assignmentId, receivedBy, items, notes }) {
  const result = await query('SELECT public.return_assignment($1,$2,$3::jsonb,$4) AS result', [Number(assignmentId), Number(receivedBy), JSON.stringify(items.map((item) => ({ assignment_item_id: Number(item.assignmentItemId), condition: item.condition }))), notes || null]);
  return result.rows[0].result;
}

export async function listAssignmentOptions() {
  const [users, equipment, activeAssignments, stock] = await Promise.all([
    query('SELECT id,name,lastname FROM public.usuarios ORDER BY name,lastname'),
    query('SELECT id,full_equipment_code,equipment_code,brand,model,equipment_type,responsible FROM public.maintenances ORDER BY full_equipment_code'),
    query("SELECT employee_id,equipment_id FROM public.assignments WHERE status='active'"),
    query("SELECT id,item_type,brand,reference,model,location,quantity_available FROM public.peripheral_stock WHERE quantity_available>0 AND status='active' ORDER BY item_type,brand,reference")
  ]);
  const assignedEmployees = new Set(activeAssignments.rows.map((item) => String(item.employee_id)));
  const assignedEquipment = new Set(activeAssignments.rows.map((item) => String(item.equipment_id)));
  const isUnassigned = (value) => ['','sin asignar','no asignado','disponible'].includes(String(value ?? '').trim().toLocaleLowerCase('es-CO'));
  const usersList = users.rows.map((user) => ({ id: user.id, name: [user.name, user.lastname].filter(Boolean).join(' ') }));
  return { users: usersList, employees: usersList.filter((user) => !assignedEmployees.has(String(user.id))), equipment: equipment.rows.filter((item) => !assignedEquipment.has(String(item.id)) && isUnassigned(item.responsible)), stock: stock.rows };
}

export async function createAssignment({ employeeId, equipmentId, assignedBy, stockIds, notes }) {
  const result = await query('SELECT public.create_assignment($1,$2,$3,$4::bigint[],$5) AS result', [Number(employeeId), Number(equipmentId), Number(assignedBy), stockIds.map(Number), notes || null]);
  return result.rows[0].result;
}
