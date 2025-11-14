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

    // Obtener IDs de negocios
    const lavacar = await prisma.negocio.findUnique({ where: { nombre: 'Lavacar' } });
    const impresion = await prisma.negocio.findUnique({ where: { nombre: 'Impresión' } });
    const cabinas = await prisma.negocio.findUnique({ where: { nombre: 'Cabinas' } });

    // Crear usuarios
    console.log('\n👤 Creando usuarios...');
    
    const usuarios = [
      {
        nombre: 'Administrador',
        username: 'admin',
        password: 'admin123',
        rol: 'dueño',
        negocioId: null
      },
      {
        nombre: 'Juan Pérez',
        username: 'juan',
        password: 'juan123',
        rol: 'trabajador',
        negocioId: lavacar.id
      },
      {
        nombre: 'María García',
        username: 'maria',
        password: 'maria123',
        rol: 'trabajador',
        negocioId: impresion.id
      },
      {
        nombre: 'Carlos López',
        username: 'carlos',
        password: 'carlos123',
        rol: 'trabajador',
        negocioId: cabinas.id
      }
    ];

    for (const userData of usuarios) {
      const usuarioExiste = await prisma.usuario.findUnique({
        where: { username: userData.username }
      });

      if (!usuarioExiste) {
        const passwordHash = await bcrypt.hash(userData.password, 10);
        
        await prisma.usuario.create({
          data: {
            nombre: userData.nombre,
            username: userData.username,
            passwordHash: passwordHash,
            rol: userData.rol,
            negocioId: userData.negocioId,
            activo: true
          }
        });
        
        console.log(`   ✅ Usuario "${userData.nombre}" creado`);
        console.log(`      Username: ${userData.username} | Password: ${userData.password} | Rol: ${userData.rol}`);
        if (userData.negocioId) {
          const negocio = await prisma.negocio.findUnique({ where: { id: userData.negocioId } });
          console.log(`      Negocio: ${negocio.nombre}`);
        }
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
  } finally {
    await prisma.$disconnect();
  }
}

main();
