import bcrypt from 'bcrypt';
import prisma from '../config/database.js';

export const getUsuarios = async (req, res) => {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: {
        id: true,
        nombre: true,
        username: true,
        rol: true,
        negocioId: true,
        negocio: {
          select: {
            id: true,
            nombre: true
          }
        },
        activo: true,
        creadoEn: true
      },
      orderBy: { creadoEn: 'desc' }
    });

    res.json(usuarios);

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
};

export const createUsuario = async (req, res) => {
  try {
    const { nombre, username, password, rol, negocioId } = req.body;

    // Validar campos requeridos
    if (!nombre || !username || !password || !rol) {
      return res.status(400).json({ 
        error: 'nombre, username, password y rol son requeridos' 
      });
    }

    // Validar rol
    if (rol !== 'dueño' && rol !== 'trabajador') {
      return res.status(400).json({ 
        error: 'El rol debe ser "dueño" o "trabajador"' 
      });
    }

    // Si es trabajador, negocioId es obligatorio
    if (rol === 'trabajador' && !negocioId) {
      return res.status(400).json({ 
        error: 'Los trabajadores deben tener un negocio asignado' 
      });
    }

    // Verificar que el username no exista
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { username: username.trim() }
    });

    if (usuarioExiste) {
      return res.status(400).json({ error: 'El username ya está en uso' });
    }

    // Si se proporciona negocioId, verificar que existe
    if (negocioId) {
      const negocioExiste = await prisma.negocio.findUnique({
        where: { id: parseInt(negocioId) }
      });

      if (!negocioExiste) {
        return res.status(400).json({ error: 'El negocio no existe' });
      }
    }

    // Hashear contraseña
    const passwordHash = await bcrypt.hash(password, 10);

    // Crear usuario
    const usuario = await prisma.usuario.create({
      data: {
        nombre: nombre.trim(),
        username: username.trim(),
        passwordHash,
        rol,
        negocioId: negocioId ? parseInt(negocioId) : null,
        activo: true
      },
      select: {
        id: true,
        nombre: true,
        username: true,
        rol: true,
        negocioId: true,
        negocio: {
          select: {
            id: true,
            nombre: true
          }
        },
        activo: true,
        creadoEn: true
      }
    });

    res.status(201).json(usuario);

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
};

export const updateUsuario = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, username, password, rol, negocioId, activo } = req.body;

    // Verificar que el usuario existe
    const usuarioExiste = await prisma.usuario.findUnique({
      where: { id: parseInt(id) }
    });

    if (!usuarioExiste) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // Preparar datos a actualizar
    const dataToUpdate = {};

    if (nombre) dataToUpdate.nombre = nombre.trim();
    if (username) {
      // Verificar que el nuevo username no esté en uso
      const usernameEnUso = await prisma.usuario.findFirst({
        where: {
          username: username.trim(),
          id: { not: parseInt(id) }
        }
      });

      if (usernameEnUso) {
        return res.status(400).json({ error: 'El username ya está en uso' });
      }

      dataToUpdate.username = username.trim();
    }
    if (password) {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }
    if (rol && (rol === 'dueño' || rol === 'trabajador')) {
      // Si cambia a trabajador, debe tener negocioId
      if (rol === 'trabajador' && !negocioId && !usuarioExiste.negocioId) {
        return res.status(400).json({ 
          error: 'Los trabajadores deben tener un negocio asignado' 
        });
      }
      dataToUpdate.rol = rol;
    }
    if (negocioId !== undefined) {
      if (negocioId === null || negocioId === '') {
        dataToUpdate.negocioId = null;
      } else {
        // Verificar que el negocio existe
        const negocioExiste = await prisma.negocio.findUnique({
          where: { id: parseInt(negocioId) }
        });

        if (!negocioExiste) {
          return res.status(400).json({ error: 'El negocio no existe' });
        }

        dataToUpdate.negocioId = parseInt(negocioId);
      }
    }
    if (typeof activo === 'boolean') {
      dataToUpdate.activo = activo;
    }

    // Actualizar usuario
    const usuario = await prisma.usuario.update({
      where: { id: parseInt(id) },
      data: dataToUpdate,
      select: {
        id: true,
        nombre: true,
        username: true,
        rol: true,
        negocioId: true,
        negocio: {
          select: {
            id: true,
            nombre: true
          }
        },
        activo: true,
        creadoEn: true
      }
    });

    res.json(usuario);

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
};
