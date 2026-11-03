import bcrypt from 'bcryptjs';
import { query, withTransaction } from './db.js';
import { normalizeArea } from './areas.js';

export const TEMPORARY_USER_PASSWORD = 'Petrocasinos2026';

function hydrate(row) {
  if (!row) return null;
  return { ...row, passwordHash: row.password, role: String(row.role_name).toUpperCase() };
}

function normalizeUsernamePart(value) {
  return String(value ?? '').trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, '');
}

function nextAvailableUsername({ name, firstLastName, secondLastName }, takenUsernames) {
  const firstName = normalizeUsernamePart(String(name).split(/\s+/)[0]);
  const firstSurname = normalizeUsernamePart(firstLastName);
  const secondSurname = normalizeUsernamePart(secondLastName);
  const base = `${firstName}.${firstSurname}`;
  const candidates = secondSurname ? [base, `${base}.${secondSurname[0]}`] : [base];
  for (const candidate of candidates) if (!takenUsernames.has(candidate)) return candidate;
  const fallback = candidates.at(-1);
  let suffix = 2;
  while (takenUsernames.has(`${fallback}${suffix}`)) suffix += 1;
  return `${fallback}${suffix}`;
}

export function buildUsername(input, takenUsernames = new Set()) {
  return nextAvailableUsername(input, new Set([...takenUsernames].map(normalizeUsernamePart)));
}

const userSelect = 'u.id,u.name,u.lastname,u.username,u.email,u.password,u.role_id,u.area,r.name AS role_name';

export async function createUser({ name, firstLastName, secondLastName = '', email, area }) {
  return withTransaction(async (client) => {
    const existing = await client.query('SELECT username FROM public.usuarios');
    const roles = await client.query("SELECT id,name FROM public.roles WHERE name IN ('sistemas','usuario')");
    const normalizedArea = normalizeArea(area);
    const role = roles.rows.find((item) => item.name.toLowerCase() === (normalizedArea === 'SISTEMAS' ? 'sistemas' : 'usuario'));
    if (!role) throw new Error('No se encontraron los roles Sistemas y Usuario en la base de datos.');
    const normalizedEmail = email.trim().toLowerCase();
    const duplicate = await client.query('SELECT 1 FROM public.usuarios WHERE email=$1 LIMIT 1', [normalizedEmail]);
    if (duplicate.rowCount) { const error = new Error('Ya existe un usuario registrado con ese correo electrónico.'); error.status = 409; throw error; }
    const username = buildUsername({ name, firstLastName, secondLastName }, new Set(existing.rows.map((item) => item.username)));
    const password = await bcrypt.hash(TEMPORARY_USER_PASSWORD, 12);
    const result = await client.query('INSERT INTO public.usuarios (name,lastname,username,email,password,role_id,area) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id,name,lastname,username,email,role_id,area', [name.trim(), [firstLastName.trim(), secondLastName.trim()].filter(Boolean).join(' '), username, normalizedEmail, password, role.id, normalizedArea]);
    return { ...result.rows[0], temporaryPassword: TEMPORARY_USER_PASSWORD };
  });
}

export async function findUserByUsername(username) {
  const result = await query(`SELECT ${userSelect} FROM public.usuarios u JOIN public.roles r ON r.id=u.role_id WHERE u.username=$1 LIMIT 1`, [username.trim().toLowerCase()]);
  return hydrate(result.rows[0]);
}

export async function findUserById(id) {
  const result = await query(`SELECT ${userSelect} FROM public.usuarios u JOIN public.roles r ON r.id=u.role_id WHERE u.id=$1 LIMIT 1`, [id]);
  return hydrate(result.rows[0]);
}

export async function listUsers() {
  const result = await query('SELECT id,name,lastname,username,area FROM public.usuarios ORDER BY name,lastname');
  return result.rows.map((user) => ({ id: user.id, name: [user.name, user.lastname].filter(Boolean).join(' '), username: user.username, area: user.area }));
}

export function publicUser(user) {
  return { id: user.id, name: [user.name, user.lastname].filter(Boolean).join(' '), username: user.username, role: user.role, area: user.area };
}
