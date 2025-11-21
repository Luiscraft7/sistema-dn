const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const authRoutes = require('./src/routes/auth.routes');
const negociosRoutes = require('./src/routes/negocios.routes');
const clientesRoutes = require('./src/routes/clientes.routes');
const trabajosRoutes = require('./src/routes/trabajos.routes');
const usuariosRoutes = require('./src/routes/usuarios.routes');

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});
const PORT = process.env.PORT || 3000;

// Hacer io disponible globalmente
global.io = io;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/negocios', negociosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/trabajos', trabajosRoutes);
app.use('/api/usuarios', usuariosRoutes);

// Ruta de prueba
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sistema DN API funcionando' });
});

// SPA: servir index.html para todas las rutas no-API
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: err.message 
  });
});

// Socket.io - Middleware de autenticación
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu-secreto-jwt-super-seguro');
    socket.user = decoded;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.io - Manejar conexiones
io.on('connection', (socket) => {
  console.log(`✅ Usuario conectado: ${socket.user.usuario} (${socket.user.rol})`);
  
  // Usuario se une a sala de su negocio
  if (socket.user.negocioId) {
    socket.join(`negocio_${socket.user.negocioId}`);
  }
  
  // Admins se unen a sala general
  if (socket.user.rol === 'dueno' || socket.user.rol === 'dueño') {
    socket.join('admins');
  }
  
  socket.on('disconnect', () => {
    console.log(`❌ Usuario desconectado: ${socket.user.usuario}`);
  });
});

// Iniciar servidor
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 API disponible en http://localhost:${PORT}/api`);
  console.log(`🔌 WebSocket habilitado para tiempo real`);
});

module.exports = { app, io };
