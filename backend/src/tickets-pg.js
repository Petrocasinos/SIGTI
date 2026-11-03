import { query } from './db.js';

export async function listTickets(userId = null) {
  const result = await query(`SELECT t.id,t.title,t.description,t.priority,t.status,t.resolution_notes,t.user_id,t.technician_id,t.created_at,t.updated_at,
    COALESCE(NULLIF(TRIM(CONCAT_WS(' ',u.name,u.lastname)),''),'Usuario no definido') AS requester_name,
    NULLIF(TRIM(CONCAT_WS(' ',tech.name,tech.lastname)),'') AS technician_name
    FROM public.tickets t LEFT JOIN public.usuarios u ON u.id=t.user_id LEFT JOIN public.usuarios tech ON tech.id=t.technician_id
    ${userId ? 'WHERE t.user_id=$1' : ''} ORDER BY t.created_at DESC`, userId ? [userId] : []);
  return result.rows;
}

export async function createTicket({ userId, title, description, priority }) {
  const result = await query('INSERT INTO public.tickets (title,description,priority,status,user_id) VALUES ($1,$2,$3,$4,$5) RETURNING *', [title, description || null, priority, 'open', Number(userId)]);
  return result.rows[0];
}

export async function resolveTicket(ticketId, resolutionNotes) {
  const result = await query("UPDATE public.tickets SET status='resolved',resolution_notes=$1,updated_at=NOW() WHERE id=$2 RETURNING *", [resolutionNotes, ticketId]);
  return result.rows[0] ?? null;
}
