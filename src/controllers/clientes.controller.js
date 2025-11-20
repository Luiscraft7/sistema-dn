const db = require('../db/database');

exports.getClientes = async (req, res) => {
  try {
    const { buscar, esCabina } = req.query;

    let query = 'SELECT *, (SELECT COUNT(*) FROM trabajos WHERE cliente_id = clientes.id) as trabajos_count FROM clientes WHERE 1=1';
    const params = [];

    if (esCabina !== undefined) {
      query += ' AND es_cabina = ?';
      params.push(esCabina === 'true' || esCabina === '1' ? 1 : 0);
    }

    if (buscar) {
      query += ' AND (nombre LIKE ? OR telefono LIKE ? OR cedula LIKE ?)';
      const searchTerm = `%${buscar}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY creado_en DESC';

    const clientes = await db.allAsync(query, params);

    // Formatear respuesta para compatibilidad
    const clientesFormateados = clientes.map(c => ({
      ...c,
      esCabina: c.es_cabina === 1,
      _count: { trabajos: c.trabajos_count }
    }));

    res.json(clientesFormateados);
  } catch (error) {
    console.error('Error al obtener clientes:', error);
    res.status(500).json({ error: 'Error al obtener clientes' });
  }
};

exports.getClientesCabinas = async (req, res) => {
  try {
    const { buscar } = req.query;

    let query = 'SELECT *, (SELECT COUNT(*) FROM trabajos WHERE cliente_id = clientes.id) as trabajos_count FROM clientes WHERE es_cabina = 1';
    const params = [];

    if (buscar) {
      query += ' AND (nombre LIKE ? OR telefono LIKE ? OR cedula LIKE ?)';
      const searchTerm = `%${buscar}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    query += ' ORDER BY creado_en DESC';

    const clientes = await db.allAsync(query, params);

    const clientesFormateados = clientes.map(c => ({
      ...c,
      esCabina: true,
      _count: { trabajos: c.trabajos_count }
    }));

    res.json(clientesFormateados);
  } catch (error) {
    console.error('Error al obtener clientes de cabinas:', error);
    res.status(500).json({ error: 'Error al obtener clientes de cabinas' });
  }
};

exports.createCliente = async (req, res) => {
  try {
    const { nombre, telefono, notaExtra, cedula, edad, esCabina } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({ error: 'El nombre es requerido' });
    }

    const esCabinaBool = esCabina === true || esCabina === 'true' || esCabina === 1 || esCabina === '1';
    
    if (esCabinaBool && (!cedula || cedula.trim() === '')) {
      return res.status(400).json({ error: 'La cédula es requerida para clientes de cabinas' });
    }

    let edadNumber = null;
    if (edad !== undefined && edad !== null && edad !== '') {
      const parsed = parseInt(edad, 10);
      if (isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ error: 'Edad inválida' });
      }
      edadNumber = parsed;
    }

    const result = await db.runAsync(
      `INSERT INTO clientes (nombre, telefono, nota_extra, cedula, edad, es_cabina) VALUES (?, ?, ?, ?, ?, ?)`,
      [nombre.trim(), telefono?.trim() || null, notaExtra?.trim() || null, cedula?.trim() || null, edadNumber, esCabinaBool ? 1 : 0]
    );

    const cliente = await db.getAsync('SELECT * FROM clientes WHERE id = ?', [result.lastID]);
    
    res.status(201).json({
      ...cliente,
      esCabina: cliente.es_cabina === 1
    });
  } catch (error) {
    console.error('Error al crear cliente:', error);
    res.status(500).json({ error: 'Error al crear cliente' });
  }
};
