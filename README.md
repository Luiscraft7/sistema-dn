# Sistema DN - Gestión de Negocios

Sistema web para gestionar 3 negocios: **Lavacar**, **Impresión** y **Cabinas**.

Diseñado para uso principalmente en móvil con equipos pequeños, incluye gestión completa de clientes, trabajos y usuarios con roles diferenciados.

---

## 📋 Características Principales

- ✅ **Login cerrado** - Solo el dueño puede crear usuarios
- ✅ **3 negocios independientes** - Cada uno con sus propios trabajos
- ✅ **Gestión de clientes** - Información de contacto y historial
- ✅ **Seguimiento de trabajos** - Estados: pendiente, en proceso, completado, cancelado
- ✅ **Historial completo** - Registro de todos los cambios de estado
- ✅ **Actualización automática** - Polling cada 10-15 segundos
- ✅ **Responsive mobile-first** - Optimizado para teléfonos
- ✅ **Roles diferenciados** - Dueño vs Trabajador

---

## 🚀 Instalación Rápida

### Requisitos Previos

- Node.js 18+ 
- npm o yarn

### 1. Instalar Dependencias

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 2. Configurar Base de Datos

```bash
cd ../backend

# Generar cliente de Prisma y crear base de datos
npx prisma generate
npx prisma migrate dev --name init

# Inicializar datos (crea usuario admin y 3 negocios)
npm run db:init
```

### 3. Iniciar el Sistema

Desde la raíz del proyecto:

```bash
cd ..
node server.js
```

**¡Eso es todo!** El sistema completo estará corriendo en:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000

---

## 🔐 Credenciales Iniciales

- **Usuario:** `admin`
- **Contraseña:** `admin123`

⚠️ **Importante:** Cambia la contraseña del admin después del primer login desde la sección de Gestión de Usuarios.

---

## 📁 Estructura del Proyecto

```
Sistema-DN/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Esquema de la base de datos
│   ├── src/
│   │   ├── config/
│   │   │   └── database.js        # Configuración de Prisma
│   │   ├── controllers/           # Lógica de negocio
│   │   ├── middleware/            # Auth y validación
│   │   ├── routes/                # Rutas de la API
│   │   ├── scripts/
│   │   │   └── init.js            # Script de inicialización
│   │   └── index.js               # Entrada del servidor
│   ├── .env                       # Variables de entorno
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/            # Componentes reutilizables
│   │   ├── context/               # Context API (Auth)
│   │   ├── hooks/                 # Custom hooks (Polling)
│   │   ├── pages/                 # Páginas/Vistas
│   │   ├── services/              # API calls
│   │   ├── App.jsx                # Configuración de rutas
│   │   ├── main.jsx               # Entrada de la app
│   │   └── index.css              # Estilos globales
│   ├── vite.config.js             # Configuración de Vite
│   └── package.json
│
├── WEBSOCKETS.md                  # Guía de migración a WebSockets
└── README.md
```

---

## 🗄️ Modelo de Datos

### Tablas

1. **usuarios** - Información de usuarios del sistema
2. **negocios** - Los 3 negocios (Lavacar, Impresión, Cabinas)
3. **clientes** - Clientes de los negocios
4. **trabajos** - Trabajos/órdenes de servicio
5. **historial_estados** - Registro de cambios de estado

### Relaciones

```
Usuario 1:N HistorialEstado
Negocio 1:N Trabajo
Cliente 1:N Trabajo
Trabajo 1:N HistorialEstado
```

---

## 🔌 API REST

### Endpoints Públicos

- `POST /api/auth/login` - Iniciar sesión

### Endpoints Protegidos (requieren JWT)

#### Autenticación
- `GET /api/auth/me` - Información del usuario actual

#### Negocios
- `GET /api/negocios` - Listar negocios

#### Clientes
- `GET /api/clientes` - Listar clientes (con búsqueda)
- `POST /api/clientes` - Crear cliente

#### Trabajos
- `GET /api/trabajos` - Listar trabajos (con filtros)
- `POST /api/trabajos` - Crear trabajo
- `PATCH /api/trabajos/:id/estado` - Actualizar estado

#### Usuarios (Solo Dueño)
- `GET /api/usuarios` - Listar usuarios
- `POST /api/usuarios` - Crear usuario
- `PATCH /api/usuarios/:id` - Actualizar usuario

---

## 👥 Roles y Permisos

### Dueño
- Ver todos los negocios y trabajos
- Crear, editar y desactivar usuarios
- Acceso completo al sistema

### Trabajador
- Ver trabajos de su negocio asignado
- Cambiar estados de trabajos
- Gestionar clientes
- Sin acceso a gestión de usuarios

---

## 🎨 Tecnologías Utilizadas

### Backend
- **Node.js** + **Express** - Servidor y API REST
- **Prisma** + **SQLite** - ORM y base de datos
- **JWT** - Autenticación
- **bcrypt** - Hash de contraseñas
- **CORS** - Seguridad cross-origin

### Frontend
- **React 18** - Framework UI
- **Vite** - Build tool y dev server
- **React Router** - Navegación
- **Context API** - Estado global
- **CSS Modules** - Estilos responsive

---

## 🔄 Sistema de Actualización

El sistema usa **polling** (consultas periódicas) para mantener los datos actualizados:

- Dashboard: cada 15 segundos
- Vista de trabajos: cada 10 segundos

Para migrar a WebSockets (actualizaciones en tiempo real), consulta `WEBSOCKETS.md`.

---

## 🚢 Despliegue en Producción

### Opción 1: Servidor VPS (Ubuntu)

#### Backend

```bash
# 1. Clonar repositorio en el servidor
git clone <tu-repositorio> /var/www/sistema-dn
cd /var/www/sistema-dn/backend

# 2. Instalar dependencias
npm install --production

# 3. Configurar variables de entorno
nano .env
# Cambiar JWT_SECRET por uno seguro
# Configurar DATABASE_URL si usas otra ubicación

# 4. Inicializar base de datos
npx prisma generate
npx prisma migrate deploy
npm run db:init

# 5. Usar PM2 para mantener el servidor corriendo
npm install -g pm2
pm2 start src/index.js --name sistema-dn-api
pm2 save
pm2 startup
```

#### Frontend

```bash
cd /var/www/sistema-dn/frontend

# 1. Instalar dependencias
npm install

# 2. Construir para producción
npm run build

# 3. Servir con nginx
sudo apt install nginx
sudo nano /etc/nginx/sites-available/sistema-dn

# Configuración nginx:
server {
    listen 80;
    server_name tu-dominio.com;
    
    # Frontend
    location / {
        root /var/www/sistema-dn/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Activar sitio
sudo ln -s /etc/nginx/sites-available/sistema-dn /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Opción 2: Docker

```dockerfile
# backend/Dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
RUN npx prisma generate
EXPOSE 3000
CMD ["npm", "start"]
```

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "3000:3000"
    volumes:
      - ./backend/dev.db:/app/dev.db
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
  
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    depends_on:
      - backend
```

---

## 🔒 Seguridad

### Recomendaciones para Producción

1. **JWT_SECRET**: Usa un secreto fuerte y único
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```

2. **HTTPS**: Usa certificado SSL (Let's Encrypt gratuito)
   ```bash
   sudo certbot --nginx -d tu-dominio.com
   ```

3. **Backups**: Respalda `dev.db` regularmente
   ```bash
   # Crear backup diario con cron
   0 2 * * * cp /var/www/sistema-dn/backend/dev.db /backups/db-$(date +\%Y\%m\%d).db
   ```

4. **Firewall**: Permite solo puertos necesarios
   ```bash
   sudo ufw allow 22    # SSH
   sudo ufw allow 80    # HTTP
   sudo ufw allow 443   # HTTPS
   sudo ufw enable
   ```

---

## 🐛 Troubleshooting

### Error: "Cannot find module '@prisma/client'"

```bash
cd backend
npx prisma generate
```

### Error: "EADDRINUSE: Port already in use"

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:3000 | xargs kill -9
```

### Base de datos corrupta

```bash
cd backend
rm dev.db
npx prisma migrate reset
npm run db:init
```

---

## 📞 Soporte

Para problemas o preguntas:
1. Revisa la documentación completa
2. Consulta `WEBSOCKETS.md` para actualizaciones en tiempo real
3. Revisa los logs del servidor con `pm2 logs sistema-dn-api`

---

## 📝 Licencia

ISC

---

## 🔄 Uso Diario

Para iniciar el sistema cada vez:

```bash
cd C:\Users\Alfon\Sistema-DN
node server.js
```

Para detener: Presiona `Ctrl + C`

---

## 🎯 Próximos Pasos

Después de la instalación:

1. ✅ Cambia la contraseña del admin
2. ✅ Crea usuarios para tu equipo
3. ✅ Registra tus primeros clientes
4. ✅ Comienza a crear trabajos
5. 📱 Accede desde tu móvil
6. 🔄 Considera WebSockets si creces a +10 usuarios
