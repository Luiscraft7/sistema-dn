const db = require('../db/database');

exports.getNegocios = async (req, res) => {
  try {
    const negocios = await db.allAsync('SELECT * FROM negocios ORDER BY nombre');
    res.json(negocios);
  } catch (error) {
    console.error('Error al obtener negocios:', error);
    res.status(500).json({ error: 'Error al obtener negocios' });
  }
};
