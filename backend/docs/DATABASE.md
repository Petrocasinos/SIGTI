# Base de datos

SIGTI usa PostgreSQL administrado por Supabase. El backend accede mediante la API REST de Supabase con la clave privada del servidor.

## Migración de producción

Use `database/023_consolidate_public_production.sql` como punto de entrada operativo. El script es transaccional y:

- crea o completa roles, usuarios, sedes, equipos, mantenimientos, inventario y solicitudes;
- copia datos desde `test` cuando el esquema existe;
- deja los objetos finales en `public`;
- configura funciones RPC, índices y permisos necesarios;
- conserva `test` para validación posterior.

Ejecute la migración desde el SQL Editor de Supabase con un rol propietario. Haga un respaldo antes de aplicarla.

## Modelo funcional

| Área | Entidades principales |
|---|---|
| Acceso | `roles`, `usuarios` |
| Catálogos | `sites`, `maintenances` |
| Historial | `maintenance_records` |
| Inventario | `peripheral_stock`, conteos por equipo |
| Préstamos | `assignments`, elementos de asignación |
| Soporte | `tickets` |
| Reportes | reportes de inventario |

Los nombres exactos, restricciones e índices son la fuente de verdad en el SQL de consolidación.

## Verificación posterior

1. Compruebe que existan los roles `sistemas` y `usuario`.
2. Confirme que el esquema usado por `SUPABASE_MAINTENANCE_SCHEMA` coincida con el esquema migrado.
3. Ejecute `npm run db:check`.
4. Verifique una autenticación, una consulta de equipos y una consulta de métricas.
5. Compare cantidades entre `test` y `public` antes de retirar el esquema de respaldo.

## Evolución del esquema

Las migraciones numeradas `001`–`022` registran cambios incrementales. No las borre: permiten auditar la evolución del modelo. Las migraciones con el mismo prefijo numérico corresponden a ramas históricas distintas; para nuevos ambientes se recomienda la consolidación `023`.
