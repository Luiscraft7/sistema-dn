import prisma from '../config/database.js';

export const getTrabajos = async (req, res) => {
  try {
    const { negocioId, estado, fechaDesde, fechaHasta } = req.query;

    // Construir filtros
    const where = {};

    if (negocioId) {
      where.negocioId = parseInt(negocioId);
    }

    if (estado) {
      where.estadoActual = estado;
    }

    if (fechaDesde || fechaHasta) {
      where.fechaCreacion = {};
      if (fechaDesde) where.fechaCreacion.gte = new Date(fechaDesde);
      if (fechaHasta) where.fechaCreacion.lte = new Date(fechaHasta);
    }

    const trabajos = await prisma.trabajo.findMany({
      where,
      include: {
        negocio: true,
        cliente: true,
        historialEstados: {
          include: {
            usuario: {
              select: {
                id: true,
                nombre: true,
                username: true
              }
            }
          },
          orderBy: { fechaHora: 'desc' }
        }
      },
      orderBy: { fechaCreacion: 'desc' }
    });

    res.json(trabajos);

  } catch (error) {
    console.error('Error al obtener trabajos:', error);
    res.status(500).json({ error: 'Error al obtener trabajos' });
  }
};

export const createTrabajo = async (req, res) => {
  try {
    const { negocioId, clienteId, descripcion, precioEstimado } = req.body;

    // Validar campos requeridos
    if (!negocioId || !clienteId || !descripcion) {
      return res.status(400).json({ 
        error: 'negocioId, clienteId y descripcion son requeridos' 
      });
    }

    // Verificar que el negocio existe
    const negocio = await prisma.negocio.findUnique({
      where: { id: parseInt(negocioId) }
    });

    if (!negocio) {
      return res.status(404).json({ error: 'Negocio no encontrado' });
    }

    // Verificar que el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: parseInt(clienteId) }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Crear trabajo con estado inicial "pendiente"
    const trabajo = await prisma.trabajo.create({
      data: {
        negocioId: parseInt(negocioId),
        clienteId: parseInt(clienteId),
        descripcion: descripcion.trim(),
        precioEstimado: precioEstimado ? parseFloat(precioEstimado) : null,
        estadoActual: 'pendiente'
      },
      include: {
        negocio: true,
        cliente: true
      }
    });

    // Crear primer registro en historial
    await prisma.historialEstado.create({
      data: {
        trabajoId: trabajo.id,
        estado: 'pendiente',
        usuarioId: req.user.id
      }
    });

    res.status(201).json(trabajo);

  } catch (error) {
    console.error('Error al crear trabajo:', error);
    res.status(500).json({ error: 'Error al crear trabajo' });
  }
};

export const updateEstadoTrabajo = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar estado
    const estadosValidos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
    if (!estado || !estadosValidos.includes(estado)) {
      return res.status(400).json({ 
        error: 'Estado inválido. Debe ser: pendiente, en_proceso, completado o cancelado' 
      });
    }

    // Verificar que el trabajo existe
    const trabajoExiste = await prisma.trabajo.findUnique({
      where: { id: parseInt(id) }
    });

    if (!trabajoExiste) {
      return res.status(404).json({ error: 'Trabajo no encontrado' });
    }

    // Actualizar trabajo
    const trabajo = await prisma.trabajo.update({
      where: { id: parseInt(id) },
      data: {
        estadoActual: estado,
        fechaFinalizacion: (estado === 'completado' || estado === 'cancelado') 
          ? new Date() 
          : null
      },
      include: {
        negocio: true,
        cliente: true
      }
    });

    // Crear registro en historial
    await prisma.historialEstado.create({
      data: {
        trabajoId: trabajo.id,
        estado: estado,
        usuarioId: req.user.id
      }
    });

    res.json(trabajo);

  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado del trabajo' });
  }
};
