import prisma from '../config/database.js';

export const getNegocios = async (req, res) => {
  try {
    const negocios = await prisma.negocio.findMany({
      include: {
        _count: {
          select: { trabajos: true }
        }
      }
    });

    res.json(negocios);

  } catch (error) {
    console.error('Error al obtener negocios:', error);
    res.status(500).json({ error: 'Error al obtener negocios' });
  }
};
