const bcrypt = require('bcrypt');
const db = require('./database');

async function initDatabase() {
  console.log('🚀 Iniciando configuración de la base de datos...\n');

  try {
    // Insertar negocios
    console.log('📊 Creando negocios...');
    const negocios = ['Lavacar', 'Impresión', 'Cabinas'];
    
    for (const nombre of negocios) {
      await db.runAsync('INSERT OR IGNORE INTO negocios (nombre) VALUES (?)', [nombre]);
      console.log(`   ✅ Negocio "${nombre}" creado/verificado`);
    }

    // Obtener IDs de negocios
    const lavacar = await db.getAsync('SELECT id FROM negocios WHERE nombre = ?', ['Lavacar']);
    const impresion = await db.getAsync('SELECT id FROM negocios WHERE nombre = ?', ['Impresión']);
    const cabinas = await db.getAsync('SELECT id FROM negocios WHERE nombre = ?', ['Cabinas']);
    
    const lavacarId = lavacar.id;
    const impresionId = impresion.id;
    const cabinasId = cabinas.id;

    // Crear usuarios
    console.log('\n👤 Creando usuarios...');
    const usuarios = [
      { nombre: 'Administrador', username: 'admin', password: 'admin123', rol: 'dueño', negocioId: null },
      { nombre: 'Juan Pérez', username: 'juan', password: 'juan123', rol: 'trabajador', negocioId: lavacarId },
      { nombre: 'María García', username: 'maria', password: 'maria123', rol: 'trabajador', negocioId: impresionId },
      { nombre: 'Carlos López', username: 'carlos', password: 'carlos123', rol: 'trabajador', negocioId: cabinasId }
    ];

    for (const userData of usuarios) {
      const exists = await db.getAsync('SELECT id FROM usuarios WHERE username = ?', [userData.username]);
      if (!exists) {
        const passwordHash = await bcrypt.hash(userData.password, 10);
        await db.runAsync(
          `INSERT INTO usuarios (nombre, username, password_hash, rol, negocio_id, activo) VALUES (?, ?, ?, ?, ?, 1)`,
          [userData.nombre, userData.username, passwordHash, userData.rol, userData.negocioId]
        );
        console.log(`   ✅ Usuario "${userData.nombre}" creado`);
        console.log(`      Username: ${userData.username} | Password: ${userData.password} | Rol: ${userData.rol}`);
      } else {
        console.log(`   ℹ️  Usuario "${userData.nombre}" ya existe`);
      }
    }

    console.log('\n✨ ¡Base de datos inicializada correctamente!\n');
    console.log('Puedes iniciar sesión con:');
    console.log('   👨‍💼 Admin: admin / admin123');
    console.log('   👷 Trabajador Lavacar: juan / juan123');
    console.log('   👷 Trabajador Impresión: maria / maria123');
    console.log('   👷 Trabajador Cabinas: carlos / carlos123\n');

  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  initDatabase().then(() => process.exit(0));
}

module.exports = initDatabase;
