const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

// Crear conexión a la base de datos
const db = new sqlite3.Database(path.join(__dirname, '../../database.db'), (err) => {
  if (err) {
    console.error('Error al conectar a la base de datos:', err);
    process.exit(1);
  }
});

// Convertir métodos a promesas para uso más fácil
db.runAsync = promisify(db.run.bind(db));
db.getAsync = promisify(db.get.bind(db));
db.allAsync = promisify(db.all.bind(db));
db.execAsync = promisify(db.exec.bind(db));

// Habilitar foreign keys
db.run('PRAGMA foreign_keys = ON');

// Crear tablas
const schema = `
  CREATE TABLE IF NOT EXISTS negocios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    rol TEXT NOT NULL CHECK(rol IN ('dueño', 'trabajador')),
    negocio_id INTEGER,
    activo INTEGER DEFAULT 1,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (negocio_id) REFERENCES negocios(id)
  );

  CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    telefono TEXT,
    nota_extra TEXT,
    cedula TEXT,
    edad INTEGER,
    es_cabina INTEGER DEFAULT 0,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS trabajos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    negocio_id INTEGER NOT NULL,
    cliente_id INTEGER NOT NULL,
    descripcion TEXT NOT NULL,
    precio_estimado REAL,
    estado_actual TEXT NOT NULL DEFAULT 'pendiente' CHECK(estado_actual IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_finalizacion DATETIME,
    FOREIGN KEY (negocio_id) REFERENCES negocios(id),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
  );

  CREATE TABLE IF NOT EXISTS historial_estados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    trabajo_id INTEGER NOT NULL,
    estado TEXT NOT NULL,
    nota TEXT,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id INTEGER NOT NULL,
    FOREIGN KEY (trabajo_id) REFERENCES trabajos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
  );
`;

db.exec(schema, (err) => {
  if (err) {
    console.error('Error al crear tablas:', err);
  }
});

module.exports = db;
