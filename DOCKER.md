# Despliegue con Docker

Guía completa para desplegar el Sistema DN usando Docker y Docker Compose.

## Estructura de Archivos Docker

```
Sistema-DN/
├── backend/
│   └── Dockerfile
├── frontend/
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml
└── .dockerignore
```

---

## Archivos de Configuración

### backend/Dockerfile

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci --production

# Copiar código fuente
COPY . .

# Generar Prisma Client
RUN npx prisma generate

# Exponer puerto
EXPOSE 3000

# Variables de entorno por defecto
ENV NODE_ENV=production
ENV PORT=3000

# Iniciar aplicación
CMD ["npm", "start"]
```

### frontend/Dockerfile

```dockerfile
# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Etapa 2: Producción con Nginx
FROM nginx:alpine

# Copiar build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### frontend/nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    
    root /usr/share/nginx/html;
    index index.html;
    
    # Configuración para React Router
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Proxy para API
    location /api {
        proxy_pass http://backend:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
}
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: sistema-dn-backend
    restart: unless-stopped
    ports:
      - "3000:3000"
    volumes:
      # Persistir base de datos SQLite
      - ./backend/dev.db:/app/dev.db
      - ./backend/prisma:/app/prisma
    environment:
      - NODE_ENV=production
      - PORT=3000
      - JWT_SECRET=${JWT_SECRET:-change_this_secret_in_production}
      - JWT_EXPIRES_IN=24h
      - DATABASE_URL=file:./dev.db
    networks:
      - sistema-dn-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: sistema-dn-frontend
    restart: unless-stopped
    ports:
      - "80:80"
    depends_on:
      - backend
    networks:
      - sistema-dn-network

networks:
  sistema-dn-network:
    driver: bridge

volumes:
  db-data:
```

### .dockerignore

```
# Backend
backend/node_modules
backend/dev.db
backend/dev.db-journal
backend/.env
backend/dist
backend/build

# Frontend
frontend/node_modules
frontend/dist
frontend/build
frontend/.env

# General
.git
.gitignore
*.md
.vscode
.idea
*.log
.DS_Store
```

---

## 🚀 Despliegue

### 1. Preparación

```bash
# Clonar repositorio
git clone <tu-repositorio> sistema-dn
cd sistema-dn

# Crear archivo de variables de entorno
echo "JWT_SECRET=$(openssl rand -hex 64)" > .env
```

### 2. Construir y Ejecutar

```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Ver estado
docker-compose ps
```

### 3. Inicializar Base de Datos

```bash
# Ejecutar migraciones
docker-compose exec backend npx prisma migrate deploy

# Crear usuario admin y negocios
docker-compose exec backend npm run db:init
```

### 4. Verificar

Abre tu navegador:
- **Frontend**: http://localhost
- **API**: http://localhost/api/health

---

## 🔧 Comandos Útiles

### Gestión de Contenedores

```bash
# Detener servicios
docker-compose down

# Detener y eliminar volúmenes (⚠️ borra la base de datos)
docker-compose down -v

# Reiniciar servicios
docker-compose restart

# Ver logs de un servicio específico
docker-compose logs -f backend
docker-compose logs -f frontend

# Reconstruir sin caché
docker-compose build --no-cache
```

### Backup de Base de Datos

```bash
# Crear backup
docker-compose exec backend cp dev.db dev.db.backup
docker cp sistema-dn-backend:/app/dev.db.backup ./backup-$(date +%Y%m%d).db

# Restaurar backup
docker cp ./backup-20231113.db sistema-dn-backend:/app/dev.db
docker-compose restart backend
```

### Acceder a Contenedores

```bash
# Shell en backend
docker-compose exec backend sh

# Shell en frontend
docker-compose exec frontend sh

# Ejecutar comandos
docker-compose exec backend npm run db:init
docker-compose exec backend npx prisma studio
```

---

## 🌐 Despliegue en Producción

### Con Dominio y HTTPS

1. **Instalar Docker y Docker Compose** en tu servidor

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
sudo apt install docker-compose
```

2. **Clonar repositorio**

```bash
cd /var/www
git clone <tu-repositorio> sistema-dn
cd sistema-dn
```

3. **Configurar variables de entorno**

```bash
nano .env
```

```env
JWT_SECRET=tu_secreto_super_seguro_de_64_caracteres_minimo
```

4. **Añadir HTTPS con Traefik o Nginx Proxy**

**docker-compose.prod.yml** (con Traefik):

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    container_name: traefik
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik:/etc/traefik
      - ./letsencrypt:/letsencrypt
    networks:
      - sistema-dn-network

  backend:
    build: ./backend
    container_name: sistema-dn-backend
    restart: unless-stopped
    volumes:
      - ./backend/dev.db:/app/dev.db
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.backend.rule=Host(`api.tu-dominio.com`)"
      - "traefik.http.routers.backend.entrypoints=websecure"
      - "traefik.http.routers.backend.tls.certresolver=letsencrypt"
    networks:
      - sistema-dn-network

  frontend:
    build: ./frontend
    container_name: sistema-dn-frontend
    restart: unless-stopped
    depends_on:
      - backend
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.frontend.rule=Host(`tu-dominio.com`)"
      - "traefik.http.routers.frontend.entrypoints=websecure"
      - "traefik.http.routers.frontend.tls.certresolver=letsencrypt"
    networks:
      - sistema-dn-network

networks:
  sistema-dn-network:
    driver: bridge
```

5. **Iniciar en producción**

```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 📊 Monitoreo

### Ver uso de recursos

```bash
docker stats
```

### Ver logs en tiempo real

```bash
# Todos los servicios
docker-compose logs -f

# Solo backend
docker-compose logs -f backend

# Últimas 100 líneas
docker-compose logs --tail=100 backend
```

---

## 🔄 Actualización

```bash
# 1. Descargar cambios
git pull

# 2. Reconstruir imágenes
docker-compose build

# 3. Recrear contenedores
docker-compose up -d

# 4. Aplicar migraciones si hay
docker-compose exec backend npx prisma migrate deploy
```

---

## 🛡️ Seguridad

### Buenas Prácticas

1. **Variables de entorno seguras**
   - Usa secretos aleatorios fuertes
   - No commitees archivos .env

2. **Firewall**
   ```bash
   sudo ufw allow 22     # SSH
   sudo ufw allow 80     # HTTP
   sudo ufw allow 443    # HTTPS
   sudo ufw enable
   ```

3. **Actualizaciones automáticas**
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure -plow unattended-upgrades
   ```

4. **Backups automáticos**
   ```bash
   # Cron job para backup diario
   0 2 * * * docker cp sistema-dn-backend:/app/dev.db /backups/db-$(date +\%Y\%m\%d).db
   ```

---

## 🐛 Troubleshooting

### Contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs backend

# Ver estado
docker-compose ps

# Reconstruir
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Error de base de datos

```bash
# Recrear migraciones
docker-compose exec backend npx prisma migrate reset
docker-compose exec backend npm run db:init
```

### Puerto ocupado

```bash
# Cambiar puerto en docker-compose.yml
ports:
  - "8080:80"  # En lugar de "80:80"
```

---

## 📈 Escalado (futuro)

Para escalar horizontalmente:

```yaml
services:
  backend:
    deploy:
      replicas: 3
  
  nginx-lb:
    image: nginx:alpine
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
```

---

## 📚 Recursos Adicionales

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Traefik Documentation](https://doc.traefik.io/traefik/)
