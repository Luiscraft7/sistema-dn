const db = require('../db/database');

exports.getTrabajos = async (req, res) => {
  try {
    const { negocioId, estado, fechaDesde, fechaHasta } = req.query;

    let query = `
      SELECT t.*, 
             c.nombre as cliente_nombre, c.telefono as cliente_telefono, c.cedula as cliente_cedula,
             n.nombre as negocio_nombre,
             (SELECT h.fecha_hora FROM historial_estados h 
              WHERE h.trabajo_id = t.id AND h.estado = 'en_proceso' 
              ORDER BY h.fecha_hora ASC LIMIT 1) as fecha_inicio
      FROM trabajos t
      JOIN clientes c ON t.cliente_id = c.id
      JOIN negocios n ON t.negocio_id = n.id
      WHERE 1=1
    `;
    const params = [];

    if (negocioId) {
      query += ' AND t.negocio_id = ?';
      params.push(parseInt(negocioId));
    }

    if (estado) {
      query += ' AND t.estado_actual = ?';
      params.push(estado);
    }

    if (fechaDesde) {
      query += ' AND date(t.fecha_creacion) >= date(?)';
      params.push(fechaDesde);
    }

    if (fechaHasta) {
      query += ' AND date(t.fecha_creacion) <= date(?)';
      params.push(fechaHasta);
    }

    query += ' ORDER BY t.fecha_creacion DESC';

    const trabajos = await db.allAsync(query, params);

    // Formatear respuesta
    const trabajosFormateados = trabajos.map(t => ({
      id: t.id,
      negocioId: t.negocio_id,
      clienteId: t.cliente_id,
      descripcion: t.descripcion,
      precioEstimado: t.precio_estimado,
      estado: t.estado_actual,
      estadoActual: t.estado_actual,
      fechaCreacion: t.fecha_creacion,
      fechaInicio: t.fecha_inicio,
      fechaFinalizacion: t.fecha_finalizacion,
      fechaCompletado: t.fecha_finalizacion,
      tiempoEstimado: 30,
      cliente: {
        id: t.cliente_id,
        nombre: t.cliente_nombre,
        telefono: t.cliente_telefono,
        cedula: t.cliente_cedula
      },
      negocio: {
        id: t.negocio_id,
        nombre: t.negocio_nombre
      }
    }));

    res.json(trabajosFormateados);
  } catch (error) {
    console.error('Error al obtener trabajos:', error);
    res.status(500).json({ error: 'Error al obtener trabajos' });
  }
};

exports.createTrabajo = async (req, res) => {
  try {
    const { negocioId, clienteId, descripcion, precioEstimado } = req.body;

    if (!negocioId || !clienteId || !descripcion) {
      return res.status(400).json({ error: 'negocioId, clienteId y descripcion son requeridos' });
    }

    const result = await db.runAsync(`
      INSERT INTO trabajos (negocio_id, cliente_id, descripcion, precio_estimado, estado_actual)
      VALUES (?, ?, ?, ?, 'pendiente')
    `, [
      parseInt(negocioId),
      parseInt(clienteId),
      descripcion.trim(),
      precioEstimado ? parseFloat(precioEstimado) : null
    ]);

    // Registrar en historial
    await db.runAsync(`
      INSERT INTO historial_estados (trabajo_id, estado, nota, usuario_id)
      VALUES (?, 'pendiente', 'Trabajo creado', ?)
    `, [result.lastID, req.user.id]);

    const trabajo = await db.getAsync(`
      SELECT t.*, 
             c.nombre as cliente_nombre, c.telefono as cliente_telefono,
             n.nombre as negocio_nombre,
             (SELECT h.fecha_hora FROM historial_estados h 
              WHERE h.trabajo_id = t.id AND h.estado = 'en_proceso' 
              ORDER BY h.fecha_hora ASC LIMIT 1) as fecha_inicio
      FROM trabajos t
      JOIN clientes c ON t.cliente_id = c.id
      JOIN negocios n ON t.negocio_id = n.id
      WHERE t.id = ?
    `, [result.lastID]);

    const response = {
      id: trabajo.id,
      negocioId: trabajo.negocio_id,
      clienteId: trabajo.cliente_id,
      descripcion: trabajo.descripcion,
      precioEstimado: trabajo.precio_estimado,
      estado: trabajo.estado_actual,
      estadoActual: trabajo.estado_actual,
      fechaCreacion: trabajo.fecha_creacion,
      fechaInicio: trabajo.fecha_inicio,
      fechaFinalizacion: trabajo.fecha_finalizacion,
      fechaCompletado: trabajo.fecha_finalizacion,
      tiempoEstimado: 30,
      cliente: {
        id: trabajo.cliente_id,
        nombre: trabajo.cliente_nombre,
        telefono: trabajo.cliente_telefono
      },
      negocio: {
        id: trabajo.negocio_id,
        nombre: trabajo.negocio_nombre
      }
    };

    // Emitir evento WebSocket a admins y negocio específico
    if (global.io) {
      global.io.to('admins').emit('trabajo:creado', response);
      global.io.to(`negocio_${trabajo.negocio_id}`).emit('trabajo:creado', response);
    }

    res.status(201).json(response);
  } catch (error) {
    console.error('Error al crear trabajo:', error);
    res.status(500).json({ error: 'Error al crear trabajo' });
  }
};

exports.updateTrabajo = async (req, res) => {
  try {
    const { id } = req.params;
    const { descripcion, precioEstimado } = req.body;

    // Construir query dinámicamente
    const updates = [];
    const params = [];

    if (descripcion !== undefined) {
      if (descripcion.trim() === '') {
        return res.status(400).json({ error: 'La descripción no puede estar vacía' });
      }
      updates.push('descripcion = ?');
      params.push(descripcion.trim());
    }

    if (precioEstimado !== undefined) {
      updates.push('precio_estimado = ?');
      params.push(precioEstimado ? parseFloat(precioEstimado) : null);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No hay campos para actualizar' });
    }

    params.push(parseInt(id));

    await db.runAsync(
      `UPDATE trabajos SET ${updates.join(', ')} WHERE id = ?`,
      params
    );

    const trabajo = await db.getAsync(
      `SELECT t.*, 
              c.nombre as cliente_nombre, c.telefono as cliente_telefono,
              n.nombre as negocio_nombre
       FROM trabajos t
       JOIN clientes c ON t.cliente_id = c.id
       JOIN negocios n ON t.negocio_id = n.id
       WHERE t.id = ?`,
      [parseInt(id)]
    );

    res.json({
      id: trabajo.id,
      negocioId: trabajo.negocio_id,
      clienteId: trabajo.cliente_id,
      descripcion: trabajo.descripcion,
      precioEstimado: trabajo.precio_estimado,
      estado: trabajo.estado_actual,
      estadoActual: trabajo.estado_actual,
      fechaCreacion: trabajo.fecha_creacion,
      fechaFinalizacion: trabajo.fecha_finalizacion,
      fechaCompletado: trabajo.fecha_finalizacion
    });
  } catch (error) {
    console.error('Error al actualizar trabajo:', error);
    res.status(500).json({ error: 'Error al actualizar trabajo' });
  }
};

exports.updateEstado = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, nota } = req.body;

    const estadosValidos = ['pendiente', 'en_proceso', 'completado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ error: 'Estado inválido' });
    }

    await db.runAsync(`
      UPDATE trabajos
      SET estado_actual = ?,
          fecha_finalizacion = CASE WHEN ? IN ('completado', 'cancelado') THEN CURRENT_TIMESTAMP ELSE fecha_finalizacion END
      WHERE id = ?
    `, [estado, estado, parseInt(id)]);

    // Registrar en historial
    await db.runAsync(`
      INSERT INTO historial_estados (trabajo_id, estado, nota, usuario_id)
      VALUES (?, ?, ?, ?)
    `, [parseInt(id), estado, nota || null, req.user.id]);

    const trabajo = await db.getAsync(
      `SELECT t.*, 
              c.nombre as cliente_nombre, c.telefono as cliente_telefono,
              n.nombre as negocio_nombre
       FROM trabajos t
       JOIN clientes c ON t.cliente_id = c.id
       JOIN negocios n ON t.negocio_id = n.id
       WHERE t.id = ?`,
      [parseInt(id)]
    );

    const response = {
      id: trabajo.id,
      negocioId: trabajo.negocio_id,
      clienteId: trabajo.cliente_id,
      descripcion: trabajo.descripcion,
      precioEstimado: trabajo.precio_estimado,
      estado: trabajo.estado_actual,
      estadoActual: trabajo.estado_actual,
      fechaCreacion: trabajo.fecha_creacion,
      fechaInicio: trabajo.fecha_inicio,
      fechaFinalizacion: trabajo.fecha_finalizacion,
      fechaCompletado: trabajo.fecha_finalizacion,
      tiempoEstimado: 30,
      cliente: {
        id: trabajo.cliente_id,
        nombre: trabajo.cliente_nombre,
        telefono: trabajo.cliente_telefono
      },
      negocio: {
        id: trabajo.negocio_id,
        nombre: trabajo.negocio_nombre
      }
    };

    // Emitir evento WebSocket a admins y negocio específico
    if (global.io) {
      global.io.to('admins').emit('trabajo:actualizado', response);
      global.io.to(`negocio_${trabajo.negocio_id}`).emit('trabajo:actualizado', response);
    }

    res.json(response);
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({ error: 'Error al actualizar estado' });
  }
};
