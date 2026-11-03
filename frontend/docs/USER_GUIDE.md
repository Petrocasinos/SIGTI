# Guía funcional de usuario

## Inicio de sesión

Ingrese el usuario y la contraseña entregados por el administrador. La sesión determina automáticamente las opciones disponibles según el rol.

## Personal de Sistemas

### Inventario

Desde `Inventario` puede consultar equipos, registrar equipos nuevos, editar su información y registrar el conteo físico de periféricos por puesto.

### Préstamos

En `Préstamos y solicitudes` registre periféricos en stock, seleccione un empleado y un equipo disponible para entregar un kit. Cuando sea devuelto, indique el estado de cada periférico: bueno, en limpieza, dañado o faltante.

### Mantenimiento

Registre el mantenimiento inicial del equipo y luego agregue registros al historial. Los equipos muestran su código, responsable, especificaciones y próxima fecha de mantenimiento.

### Solicitudes

Revise las solicitudes recibidas, filtre la información en la tabla y resuelva cada caso escribiendo las notas de solución. El empleado recibirá una notificación al detectar el cambio.

### Usuarios

Registre nombre, apellidos, correo y área. El sistema genera el usuario y una contraseña temporal; entréguela por un canal seguro y solicite el cambio de contraseña en la siguiente etapa del sistema.

## Empleados

### Solicitar soporte

Abra `Solicitar soporte de TI`, indique un título descriptivo, explique el problema y seleccione la prioridad. En `Mis solicitudes` puede consultar el estado y las notas de resolución.

### Reporte de inventario

Cuando esté habilitado en el inicio, seleccione su equipo y registre las cantidades observadas de mouse, teclado, cargador, base refrigerante y pad mouse. Guarde el reporte para que Sistemas pueda consolidarlo.

## Problemas frecuentes

- Si no puede iniciar sesión, confirme el usuario, la contraseña y que el backend esté disponible.
- Si aparece un error de conexión, revise `VITE_API_URL` y el estado de `/api/health`.
- Si una opción no aparece, confirme que el usuario tenga el rol correcto.
- Si una vista interna falla al recargar, verifique que el despliegue conserve el fallback de `vercel.json`.
