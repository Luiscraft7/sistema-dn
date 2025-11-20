import prisma from '../config/database.js';

export const getClientes = async (req, res) => {
  try {
    const { buscar, esCabina } = req.query;

    const filters = [];

    if (buscar) {
      filters.push({ nombre: { contains: buscar, mode: 'insensitive' } });
      filters.push({ telefono: { contains: buscar, mode: 'insensitive' } });
      filters.push({ cedula: { contains: buscar, mode: 'insensitive' } });
    }

    const where = {};
    if (filters.length > 0) {
      where.OR = filters;
    }
    if (typeof esCabina !== 'undefined') {
      // esCabina puede venir como 'true' 'false' '1' '0'
      const esCabinaBool = esCabina === 'true' || esCabina === '1';
      where.esCabina = esCabinaBool;
    }

    const clientes = await prisma.cliente.findMany({
      where,
      include: {
        _count: {
          select: { trabajos: true }
        }
      },
      orderBy: { creadoEn: 'desc' }
    });

    res.json(clientes);

  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

export const createCliente = async (req, res) => {
  try {
    const { nombre, telefono, notaExtra, cedula, edad, esCabina } = req.body;

    // Validar campos requeridos
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    // Si es cliente de cabinas, validar cédula
    const esCabinaBool = esCabina === true || esCabina === 'true' || esCabina === 1 || esCabina === '1';
    if (esCabinaBool && (!cedula || cedula.trim() === '')) {
      return res.status(400).json({ error: 'La cédula es requerida para clientes de cabinas' });
    }

    // Edad opcional, pero si viene debe ser número positivo
    let edadNumber = null;
    if (typeof edad !== 'undefined' && edad !== null && edad !== '') {
      const parsed = parseInt(edad, 10);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ error: 'Edad inválida' });
      }
      edadNumber = parsed;
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre: nombre.trim(),
        telefono: telefono?.trim() || null,
        notaExtra: notaExtra?.trim() || null,
        cedula: cedula?.trim() || null,
        edad: edadNumber,
        esCabina: esCabinaBool
      }
    });

    res.status(201).json(cliente);

  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};

export const getClientesCabinas = async (req, res) => {
  try {
    const { buscar } = req.query;

    const filters = [];
    if (buscar) {
      filters.push({ nombre: { contains: buscar, mode: 'insensitive' } });
      filters.push({ telefono: { contains: buscar, mode: 'insensitive' } });
      filters.push({ cedula: { contains: buscar, mode: 'insensitive' } });
    }

    const where = { esCabina: true };
    if (filters.length > 0) {
      where.OR = filters;
    }

    const clientes = await prisma.cliente.findMany({
      where,
      include: {
        _count: { select: { trabajos: true } }
      },
      orderBy: { creadoEn: 'desc' }
    });

    res.json(clientes);
  } catch (error) {
    console.error('Error al obtener clientes de cabinas:', error);
    res.status(500).json({ error: 'Error al obtener clientes de cabinas' });
  }
};

export const deleteCliente = async (req, res) => {
  try {
    const { id } = req.params;
    const clienteId = parseInt(id, 10);

    if (isNaN(clienteId)) {
      return res.status(400).json({ error: 'ID inválido' });
    }

    // Verificar si el cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { id: clienteId },
      include: { _count: { select: { trabajos: true } } }
    });

    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    // Si tiene trabajos asociados, no permitir eliminación
    if (cliente._count.trabajos > 0) {
      return res.status(400).json({ 
        error: `No se puede eliminar el cliente porque tiene ${cliente._count.trabajos} trabajo(s) asociado(s)` 
      });
    }

    // Eliminar cliente
    await prisma.cliente.delete({
      where: { id: clienteId }
    });

    res.json({ message: 'Cliente eliminado correctamente' });

  } catch (error) {
    console.error('Error al eliminar cliente:', error);
    res.status(500).json({ error: 'Error al eliminar cliente' });
  }
};
