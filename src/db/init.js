const bcrypt = require('bcrypt');
const db = require('./database');
const { SEED_DATA } = require('./schema');

async function inicializarDB() {
  console.log('🚀 Iniciando configuración de la base de datos...\n');

  try {
    // Crear negocios desde el schema
    console.log('📊 Creando negocios...');
    
    for (const negocio of SEED_DATA.negocios) {
      await db.runAsync('INSERT OR IGNORE INTO negocios (nombre) VALUES (?)', [negocio.nombre]);
      console.log(`   ✅ Negocio "${negocio.nombre}" creado/verificado`);
    }

    // Obtener IDs de negocios
    const negociosMap = {};
    for (const negocio of SEED_DATA.negocios) {
      const row = await db.getAsync('SELECT id FROM negocios WHERE nombre = ?', [negocio.nombre]);
      negociosMap[negocio.nombre] = row.id;
    }

    // Crear usuarios desde el schema
    console.log('\n👤 Creando usuarios...');
    
    for (const userData of SEED_DATA.usuarios) {
      // Resolver negocio_id si tiene negocio asignado
      const negocioId = userData.negocio ? negociosMap[userData.negocio] : null;
      
      const exists = await db.getAsync('SELECT id FROM usuarios WHERE username = ?', [userData.username]);
      if (!exists) {
        const passwordHash = await bcrypt.hash(userData.password, 10);
        await db.runAsync(
          `INSERT INTO usuarios (nombre, username, password_hash, rol, negocio_id, activo) VALUES (?, ?, ?, ?, ?, 1)`,
          [userData.nombre, userData.username, passwordHash, userData.rol, negocioId]
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
  inicializarDB().then(() => process.exit(0));
}

module.exports = inicializarDB;
