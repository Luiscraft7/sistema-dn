import prisma from '../config/database.js';

export const getClientes = async (req, res) => {
  try {
    const { buscar } = req.query;

    const where = buscar ? {
      OR: [
        { nombre: { contains: buscar, mode: 'insensitive' } },
        { telefono: { contains: buscar, mode: 'insensitive' } }
      ]
    } : {};

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
    const { nombre, telefono, notaExtra } = req.body;

    // Validar campos requeridos
    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre: nombre.trim(),
        telefono: telefono?.trim() || null,
        notaExtra: notaExtra?.trim() || null
      }
    });

    res.status(201).json(cliente);

  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};
