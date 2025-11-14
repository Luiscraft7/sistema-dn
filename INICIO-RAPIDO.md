# 🚀 Guía de Inicio Rápido - Sistema DN

## Pasos para Poner en Marcha el Sistema

### 1️⃣ Instalar Dependencias

```powershell
cd C:\Users\Alfon\Sistema-DN

# Backend
cd backend
npm install

# Frontend
cd ..\frontend
npm install
```

---

### 2️⃣ Configurar Base de Datos

```powershell
cd ..\backend

# Generar cliente de Prisma
npx prisma generate

# Crear base de datos y aplicar migraciones
npx prisma migrate dev --name init

# Inicializar datos (crea admin y 3 negocios)
npm run db:init
```

Verás un mensaje confirmando la creación del usuario admin.

---

### 3️⃣ Iniciar el Sistema

```powershell
cd ..
node server.js
```

Verás:
```
========================================
  🚀 Sistema DN - Iniciando...
========================================

🧹 Limpiando puertos...
📊 [1/2] Iniciando Backend...
💻 [2/2] Iniciando Frontend...

========================================
  ✅ Sistema Iniciado!
========================================

📱 Frontend: http://localhost:5173
🔌 Backend:  http://localhost:3000
```

---

### 4️⃣ Abrir la Aplicación

Abre tu navegador en: **http://localhost:5173**

**Credenciales:**
- Usuario: `admin`
- Contraseña: `admin123`

---

## ✅ Verificación

Después de iniciar sesión, deberías ver:
- ✅ Dashboard con 3 negocios (Lavacar, Impresión, Cabinas)
- ✅ Menú de navegación
- ✅ Opción para crear trabajos
- ✅ Gestión de usuarios (solo si eres dueño)

---

## 🎯 Primeros Pasos Recomendados

1. **Crear un trabajador de prueba:**
   - Ve a "Usuarios" en el menú
   - Crea un nuevo usuario con rol "trabajador"

2. **Registrar un cliente:**
   - Ve a "Clientes"
   - Crea un cliente de prueba

3. **Crear tu primer trabajo:**
   - Clic en "+ Nuevo Trabajo"
   - Selecciona negocio, cliente y descripción
   - Guarda

4. **Actualizar estados:**
   - Ve al dashboard o a la vista de un negocio
   - Cambia el estado de un trabajo (Iniciar → Completar)

---

## 📱 Probar en Móvil

1. Encuentra la IP de tu computadora:
   ```powershell
   ipconfig
   # Busca "Dirección IPv4" en tu conexión de red
   ```

2. En tu teléfono, abre el navegador y ve a:
   ```
   http://TU_IP:5173
   ```
   Ejemplo: `http://192.168.1.100:5173`

---

## � Uso Diario

**Para iniciar el sistema cada vez:**
```powershell
cd C:\Users\Alfon\Sistema-DN
node server.js
```

**Para detener:**
Presiona `Ctrl + C`

---

## �🐛 Problemas Comunes

### "Cannot find module @prisma/client"
```powershell
cd backend
npx prisma generate
```

### "Port already in use"
No te preocupes, `node server.js` automáticamente cierra los procesos anteriores.

Si persiste:
```powershell
# Ver qué está usando el puerto
netstat -ano | findstr :3000

# Matar el proceso (reemplaza PID)
taskkill /PID <número> /F
```

### "Failed to fetch" en el frontend
- Espera unos segundos más (el backend tarda ~5 seg en iniciar)
- Revisa que no haya errores en la terminal

---

## 🔄 Reiniciar Todo

Si algo sale mal, reinicia desde cero:

```powershell
cd backend
Remove-Item dev.db -ErrorAction SilentlyContinue
npx prisma migrate reset
npm run db:init
cd ..
node server.js
```

---

## 📚 Documentación Completa

- **README.md** - Documentación completa del proyecto
- **DOCKER.md** - Despliegue con Docker
- **WEBSOCKETS.md** - Migración a tiempo real

---

## 🎉 ¡Listo!

Tu sistema está funcionando. Ahora puedes:
- Crear usuarios para tu equipo
- Registrar clientes reales
- Gestionar trabajos de tus 3 negocios
- Acceder desde cualquier dispositivo en tu red local

Para producción, consulta README.md sección "Despliegue en Producción".
