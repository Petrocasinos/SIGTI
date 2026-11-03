# Arquitectura del frontend

## Capas

```text
React entrypoint (main.jsx)
        ↓
App.jsx: sesión, rol y navegación
        ↓
AppShell.jsx / modules.jsx: vistas y formularios
        ↓
api.js: fetch, JWT y errores de transporte
        ↓
Backend REST de SIGTI
```

## Navegación

| Rol | Ruta | Vista |
|---|---|---|
| SISTEMAS | `/sistemas/inicio` | Tablero |
| SISTEMAS | `/sistemas/inventario` | Inventario de equipos |
| SISTEMAS | `/sistemas/prestamos` | Stock, asignaciones y devoluciones |
| SISTEMAS | `/sistemas/solicitudes` | Solicitudes recibidas |
| SISTEMAS | `/sistemas/mantenimiento` | Historial y mantenimientos |
| SISTEMAS | `/sistemas/usuarios` | Registro de usuarios |
| USUARIO | `/empleados/inicio` | Inicio del empleado |
| USUARIO | `/empleados/solicitud` | Nueva solicitud |
| USUARIO | `/empleados/solicitudes` | Solicitudes propias |

El inventario también usa `/sistemas/inventario/nuevo` y `/sistemas/inventario/editar?id=<id>`.

## Comunicación con la API

`src/api.js` centraliza las funciones de lectura y escritura. Cada función:

1. agrega el token cuando la ruta es protegida;
2. serializa el cuerpo JSON cuando corresponde;
3. interpreta la respuesta;
4. convierte errores de red en mensajes entendibles para el usuario.

El backend es la autoridad para permisos, validación de datos y reglas de negocio.

## Notificaciones

La aplicación consulta periódicamente las solicitudes para detectar nuevas solicitudes para Sistemas y resoluciones para empleados. Este mecanismo usa polling de 30 segundos; no es un canal en tiempo real.

## Diseño y accesibilidad

Los textos de interfaz están en español, las tablas tienen etiquetas localizadas y los formularios usan etiquetas y mensajes de error. Al modificar una vista, conserve los estados de carga, error, éxito y los atributos ARIA presentes.
