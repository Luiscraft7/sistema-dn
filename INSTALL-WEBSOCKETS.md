# Instalación de WebSockets (Socket.io)

## 📦 Instalar Dependencia

Para habilitar las actualizaciones en tiempo real, necesitas instalar Socket.io:

```bash
npm install socket.io
```

## 🚀 Reiniciar el Servidor

Después de instalar, reinicia el servidor:

```bash
npm start
```

O si usas nodemon:

```bash
npm run dev
```

## ✅ Verificación

Si todo está correcto, deberías ver en la consola:

```
🚀 Servidor corriendo en http://localhost:3000
📊 API disponible en http://localhost:3000/api
🔌 WebSocket habilitado para tiempo real
```

## 🔄 Cómo Funciona

### Backend (Servidor)
- Cuando un trabajador **crea** un nuevo trabajo → Emite evento `trabajo:creado`
- Cuando un trabajador **actualiza** un trabajo → Emite evento `trabajo:actualizado`
- Los eventos se envían a:
  - Todos los **administradores** (sala `admins`)
  - Todos los usuarios del **negocio específico** (sala `negocio_X`)

### Frontend (Admin)
- Se conecta al WebSocket al cargar la página
- Escucha eventos en tiempo real
- Actualiza la lista de trabajos automáticamente
- Muestra notificaciones visuales cuando hay cambios
- **Fallback automático**: Si WebSocket falla, usa polling cada 30 segundos

## 🎯 Beneficios

✅ **Actualizaciones instantáneas** - Los cambios se ven en menos de 1 segundo
✅ **Menor consumo** - Solo se envían datos cuando hay cambios reales
✅ **Notificaciones visuales** - El admin ve notificaciones cuando hay nuevos trabajos
✅ **Sin recargas** - La página se actualiza automáticamente
✅ **Fallback inteligente** - Si falla WebSocket, usa polling como respaldo

## 📱 Uso en Múltiples Pestañas

Ahora cada pestaña puede tener su propia sesión (sessionStorage) Y recibir actualizaciones en tiempo real:

- **Pestaña 1**: Admin viendo todos los negocios → Recibe TODOS los eventos
- **Pestaña 2**: Trabajador de Lavacar → Solo recibe eventos de Lavacar
- **Pestaña 3**: Trabajador de Cabinas → Solo recibe eventos de Cabinas

## 🔧 Troubleshooting

### Error: "Socket.io no está cargado"
- Verifica que el CDN esté accesible en `admin.html`
- Verifica tu conexión a internet

### Error: "Authentication error"
- El token JWT está expirado o es inválido
- Cierra sesión y vuelve a iniciar

### WebSocket no se conecta
- El sistema automáticamente usará polling como fallback
- Verifica que el puerto 3000 esté abierto
- Verifica que el servidor esté corriendo

## 📊 Monitoreo

Abre la consola del navegador (F12) para ver:
- `✅ WebSocket conectado` - Conexión exitosa
- `📝 Nuevo trabajo creado` - Evento recibido
- `🔄 Trabajo actualizado` - Evento recibido
- `⚠️ WebSocket no disponible, usando polling como fallback` - Modo respaldo

## 🔐 Seguridad

- Autenticación JWT en cada conexión WebSocket
- Solo usuarios autenticados pueden conectarse
- Cada usuario solo recibe eventos de sus negocios asignados
- Los admins reciben todos los eventos
