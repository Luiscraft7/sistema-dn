const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-super-segura';

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const user = await db.getAsync('SELECT * FROM usuarios WHERE username = ? AND activo = 1', [username]);

    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Obtener negocio si tiene
    let negocio = null;
    if (user.negocio_id) {
      negocio = await db.getAsync('SELECT id, nombre FROM negocios WHERE id = ?', [user.negocio_id]);
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        username: user.username,
        rol: user.rol,
        negocioId: user.negocio_id,
        negocio: negocio
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await db.getAsync('SELECT id, nombre, username, rol, negocio_id FROM usuarios WHERE id = ? AND activo = 1', [req.user.id]);

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let negocio = null;
    if (user.negocio_id) {
      negocio = await db.getAsync('SELECT id, nombre FROM negocios WHERE id = ?', [user.negocio_id]);
    }

    res.json({
      id: user.id,
      nombre: user.nombre,
      username: user.username,
      rol: user.rol,
      negocioId: user.negocio_id,
      negocio: negocio
    });
  } catch (error) {
    console.error('Error en getMe:', error);
    res.status(500).json({ error: 'Error en el servidor' });
  }
};
