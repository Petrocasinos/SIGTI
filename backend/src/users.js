import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { normalizeArea } from './areas.js';

export const TEMPORARY_USER_PASSWORD = 'Petrocasinos2026';

function headers() {
  if (!config.supabaseUrl || !config.supabaseServiceRoleKey) {
    throw new Error('La configuración de Supabase no está completa.');
  }
  const result = {
    apikey: config.supabaseServiceRoleKey,
    Authorization: `Bearer ${config.supabaseServiceRoleKey}`
  };
  if (config.supabaseAuthSchema !== 'public') result['Accept-Profile'] = config.supabaseAuthSchema;
  return result;
}

function writeHeaders() {
  const result = headers();
  if (config.supabaseAuthSchema !== 'public') result['Content-Profile'] = config.supabaseAuthSchema;
  result['Content-Type'] = 'application/json';
  return result;
}

async function getRows(table, parameters) {
  const url = new URL(`/rest/v1/${table}`, config.supabaseUrl);
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, value);

  const response = await fetch(url, { headers: headers() });
  if (!response.ok) throw new Error(`No fue posible consultar ${table}.`);
  return response.json();
}

function normalizeUsernamePart(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function nextAvailableUsername({ name, firstLastName, secondLastName }, takenUsernames) {
  const firstName = normalizeUsernamePart(String(name).split(/\s+/)[0]);
  const firstSurname = normalizeUsernamePart(firstLastName);
  const secondSurname = normalizeUsernamePart(secondLastName);
  const base = `${firstName}.${firstSurname}`;
  const candidates = [base];
  if (secondSurname) candidates.push(`${base}.${secondSurname[0]}`);

  for (const candidate of candidates) {
    if (!takenUsernames.has(candidate)) return candidate;
  }

  const fallback = candidates.at(-1);
  let suffix = 2;
  while (takenUsernames.has(`${fallback}${suffix}`)) suffix += 1;
  return `${fallback}${suffix}`;
}

export function buildUsername({ name, firstLastName, secondLastName = '' }, takenUsernames = new Set()) {
  return nextAvailableUsername({ name, firstLastName, secondLastName }, new Set([...takenUsernames].map(normalizeUsernamePart)));
}

export async function createUser({ name, firstLastName, secondLastName = '', email, area }) {
  const [existingUsers, roles] = await Promise.all([
    getRows('usuarios', { select: 'username' }),
    getRows('roles', { name: 'in.(sistemas,usuario)', select: 'id,name' })
  ]);
  const normalizedArea = normalizeArea(area);
  const rolesByName = new Map(roles.map((role) => [String(role.name).trim().toLocaleLowerCase('es-CO'), role.id]));
  const roleId = rolesByName.get(normalizedArea === 'SISTEMAS' ? 'sistemas' : 'usuario');
  if (!roleId) throw new Error('No se encontraron los roles Sistemas y Usuario en la base de datos.');

  const normalizedEmail = email.trim().toLowerCase();
  const existingEmail = await getRows('usuarios', { email: `eq.${normalizedEmail}`, select: 'id', limit: '1' });
  if (existingEmail[0]) {
    const error = new Error('Ya existe un usuario registrado con ese correo electrónico.');
    error.status = 409;
    throw error;
  }

  const username = buildUsername({ name, firstLastName, secondLastName }, new Set(existingUsers.map((user) => user.username)));
  const password = await bcrypt.hash(TEMPORARY_USER_PASSWORD, 12);
  const response = await fetch(new URL('/rest/v1/usuarios', config.supabaseUrl), {
    method: 'POST',
    headers: { ...writeHeaders(), Prefer: 'return=representation' },
    body: JSON.stringify({
      name: name.trim(),
      lastname: [firstLastName.trim(), secondLastName.trim()].filter(Boolean).join(' '),
      username,
      email: normalizedEmail,
      area: normalizedArea,
      password,
      role_id: roleId
    })
  });
  if (!response.ok) {
    const body = await response.text();
    const error = new Error(response.status === 409 ? 'El usuario o el correo ya están registrados.' : `No fue posible registrar el usuario: ${body}`);
    error.status = response.status === 409 ? 409 : 500;
    throw error;
  }
  const [user] = await response.json();
  return { ...user, temporaryPassword: TEMPORARY_USER_PASSWORD };
}

async function hydrateUser(user) {
  if (!user) return null;
  const roles = await getRows('roles', { id: `eq.${user.role_id}`, select: 'name', limit: '1' });
  if (!roles[0]) return null;
  return { ...user, passwordHash: user.password, role: String(roles[0].name).toUpperCase() };
}

export async function findUserByUsername(username) {
  const users = await getRows('usuarios', {
    username: `eq.${username.trim().toLowerCase()}`,
    select: 'id,name,lastname,username,password,role_id,area',
    limit: '1'
  });
  return hydrateUser(users[0]);
}

export async function findUserById(id) {
  const users = await getRows('usuarios', {
    id: `eq.${id}`,
    select: 'id,name,lastname,username,password,role_id,area',
    limit: '1'
  });
  return hydrateUser(users[0]);
}

export async function listUsers() {
  const users = await getRows('usuarios', {
    select: 'id,name,lastname,username,area',
    order: 'name.asc,lastname.asc'
  });
  return users.map((user) => ({
    id: user.id,
    name: [user.name, user.lastname].filter(Boolean).join(' '),
    username: user.username,
    area: user.area
  }));
}

export function publicUser(user) {
  return {
    id: user.id,
    name: [user.name, user.lastname].filter(Boolean).join(' '),
    username: user.username,
    role: user.role,
    area: user.area
  };
}
