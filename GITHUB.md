# 🚀 Guía para Subir a GitHub

## 📋 Pasos para Desplegar en GitHub

### 1️⃣ **Inicializar Git** (si no lo has hecho)

```powershell
cd C:\Users\Alfon\Sistema-DN

# Inicializar repositorio
git init

# Verificar que .gitignore esté funcionando
git status
```

Deberías ver que NO aparecen:
- ❌ `node_modules/`
- ❌ `.env`
- ❌ `*.db` (base de datos)

---

### 2️⃣ **Crear Repositorio en GitHub**

1. Ve a https://github.com
2. Clic en el botón **"+"** → **"New repository"**
3. Nombre: `sistema-dn` (o el que prefieras)
4. Descripción: "Sistema de gestión para 3 negocios (Lavacar, Impresión, Cabinas)"
5. **NO marques** "Initialize with README" (ya tienes uno)
6. Clic en **"Create repository"**

---

### 3️⃣ **Conectar y Subir el Código**

Copia los comandos que GitHub te muestra, pero aquí están:

```powershell
cd C:\Users\Alfon\Sistema-DN

# Agregar todos los archivos
git add .

# Hacer el primer commit
git commit -m "Initial commit: Sistema DN completo"

# Cambiar rama a main (si es necesario)
git branch -M main

# Conectar con GitHub (reemplaza TU_USUARIO y TU_REPO)
git remote add origin https://github.com/TU_USUARIO/sistema-dn.git

# Subir el código
git push -u origin main
```

---

### 4️⃣ **Verificar que Todo Subió Correctamente**

Ve a tu repositorio en GitHub y verifica que se hayan subido:
- ✅ Carpetas `backend/` y `frontend/`
- ✅ Archivos de configuración
- ✅ README.md
- ✅ server.js
- ❌ NO debe aparecer `node_modules/`
- ❌ NO debe aparecer `.env`
- ❌ NO debe aparecer `*.db`

---

## 🔐 **Importante: Configuración de Seguridad**

Antes de hacer público el repositorio, asegúrate de que:

1. ✅ El `.env` NO está subido (contiene JWT_SECRET)
2. ✅ El `.env.example` SÍ está subido (sin datos sensibles)
3. ✅ La base de datos `dev.db` NO está subida
4. ✅ Todas las contraseñas por defecto están documentadas

---

## 📝 **Actualizaciones Futuras**

Cuando hagas cambios en el código:

```powershell
# Ver qué archivos cambiaron
git status

# Agregar los cambios
git add .

# Hacer commit con mensaje descriptivo
git commit -m "Descripción de los cambios"

# Subir a GitHub
git push
```

---

## 👥 **Clonar en Otra Computadora**

Si quieres instalar el sistema en otra PC:

```powershell
# Clonar repositorio
git clone https://github.com/TU_USUARIO/sistema-dn.git
cd sistema-dn

# Instalar dependencias
cd backend
npm install
cd ../frontend
npm install

# Configurar base de datos
cd ../backend
copy .env.example .env
# Edita .env y cambia JWT_SECRET

npx prisma generate
npx prisma migrate dev --name init
npm run db:init

# Iniciar sistema
cd ..
node server.js
```

---

## 🌟 **Hacer el Repositorio Privado o Público**

### **Privado** (recomendado si tiene datos sensibles)
- Ve a Settings → General → Danger Zone
- Change visibility → Make private

### **Público** (si quieres compartirlo)
- Asegúrate de que NO haya contraseñas o secrets
- Verifica que `.gitignore` esté funcionando
- Ve a Settings → General → Danger Zone
- Change visibility → Make public

---

## 🔄 **Colaborar con Otros**

Para dar acceso a otros desarrolladores:

1. Ve a Settings → Collaborators
2. Clic en "Add people"
3. Ingresa el usuario de GitHub
4. Selecciona permisos (Write, Admin, etc.)

---

## 📦 **Crear Release (Versión)**

Cuando tengas una versión estable:

```powershell
# Crear tag
git tag -a v1.0.0 -m "Primera versión estable"
git push origin v1.0.0
```

Luego en GitHub:
1. Ve a "Releases"
2. Clic en "Create a new release"
3. Selecciona el tag v1.0.0
4. Escribe notas de la versión
5. Publica

---

## 🐛 **Si Cometiste un Error**

### Subiste archivos que no debías (ej: .env, node_modules)

```powershell
# Remover del historial (cuidado, esto reescribe el historial)
git rm --cached .env
git rm -r --cached node_modules/

# Commit los cambios
git commit -m "Remover archivos sensibles"

# Forzar push
git push --force
```

### Olvidaste agregar algo al .gitignore

```powershell
# Edita .gitignore
# Luego limpia caché
git rm -r --cached .
git add .
git commit -m "Actualizar .gitignore"
git push
```

---

## 📚 **Recursos Adicionales**

- [GitHub Desktop](https://desktop.github.com/) - Cliente visual para Git
- [Git Documentation](https://git-scm.com/doc)
- [GitHub Docs](https://docs.github.com/)

---

## ✅ **Checklist Antes de Subir**

- [ ] `.gitignore` está configurado correctamente
- [ ] `.env` NO está incluido
- [ ] `.env.example` SÍ está incluido (sin secrets)
- [ ] Base de datos `*.db` NO está incluida
- [ ] `node_modules/` NO está incluido
- [ ] README.md está actualizado
- [ ] Contraseñas por defecto documentadas
- [ ] Todo compila sin errores

¡Listo para subir a GitHub! 🚀
