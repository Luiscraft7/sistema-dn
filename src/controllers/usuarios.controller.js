const bcrypt = require('bcrypt');
const db = require('../db/database');

exports.getUsuarios = async (req, res) => {
  try {
    const usuarios = await db.allAsync(`
      SELECT u.id, u.nombre, u.username, u.rol, u.negocio_id, u.activo, u.creado_en,
             n.nombre as negocio_nombre
      FROM usuarios u
      LEFT JOIN negocios n ON u.negocio_id = n.id
      ORDER BY u.creado_en DESC
    `);

    const usuariosFormateados = usuarios.map(u => ({
      id: u.id,
      nombre: u.nombre,
      username: u.username,
      rol: u.rol,
      negocioId: u.negocio_id,
      activo: u.activo === 1,
      creadoEn: u.creado_en,
      negocio: u.negocio_nombre ? { id: u.negocio_id, nombre: u.negocio_nombre } : null
    }));

    res.json(usuariosFormateados);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

exports.createUsuario = async (req, res) => {
  try {
    const { nombre, username, password, rol, negocioId } = req.body;

    if (!nombre || !username || !password || !rol) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    if (!['dueño', 'trabajador'].includes(rol)) {
      return res.status(400).json({ error: 'Rol inválido' });
    }

    if (rol === 'trabajador' && !negocioId) {
      return res.status(400).json({ error: 'Los trabajadores deben tener un negocio asignado' });
    }

    // Verificar si el username ya existe
    const exists = await db.getAsync('SELECT id FROM usuarios WHERE username = ?', [username]);
    if (exists) {
      return res.status(400).json({ error: 'El username ya está en uso' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const result = await db.runAsync(`
      INSERT INTO usuarios (nombre, username, password_hash, rol, negocio_id, activo)
      VALUES (?, ?, ?, ?, ?, 1)
    `, [
      nombre.trim(),
      username.trim(),
      passwordHash,
      rol,
      rol === 'trabajador' ? parseInt(negocioId) : null
    ]);

    const usuario = await db.getAsync(`
      SELECT u.id, u.nombre, u.username, u.rol, u.negocio_id, u.activo,
             n.nombre as negocio_nombre
      FROM usuarios u
      LEFT JOIN negocios n ON u.negocio_id = n.id
      WHERE u.id = ?
    `, [result.lastID]);

    res.status(201).json({
      id: usuario.id,
      nombre: usuario.nombre,
      username: usuario.username,
      rol: usuario.rol,
      negocioId: usuario.negocio_id,
      activo: usuario.activo === 1,
      negocio: usuario.negocio_nombre ? { id: usuario.negocio_id, nombre: usuario.negocio_nombre } : null
    });
  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

exports.updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, password, activo, negocioId } = req.body;

    const usuario = await db.getAsync('SELECT * FROM usuarios WHERE id = ?', [parseInt(id)]);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let passwordHash = usuario.password_hash;
    if (password) {
      passwordHash = await bcrypt.hash(password, 10);
    }

    await db.runAsync(`
      UPDATE usuarios
      SET nombre = ?, password_hash = ?, activo = ?, negocio_id = ?
      WHERE id = ?
    `, [
      nombre || usuario.nombre,
      passwordHash,
      activo !== undefined ? (activo ? 1 : 0) : usuario.activo,
      negocioId !== undefined ? negocioId : usuario.negocio_id,
      parseInt(id)
    ]);

    const usuarioActualizado = await db.getAsync(`
      SELECT u.id, u.nombre, u.username, u.rol, u.negocio_id, u.activo,
             n.nombre as negocio_nombre
      FROM usuarios u
      LEFT JOIN negocios n ON u.negocio_id = n.id
      WHERE u.id = ?
    `, [parseInt(id)]);

    res.json({
      id: usuarioActualizado.id,
      nombre: usuarioActualizado.nombre,
      username: usuarioActualizado.username,
      rol: usuarioActualizado.rol,
      negocioId: usuarioActualizado.negocio_id,
      activo: usuarioActualizado.activo === 1,
      negocio: usuarioActualizado.negocio_nombre ? { id: usuarioActualizado.negocio_id, nombre: usuarioActualizado.negocio_nombre } : null
    });
  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};
