# Migración de Polling a WebSockets

## Situación Actual

El sistema actualmente utiliza **polling** (consultas periódicas cada 10-15 segundos) para mantener actualizados los datos en tiempo real. Esta es una solución simple y funcional para equipos pequeños.

## ¿Por qué considerar WebSockets?

WebSockets proporciona comunicación bidireccional en tiempo real entre el servidor y los clientes, lo que ofrece:

- ✅ **Actualizaciones instantáneas**: Los cambios se ven inmediatamente sin esperar el próximo polling
- ✅ **Menor consumo de ancho de banda**: Solo se envían datos cuando hay cambios reales
- ✅ **Menor carga del servidor**: Sin consultas constantes cada X segundos
- ✅ **Mejor experiencia de usuario**: Sincronización perfecta entre múltiples usuarios

## ¿Cuándo migrar a WebSockets?

Considera migrar cuando:

- Hay **más de 10 usuarios concurrentes** usando el sistema
- Los trabajos cambian de estado **muy frecuentemente** (cada pocos minutos)
- Se requiere **notificaciones instantáneas** de cambios
- El ancho de banda del servidor es **limitado o costoso**

Para tu caso actual (pocas personas, principalmente móvil), **el polling es suficiente**.

---

## Guía de Migración a WebSockets

### Backend (Node.js + Socket.io)

#### 1. Instalar dependencias

\`\`\`bash
cd backend
npm install socket.io
\`\`\`

#### 2. Configurar Socket.io en el servidor

**backend/src/index.js**

\`\`\`javascript
import { createServer } from 'http';
import { Server } from 'socket.io';

// ... código existente de Express ...

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // URL del frontend
    methods: ["GET", "POST"]
  }
});

// Middleware de autenticación para Socket.io
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Manejar conexiones
io.on('connection', (socket) => {
  console.log(\`Usuario conectado: \${socket.user.username}\`);
  
  socket.on('disconnect', () => {
    console.log(\`Usuario desconectado: \${socket.user.username}\`);
  });
});

// Cambiar app.listen por httpServer.listen
httpServer.listen(PORT, () => {
  console.log(\`🚀 Servidor corriendo en http://localhost:\${PORT}\`);
});

// Exportar io para usarlo en controladores
export { io };
\`\`\`

#### 3. Emitir eventos cuando hay cambios

**backend/src/controllers/trabajos.controller.js**

\`\`\`javascript
import { io } from '../index.js';

export const updateEstadoTrabajo = async (req, res) => {
  try {
    // ... código existente ...
    
    const trabajo = await prisma.trabajo.update({
      where: { id: parseInt(id) },
      data: { /* ... */ },
      include: { negocio: true, cliente: true }
    });

    // Crear registro en historial
    await prisma.historialEstado.create({ /* ... */ });

    // ✨ NUEVO: Emitir evento WebSocket
    io.emit('trabajo:actualizado', trabajo);

    res.json(trabajo);
  } catch (error) {
    // ...
  }
};

export const createTrabajo = async (req, res) => {
  try {
    // ... código existente ...
    
    const trabajo = await prisma.trabajo.create({ /* ... */ });

    // ✨ NUEVO: Emitir evento WebSocket
    io.emit('trabajo:creado', trabajo);

    res.status(201).json(trabajo);
  } catch (error) {
    // ...
  }
};
\`\`\`

### Frontend (React + Socket.io-client)

#### 1. Instalar dependencias

\`\`\`bash
cd frontend
npm install socket.io-client
\`\`\`

#### 2. Crear servicio WebSocket

**frontend/src/services/socket.js**

\`\`\`javascript
import { io } from 'socket.io-client';

let socket = null;

export const connectSocket = (token) => {
  if (socket) return socket;

  socket = io('http://localhost:3000', {
    auth: { token }
  });

  socket.on('connect', () => {
    console.log('✅ WebSocket conectado');
  });

  socket.on('disconnect', () => {
    console.log('❌ WebSocket desconectado');
  });

  socket.on('connect_error', (error) => {
    console.error('Error de conexión:', error.message);
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const getSocket = () => socket;
\`\`\`

#### 3. Conectar en el contexto de autenticación

**frontend/src/context/AuthContext.jsx**

\`\`\`javascript
import { connectSocket, disconnectSocket } from '../services/socket';

export const AuthProvider = ({ children }) => {
  // ... código existente ...

  const login = async (username, password) => {
    const data = await authApi.login(username, password);
    localStorage.setItem('token', data.token);
    setUser(data.usuario);
    
    // Conectar WebSocket
    connectSocket(data.token);
    
    return data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    
    // Desconectar WebSocket
    disconnectSocket();
  };

  // ... resto del código ...
};
\`\`\`

#### 4. Escuchar eventos en componentes

**frontend/src/pages/DashboardDueno.jsx**

\`\`\`javascript
import { useEffect } from 'react';
import { getSocket } from '../services/socket';

const DashboardDueno = () => {
  // ... código existente ...

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // Escuchar eventos de trabajos
    socket.on('trabajo:creado', (trabajo) => {
      console.log('Nuevo trabajo creado:', trabajo);
      loadData(); // Recargar datos
    });

    socket.on('trabajo:actualizado', (trabajo) => {
      console.log('Trabajo actualizado:', trabajo);
      loadData(); // Recargar datos
    });

    // Limpiar listeners al desmontar
    return () => {
      socket.off('trabajo:creado');
      socket.off('trabajo:actualizado');
    };
  }, []);

  // Eliminar o comentar el hook usePolling
  // usePolling(() => { ... }, 15000);

  // ... resto del código ...
};
\`\`\`

---

## Comparación: Polling vs WebSockets

| Aspecto | Polling (Actual) | WebSockets |
|---------|------------------|------------|
| **Complejidad** | Baja | Media |
| **Implementación** | Simple | Requiere más código |
| **Latencia** | 10-15 segundos | < 1 segundo |
| **Carga servidor** | Constante | Solo cuando hay cambios |
| **Ancho de banda** | Mayor | Menor |
| **Escalabilidad** | Hasta ~20 usuarios | Cientos de usuarios |
| **Mejor para** | Equipos pequeños | Muchos usuarios concurrentes |

---

## Recomendación

Para tu sistema actual con **pocas personas** y uso principalmente en **móvil**:

✅ **Mantén el polling por ahora** - Es más simple, más fácil de mantener y suficiente para tu caso de uso.

💡 **Considera WebSockets cuando**:
- El equipo crezca a más de 10 personas
- Necesites notificaciones push instantáneas
- El servidor tenga problemas de rendimiento con el polling

---

## Recursos Adicionales

- [Socket.io Documentation](https://socket.io/docs/v4/)
- [Socket.io with React](https://socket.io/how-to/use-with-react)
- [Authentication with Socket.io](https://socket.io/docs/v4/middlewares/)
