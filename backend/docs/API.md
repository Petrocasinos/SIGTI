# Referencia de API

Base local: `http://localhost:3000/api`. En producción use la URL pública del backend terminada en `/api`.

Salvo `/health` y `/auth/login`, las rutas requieren:

```http
Authorization: Bearer <JWT>
```

Las respuestas de error usan el formato `{ "message": "..." }`.

## Autenticación y usuarios

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/health` | Público | Estado del servicio |
| POST | `/auth/login` | Público | Inicia sesión y entrega `token` y `user` |
| GET | `/auth/me` | Autenticado | Obtiene el usuario de la sesión |
| GET | `/users` | SISTEMAS | Lista usuarios |
| POST | `/users` | SISTEMAS | Registra un usuario y devuelve su contraseña temporal |
| GET | `/users/:id/equipment` | Propio o SISTEMAS | Consulta equipos y asignaciones del usuario |

## Inventario y mantenimiento

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/sites?company=...` | SISTEMAS | Lista sedes activas por empresa |
| GET | `/maintenances` | SISTEMAS | Lista equipos |
| POST | `/maintenances` | SISTEMAS | Registra equipo y primer mantenimiento |
| PATCH | `/maintenances/:id` | SISTEMAS | Edita los datos del equipo |
| GET | `/maintenances/:id/history` | SISTEMAS | Consulta el historial del equipo |
| GET | `/maintenances/:id/assignment` | SISTEMAS | Consulta el kit asignado |
| POST | `/maintenances/:id/records` | SISTEMAS | Registra un mantenimiento |
| GET | `/maintenance-records` | SISTEMAS | Lista el historial global |
| GET | `/maintenances/:id/peripherals` | SISTEMAS | Consulta el conteo físico del puesto |
| PUT | `/maintenances/:id/peripherals` | SISTEMAS | Guarda el conteo físico del puesto |
| GET | `/physical-peripherals/summary` | SISTEMAS | Resume periféricos por área |

## Préstamos y periféricos

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/peripheral-stock` | SISTEMAS | Consulta stock |
| POST | `/peripheral-stock` | SISTEMAS | Registra unidades en stock |
| GET | `/assignment-options` | SISTEMAS | Devuelve empleados, equipos y stock elegible |
| GET | `/assignments` | SISTEMAS | Lista asignaciones activas |
| POST | `/assignments` | SISTEMAS | Asigna un kit |
| POST | `/assignments/:id/return` | SISTEMAS | Registra devolución y estado de cada periférico |

## Solicitudes, reportes y métricas

| Método | Ruta | Acceso | Descripción |
|---|---|---|---|
| GET | `/tickets` | Autenticado | SISTEMAS ve todas; USUARIO ve las propias |
| POST | `/tickets` | Autenticado | Crea una solicitud |
| PATCH | `/tickets/:id/resolve` | SISTEMAS | Resuelve una solicitud con notas |
| GET | `/inventory-report` | USUARIO | Consulta el reporte propio |
| PUT | `/inventory-report` | USUARIO | Guarda el levantamiento propio |
| GET | `/inventory-reports` | SISTEMAS | Lista reportes de empleados |
| GET | `/dashboard/systems` | SISTEMAS | Obtiene métricas del tablero |

## Validaciones importantes

- Los códigos de equipo usan el formato `EF` seguido de 3 o 4 dígitos.
- Las prioridades de solicitud son `low`, `medium`, `high` y `critical`.
- Los tipos de equipo son `Portátil`, `Torre` y `Todo en Uno`.
- Los tipos de periférico son `mouse`, `keyboard`, `charge`, `cooling_base` y `mouse_pad`.
- Las devoluciones usan los estados `good`, `cleaning`, `damaged` y `missing`.
