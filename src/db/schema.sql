-- ============================================
-- Schema de Base de Datos - Sistema DN
-- SQLite Database Schema
-- ============================================

-- Habilitar foreign keys
PRAGMA foreign_keys = ON;

-- ============================================
-- Tabla: negocios
-- Descripción: Los 3 negocios del sistema
-- ============================================
CREATE TABLE IF NOT EXISTS negocios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL UNIQUE,
  descripcion TEXT,
  activo INTEGER DEFAULT 1,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Tabla: usuarios
-- Descripción: Usuarios del sistema (dueños y trabajadores)
-- ============================================
CREATE TABLE IF NOT EXISTS usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  rol TEXT NOT NULL CHECK(rol IN ('dueño', 'trabajador')),
  negocio_id INTEGER,
  activo INTEGER DEFAULT 1,
  ultimo_acceso DATETIME,
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE SET NULL
);

-- ============================================
-- Tabla: clientes
-- Descripción: Clientes de todos los negocios
-- Nota: es_cabina=1 indica cliente de cabinas con cédula y edad
-- ============================================
CREATE TABLE IF NOT EXISTS clientes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  telefono TEXT,
  email TEXT,
  nota_extra TEXT,
  -- Campos específicos para cabinas
  cedula TEXT,
  edad INTEGER,
  es_cabina INTEGER DEFAULT 0,
  -- Auditoría
  creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
  actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Tabla: trabajos
-- Descripción: Órdenes de trabajo/servicio
-- Estados: pendiente, en_proceso, completado, cancelado
-- ============================================
CREATE TABLE IF NOT EXISTS trabajos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  negocio_id INTEGER NOT NULL,
  cliente_id INTEGER NOT NULL,
  descripcion TEXT NOT NULL,
  precio_estimado REAL,
  precio_final REAL,
  estado_actual TEXT NOT NULL DEFAULT 'pendiente' 
    CHECK(estado_actual IN ('pendiente', 'en_proceso', 'completado', 'cancelado')),
  fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
  fecha_inicio DATETIME,
  fecha_finalizacion DATETIME,
  notas TEXT,
  FOREIGN KEY (negocio_id) REFERENCES negocios(id) ON DELETE CASCADE,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- ============================================
-- Tabla: historial_estados
-- Descripción: Log de cambios de estado de trabajos
-- ============================================
CREATE TABLE IF NOT EXISTS historial_estados (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trabajo_id INTEGER NOT NULL,
  estado TEXT NOT NULL,
  nota TEXT,
  fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
  usuario_id INTEGER NOT NULL,
  FOREIGN KEY (trabajo_id) REFERENCES trabajos(id) ON DELETE CASCADE,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ============================================
-- ÍNDICES para optimización de consultas
-- ============================================

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_usuarios_username ON usuarios(username);
CREATE INDEX IF NOT EXISTS idx_usuarios_negocio ON usuarios(negocio_id);
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

CREATE INDEX IF NOT EXISTS idx_clientes_nombre ON clientes(nombre);
CREATE INDEX IF NOT EXISTS idx_clientes_telefono ON clientes(telefono);
CREATE INDEX IF NOT EXISTS idx_clientes_cedula ON clientes(cedula);
CREATE INDEX IF NOT EXISTS idx_clientes_cabina ON clientes(es_cabina);

CREATE INDEX IF NOT EXISTS idx_trabajos_negocio ON trabajos(negocio_id);
CREATE INDEX IF NOT EXISTS idx_trabajos_cliente ON trabajos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_trabajos_estado ON trabajos(estado_actual);
CREATE INDEX IF NOT EXISTS idx_trabajos_fecha ON trabajos(fecha_creacion DESC);

CREATE INDEX IF NOT EXISTS idx_historial_trabajo ON historial_estados(trabajo_id);
CREATE INDEX IF NOT EXISTS idx_historial_usuario ON historial_estados(usuario_id);
CREATE INDEX IF NOT EXISTS idx_historial_fecha ON historial_estados(fecha_hora DESC);

-- ============================================
-- TRIGGERS para actualizar timestamps
-- ============================================

-- Trigger para actualizar updated_at en usuarios
CREATE TRIGGER IF NOT EXISTS update_usuarios_timestamp 
AFTER UPDATE ON usuarios
FOR EACH ROW
BEGIN
  UPDATE usuarios SET actualizado_en = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para actualizar updated_at en clientes
CREATE TRIGGER IF NOT EXISTS update_clientes_timestamp 
AFTER UPDATE ON clientes
FOR EACH ROW
BEGIN
  UPDATE clientes SET actualizado_en = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- Trigger para actualizar updated_at en negocios
CREATE TRIGGER IF NOT EXISTS update_negocios_timestamp 
AFTER UPDATE ON negocios
FOR EACH ROW
BEGIN
  UPDATE negocios SET actualizado_en = CURRENT_TIMESTAMP WHERE id = NEW.id;
END;

-- ============================================
-- VISTAS útiles para consultas comunes
-- ============================================

-- Vista: trabajos completos con información relacionada
CREATE VIEW IF NOT EXISTS v_trabajos_completos AS
SELECT 
  t.id,
  t.descripcion,
  t.precio_estimado,
  t.precio_final,
  t.estado_actual,
  t.fecha_creacion,
  t.fecha_finalizacion,
  t.notas,
  n.id as negocio_id,
  n.nombre as negocio_nombre,
  c.id as cliente_id,
  c.nombre as cliente_nombre,
  c.telefono as cliente_telefono,
  c.cedula as cliente_cedula,
  c.es_cabina
FROM trabajos t
INNER JOIN negocios n ON t.negocio_id = n.id
INNER JOIN clientes c ON t.cliente_id = c.id;

-- Vista: usuarios con información del negocio
CREATE VIEW IF NOT EXISTS v_usuarios_completos AS
SELECT 
  u.id,
  u.nombre,
  u.username,
  u.rol,
  u.activo,
  u.ultimo_acceso,
  u.creado_en,
  n.id as negocio_id,
  n.nombre as negocio_nombre
FROM usuarios u
LEFT JOIN negocios n ON u.negocio_id = n.id;
