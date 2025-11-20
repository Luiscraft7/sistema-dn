/**
 * Datos de Inicialización - Sistema DN
 * Datos seed para la base de datos
 * 
 * NOTA: Las definiciones de tablas están en schema.sql
 */

/**
 * Datos iniciales del sistema
 */
const SEED_DATA = {
  negocios: [
    { nombre: 'Lavacar' },
    { nombre: 'Impresión' },
    { nombre: 'Cabinas' }
  ],
  
  usuarios: [
    {
      nombre: 'Administrador',
      username: 'admin',
      password: 'admin123',
      rol: 'dueño',
      negocio_id: null
    },
    {
      nombre: 'Juan Pérez',
      username: 'juan',
      password: 'juan123',
      rol: 'trabajador',
      negocio: 'Lavacar'
    },
    {
      nombre: 'María García',
      username: 'maria',
      password: 'maria123',
      rol: 'trabajador',
      negocio: 'Impresión'
    },
    {
      nombre: 'Carlos López',
      username: 'carlos',
      password: 'carlos123',
      rol: 'trabajador',
      negocio: 'Cabinas'
    }
  ]
};

module.exports = {
  SEED_DATA
};
