# Operación y despliegue

## Checklist de entrega

- [ ] Crear el proyecto de Supabase y aplicar `023_consolidate_public_production.sql`.
- [ ] Configurar `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` y `SUPABASE_MAINTENANCE_SCHEMA`.
- [ ] Configurar `FRONTEND_URL` con el dominio real del frontend.
- [ ] Desplegar el backend en Vercel.
- [ ] Validar `GET /api/health`.
- [ ] Ejecutar `npm test` antes de publicar cambios.
- [ ] Probar login, usuarios, tickets, inventario y mantenimientos.

## Diagnóstico rápido

| Síntoma | Revisión |
|---|---|
| `401` | Token ausente, expirado o firmado con otro `JWT_SECRET` |
| `403` | El usuario autenticado no tiene el rol requerido |
| Error de CORS | Añadir el origen del frontend a `FRONTEND_URL` |
| Error de Supabase | Revisar URL, `service_role` y esquema configurado |
| No aparecen datos | Confirmar que la migración se ejecutó en `public` y que el backend usa ese esquema |
| Vercel no responde | Revisar `vercel.json`, variables del entorno y logs de la función |

## Importaciones seguras

Ejecute primero las importaciones en modo simulación. Mantenga los archivos Excel fuera del repositorio. La importación de historial requiere `--apply` para escribir datos; la de empleados requiere `--dry-run` para simular.

## Rotación de credenciales

Ante una exposición, rote inmediatamente la clave `service_role` en Supabase, cambie `JWT_SECRET`, redeploye el backend y fuerce nuevos inicios de sesión. No intente corregir una credencial expuesta únicamente eliminándola del historial Git.
