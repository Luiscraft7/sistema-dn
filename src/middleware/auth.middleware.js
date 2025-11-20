const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'tu-secret-key-super-segura';

exports.authMiddleware = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const token = authHeader.substring(7);

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expirado' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

exports.requireRole = (rol) => {
  return (req, res, next) => {
    if (req.user.rol !== rol) {
      return res.status(403).json({ error: 'No tienes permisos para realizar esta acción' });
    }
    next();
  };
};
