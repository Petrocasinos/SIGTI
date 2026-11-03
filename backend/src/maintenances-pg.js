import { query, withTransaction } from './db.js';

const maintenanceColumns = 'id,company,site_id,equipment_code,full_equipment_code,ip_address,area,responsible,brand,model,serial_number,equipment_type,processor_model,ram,os,hdd_size,ssd_size,is_nvme,screen_size,antivirus,glpi,observations,last_maintenance,created_at';

export async function listSites(company) {
  const result = await query('SELECT id,company,name,city,active FROM public.sites WHERE company=$1 AND active=true ORDER BY id', [company]);
  return result.rows;
}

export async function listMaintenances() {
  const result = await query(`SELECT m.${maintenanceColumns.split(',').join(',m.')}, s.name AS site_name FROM public.maintenances m LEFT JOIN public.sites s ON s.id=m.site_id ORDER BY m.created_at DESC`);
  return result.rows;
}

export async function updateMaintenance(id, data) {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const assignments = keys.map((key, index) => `${key}=$${index + 1}`).join(',');
  const result = await query(`UPDATE public.maintenances SET ${assignments} WHERE id=$${values.length + 1} RETURNING ${maintenanceColumns}`, [...values, id]);
  return result.rows[0];
}

export function updateMaintenanceResponsible(id, responsible) {
  return query('UPDATE public.maintenances SET responsible=$1 WHERE id=$2', [responsible, id]);
}

export async function listMaintenanceHistory(maintenanceId) {
  const result = await query('SELECT id,maintenance_id,maintenance_date,next_maintenance_date,maintenance_type,technician_id,description,actions_taken,observations,created_at FROM public.maintenance_records WHERE maintenance_id=$1 ORDER BY maintenance_date DESC', [maintenanceId]);
  return result.rows;
}

export async function listMaintenanceRecords() {
  const result = await query(`SELECT r.id,r.maintenance_id,r.maintenance_date,r.next_maintenance_date,r.maintenance_type,r.technician_id,r.description,r.actions_taken,r.observations,r.created_at,
    json_build_object('id',m.id,'full_equipment_code',m.full_equipment_code,'equipment_code',m.equipment_code,'company',m.company,'brand',m.brand,'model',m.model,'serial_number',m.serial_number) AS equipment,
    COALESCE(NULLIF(TRIM(CONCAT_WS(' ',u.name,u.lastname)),''),'No definido') AS technician_name
    FROM public.maintenance_records r LEFT JOIN public.maintenances m ON m.id=r.maintenance_id LEFT JOIN public.usuarios u ON u.id=r.technician_id
    ORDER BY r.maintenance_date DESC,r.created_at DESC`);
  return result.rows;
}

export async function createMaintenanceRecord({ maintenanceId, data, technicianId }) {
  return withTransaction(async (client) => {
    const result = await client.query('INSERT INTO public.maintenance_records (maintenance_id,maintenance_date,maintenance_type,technician_id,description,actions_taken,observations) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,maintenance_id,maintenance_date,next_maintenance_date,maintenance_type,technician_id,description,actions_taken,observations,created_at', [maintenanceId, data.maintenance_date, data.maintenance_type, technicianId, data.description, data.actions_taken || null, data.observations || null]);
    await client.query('UPDATE public.maintenances SET last_maintenance=$1 WHERE id=$2', [data.maintenance_date, maintenanceId]);
    return result.rows[0];
  });
}

export async function createMaintenance({ data, technicianId }) {
  return withTransaction(async (client) => {
    const maintenance = (await client.query(`INSERT INTO public.maintenances (${Object.keys(data).join(',')}) VALUES (${Object.keys(data).map((_, i) => `$${i + 1}`).join(',')}) RETURNING ${maintenanceColumns}`, Object.values(data))).rows[0];
    const record = (await client.query('INSERT INTO public.maintenance_records (maintenance_id,maintenance_date,maintenance_type,technician_id,description,observations) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id,maintenance_id,maintenance_date,next_maintenance_date,maintenance_type,technician_id,description,actions_taken,observations,created_at', [maintenance.id, maintenance.last_maintenance, 'Inicial', technicianId, 'Registro inicial de la hoja de vida técnica del equipo.', data.observations || null])).rows[0];
    return { maintenance, record };
  });
}
