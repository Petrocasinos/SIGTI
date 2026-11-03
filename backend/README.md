# SIGTI Backend

API REST de SIGTI (Sistema Integrado de Gestión de TI). El servicio está construido con Node.js y Express, autentica usuarios mediante JWT y persiste la información en Supabase mediante su API REST.

## Responsabilidades

- Autenticación y autorización de usuarios con los roles `SISTEMAS` y `USUARIO`.
- Inventario de equipos y periféricos.
- Asignación y devolución de kits de trabajo.
- Registro e historial de mantenimientos.
- Solicitudes de soporte y resolución con notas.
- Reportes de inventario físico.
- Métricas para el tablero de Sistemas.

## Requisitos

- Node.js 20 o superior recomendado.
- Una instancia de Supabase/PostgreSQL con el esquema de SIGTI.
- Una clave `service_role` de Supabase. Nunca la exponga en el frontend.

## Instalación y ejecución local

```bash
npm install
copy .env.example .env
npm run dev
```

El servidor queda disponible por defecto en `http://localhost:3000` y la API bajo `/api`.

Comandos disponibles:

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor con recarga automática |
| `npm start` | Ejecución normal |
| `npm test` | Pruebas de integración de la API |
| `npm run db:check` | Verifica la conexión con Supabase |
| `npm run import:employees` | Importa empleados desde Excel |
| `npm run import:maintenance-history` | Importa equipos e historial desde Excel |

## Variables de entorno

Copie `.env.example` a `.env` y complete:

| Variable | Descripción |
|---|---|
| `PORT` | Puerto HTTP, normalmente `3000` |
| `FRONTEND_URL` | Orígenes permitidos por CORS; admite varios separados por coma |
| `JWT_SECRET` | Clave larga y privada para firmar tokens |
| `JWT_EXPIRES_IN` | Vigencia del token, por ejemplo `8h` |
| `SUPABASE_URL` | URL del proyecto Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave privada usada únicamente por el backend |
| `SUPABASE_MAINTENANCE_SCHEMA` | Esquema de equipos y mantenimiento, normalmente `public` |
| `EMPLOYEES_XLSX_PATH` | Ruta del Excel para la importación de empleados |

En producción, `NODE_ENV=production` permite cargar `.env.prod` localmente. En Vercel deben configurarse las variables en el panel del proyecto; no se debe subir ningún archivo `.env`.

## Arquitectura

```text
Cliente HTTP
    ↓
src/server.js → src/app.js
                  ├─ auth.js       JWT y middleware de autenticación
                  ├─ users.js      Usuarios y roles
                  ├─ maintenances.js  Equipos y mantenimientos
                  ├─ loans.js      Stock, asignaciones y devoluciones
                  ├─ peripherals.js Conteo físico de periféricos
                  ├─ tickets.js    Solicitudes de soporte
                  ├─ dashboard.js  Métricas
                  └─ inventoryReports.js Reportes de inventario
    ↓
Supabase REST API → PostgreSQL
```

`src/app.js` concentra las rutas, validaciones con Zod y reglas de autorización. Los módulos de dominio encapsulan las consultas a Supabase.

## Base de datos

La migración recomendada para una instalación nueva o para producción es:

```text
database/023_consolidate_public_production.sql
```

Debe ejecutarse con un rol propietario de las tablas. La migración consolida el modelo final en `public`, copia datos existentes desde `test` cuando están disponibles, crea funciones, índices y permisos, y conserva `test` como respaldo para validación.

No ejecute las migraciones históricas en orden sobre una base que ya fue consolidada sin revisar primero su estado. Las migraciones `001` a `022` documentan la evolución del modelo y sirven como referencia histórica.

## Importaciones

### Empleados

El archivo debe incluir las columnas `Nombre completo` y `Área` en una hoja de Excel. Primero ejecute una simulación:

```bash
npm run import:employees -- --dry-run
npm run import:employees
```

El script evita usuarios y correos duplicados, asigna el rol según el área y crea una contraseña temporal. Esa contraseña debe comunicarse por un canal seguro y cambiarse antes de operar en producción.

### Historial de mantenimiento

El archivo de entrada debe contener las columnas utilizadas por `scripts/import-maintenance-history.js`, incluyendo `Codigo Equipo`, `Tipo de Equipo`, `Ult Mantenimiento`, `Area`, `Usuario` y los datos técnicos del equipo. Por seguridad, el comportamiento predeterminado es simulación:

```bash
npm run import:maintenance-history -- ruta\archivo.xlsx
npm run import:maintenance-history -- ruta\archivo.xlsx --apply
```

El proceso evita códigos existentes y revierte el equipo creado si falla la creación de su registro histórico.

## Despliegue en Vercel

El archivo `vercel.json` publica `src/server.js` como función Node. Configure las variables de entorno del backend y despliegue desde la rama `main` o desde el proveedor conectado al repositorio.

Después del despliegue:

1. Compruebe `GET /api/health`.
2. Ejecute `npm run db:check` contra la configuración de la base destino.
3. Verifique que `FRONTEND_URL` incluya el dominio del frontend.
4. Pruebe inicio de sesión y una consulta protegida.

## Seguridad y operación

- No suba `.env`, claves de Supabase, tokens ni archivos de datos de empleados.
- Cambie `JWT_SECRET` por ambiente.
- No use la contraseña temporal de importación como contraseña permanente.
- Las rutas protegidas requieren `Authorization: Bearer <token>`.
- El rol `SISTEMAS` administra inventario, usuarios, mantenimientos, asignaciones y resolución de solicitudes.
- El rol `USUARIO` puede consultar sus recursos, crear solicitudes y registrar su reporte de inventario.

## Pruebas

```bash
npm test
```

Las pruebas reemplazan las llamadas a Supabase por respuestas controladas y verifican autenticación, permisos, métricas, sedes, historial y operaciones de mantenimiento. Para cambios en una ruta, agregue o actualice su caso en `test/auth.test.js`.

## Documentación adicional

- [Referencia de API](docs/API.md)
- [Base de datos y migraciones](docs/DATABASE.md)
- [Operación y despliegue](docs/OPERATIONS.md)
