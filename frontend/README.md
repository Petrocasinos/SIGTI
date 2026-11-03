# SIGTI Frontend

Interfaz web de SIGTI (Sistema Integrado de Gestión de TI), desarrollada con React 19 y Vite. Consume la API REST del repositorio `SistemaIntegradoGestionTI-backend`.

## Funcionalidades

### Rol `SISTEMAS`

- Tablero con métricas de inventario, solicitudes, mantenimientos y préstamos.
- Inventario de equipos y registro de levantamiento físico.
- Stock de periféricos, asignación de kits y registro de devoluciones.
- Historial y registro de mantenimientos.
- Gestión de solicitudes de soporte y resolución con notas.
- Registro de usuarios.

### Rol `USUARIO`

- Consulta de equipos y periféricos asignados.
- Creación de solicitudes de soporte.
- Consulta del estado y resolución de sus solicitudes.
- Registro del reporte de inventario de su equipo.

## Requisitos e instalación

- Node.js 20 o superior recomendado.
- Backend de SIGTI disponible.

```bash
npm install
copy .env.example .env
npm run dev
```

Abra `http://localhost:5173`.

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor de desarrollo Vite |
| `npm run build` | Compilación de producción en `dist/` |
| `npm run preview` | Sirve localmente la compilación |

## Configuración

`VITE_API_URL` debe apuntar al backend incluyendo `/api`:

```env
VITE_API_URL=http://localhost:3000/api
```

Para producción use la URL pública del backend. Si una compilación de producción recibe por error una URL local, `src/api.js` usa el endpoint de producción incorporado como protección adicional; aun así, la variable de Vercel debe quedar correctamente configurada.

No incluya secretos en variables `VITE_*`: Vite las expone al navegador.

## Estructura

```text
src/
├─ main.jsx              Punto de entrada React
├─ api.js                Cliente HTTP y manejo de respuestas
├─ styles.css            Sistema visual y responsive
├─ app/
│  ├─ App.jsx            Sesión, navegación y rutas de la SPA
│  └─ AppShell.jsx       Contenedores y navegación de la aplicación
└─ features/
   └─ modules.jsx        Vistas funcionales de inventario, préstamos,
                         mantenimiento, usuarios y solicitudes
```

La navegación usa rutas del navegador y el fallback de `vercel.json` devuelve `index.html` para permitir recargar cualquier vista.

## Flujo de autenticación

1. El usuario envía credenciales a `POST /auth/login`.
2. El backend devuelve un JWT y el perfil público.
3. La aplicación conserva el token en el estado de sesión y lo envía como `Bearer`.
4. Las vistas se seleccionan según el rol.
5. Las solicitudes fallidas muestran el mensaje devuelto por la API.

## Despliegue en Vercel

El proyecto ya incluye `vercel.json` para el fallback de la SPA:

1. Conecte el repositorio del frontend.
2. Configure `VITE_API_URL` en Preview y Production.
3. Ejecute el build `npm run build`.
4. Compruebe login, navegación directa a rutas internas y conexión con el backend.

El dominio desplegado debe estar incluido en `FRONTEND_URL` del backend para que CORS permita las peticiones.

## Convenciones para cambios

- Mantenga las llamadas HTTP en `src/api.js`.
- Mantenga la autorización en el backend; el frontend solo controla la experiencia y la navegación.
- Reutilice los componentes y estilos existentes de `modules.jsx` y `styles.css`.
- Pruebe siempre `npm run build` antes de entregar.

## Documentación adicional

- [Arquitectura y navegación](docs/ARCHITECTURE.md)
- [Guía funcional de usuario](docs/USER_GUIDE.md)
