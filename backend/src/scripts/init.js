import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando configuración de la base de datos...\n');

  try {
    // Crear los 3 negocios
    console.log('📊 Creando negocios...');
    
    const negocios = [
      { nombre: 'Lavacar' },
      { nombre: 'Impresión' },
      { nombre: 'Cabinas' }
    ];

    for (const negocio of negocios) {
      const existe = await prisma.negocio.findUnique({
        where: { nombre: negocio.nombre }
      });

      if (!existe) {
        await prisma.negocio.create({ data: negocio });
        console.log(`   ✅ Negocio "${negocio.nombre}" creado`);
      } else {
        console.log(`   ℹ️  Negocio "${negocio.nombre}" ya existe`);
      }
    }

    // Crear usuario administrador
    console.log('\n👤 Creando usuario administrador...');
    
    const adminUsername = 'admin';
    const adminPassword = 'admin123';
    
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { username: adminUsername }
    });

    if (!usuarioExiste) {
      const passwordHash = await bcrypt.hash(adminPassword, 10);
      
      await prisma.usuario.create({
        data: {
          nombre: 'Administrador',
          username: adminUsername,
          passwordHash: passwordHash,
          rol: 'dueño',
          activo: true
        }
      });
      
      console.log('   ✅ Usuario administrador creado');
      console.log(`   📝 Username: ${adminUsername}`);
      console.log(`   🔑 Password: ${adminPassword}`);
    } else {
      console.log('   ℹ️  Usuario administrador ya existe');
    }

    console.log('\n✨ ¡Base de datos inicializada correctamente!\n');
    console.log('Puedes iniciar sesión con:');
    console.log(`   Usuario: ${adminUsername}`);
    console.log(`   Contraseña: ${adminPassword}\n`);

  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
