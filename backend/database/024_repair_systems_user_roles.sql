-- Corrige usuarios creados con el área SISTEMAS pero con el rol USUARIO.
-- Esto repara los registros existentes después de corregir el alta en el backend.

UPDATE public.usuarios AS u
SET area = 'SISTEMAS',
    role_id = r.id
FROM public.roles AS r
WHERE LOWER(BTRIM(r.name)) = 'sistemas'
  AND LOWER(BTRIM(u.area)) = 'sistemas'
  AND u.role_id IS DISTINCT FROM r.id;
