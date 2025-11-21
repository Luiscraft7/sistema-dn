// Socket.io client para tiempo real
// Carga la librería desde CDN

let socket = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

// Conectar al WebSocket
const connectSocket = (token) => {
  if (socket && socket.connected) {
    console.log('⚠️ WebSocket ya está conectado');
    return socket;
  }

  // Verificar si io está disponible (cargado desde CDN)
  if (typeof io === 'undefined') {
    console.error('❌ Socket.io no está cargado. Asegúrate de incluir el script CDN.');
    return null;
  }

  console.log('🔌 Conectando WebSocket...');

  socket = io(window.location.origin, {
    auth: { token },
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: MAX_RECONNECT_ATTEMPTS
  });

  // Eventos de conexión
  socket.on('connect', () => {
    console.log('✅ WebSocket conectado');
    reconnectAttempts = 0;
  });

  socket.on('disconnect', (reason) => {
    console.log('❌ WebSocket desconectado:', reason);
  });

  socket.on('connect_error', (error) => {
    reconnectAttempts++;
    console.error(`⚠️ Error de conexión (intento ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, error.message);
    
    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      console.log('❌ Máximo de intentos de reconexión alcanzado. Usando modo polling...');
    }
  });

  socket.on('reconnect', (attemptNumber) => {
    console.log(`✅ Reconectado después de ${attemptNumber} intentos`);
  });

  return socket;
};

// Desconectar WebSocket
const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
    console.log('🔌 WebSocket desconectado manualmente');
  }
};

// Obtener instancia actual del socket
const getSocket = () => socket;

// Verificar si está conectado
const isSocketConnected = () => socket && socket.connected;

// Escuchar eventos de trabajos (helper)
const listenToTrabajos = (callbacks = {}) => {
  if (!socket) {
    console.warn('⚠️ Socket no está conectado');
    return;
  }

  // Evento: trabajo creado
  if (callbacks.onCreated) {
    socket.on('trabajo:creado', (trabajo) => {
      console.log('📝 Nuevo trabajo creado:', trabajo);
      callbacks.onCreated(trabajo);
    });
  }

  // Evento: trabajo actualizado
  if (callbacks.onUpdated) {
    socket.on('trabajo:actualizado', (trabajo) => {
      console.log('🔄 Trabajo actualizado:', trabajo);
      callbacks.onUpdated(trabajo);
    });
  }

  // Retornar función de limpieza
  return () => {
    if (socket) {
      socket.off('trabajo:creado');
      socket.off('trabajo:actualizado');
    }
  };
};

// Exportar para uso global
if (typeof window !== 'undefined') {
  window.SocketClient = {
    connect: connectSocket,
    disconnect: disconnectSocket,
    getSocket,
    isConnected: isSocketConnected,
    listenToTrabajos
  };
}
