import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { trabajosApi, clientesApi } from '../services/api';
import usePolling from '../hooks/usePolling';
import './DashboardTrabajador.css';

const DashboardTrabajador = () => {
  const { user } = useAuth();
  const [trabajos, setTrabajos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarModalTrabajo, setMostrarModalTrabajo] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  
  // Form nuevo trabajo
  const [clienteSeleccionado, setClienteSeleccionado] = useState('');
  const [descripcionTrabajo, setDescripcionTrabajo] = useState('');
  const [precioEstimado, setPrecioEstimado] = useState('');
  
  // Form editar trabajo
  const [trabajoEditar, setTrabajoEditar] = useState(null);
  
  // Form nuevo cliente
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono: ''
  });

  const loadData = async () => {
    if (!user?.negocioId) return;
    
    try {
      const [trabajosData, clientesData] = await Promise.all([
        trabajosApi.getAll({ negocioId: user.negocioId }),
        clientesApi.getAll()
      ]);
      setTrabajos(trabajosData);
      setClientes(clientesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Polling cada 10 segundos
  usePolling(() => {
    if (!loading) loadData();
  }, 10000);

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    try {
      const cliente = await clientesApi.create(nuevoCliente);
      setClientes([...clientes, cliente]);
      setClienteSeleccionado(cliente.id.toString());
      setNuevoCliente({ nombre: '', telefono: '' });
      setMostrarFormCliente(false);
    } catch (error) {
      alert('Error al crear cliente: ' + error.message);
    }
  };

  const handleCrearTrabajo = async (e) => {
    e.preventDefault();
    if (!clienteSeleccionado || !descripcionTrabajo.trim()) {
      alert('Selecciona un cliente y describe el trabajo');
      return;
    }

    try {
      await trabajosApi.create({
        negocioId: user.negocioId,
        clienteId: parseInt(clienteSeleccionado),
        descripcion: descripcionTrabajo.trim(),
        precioEstimado: precioEstimado ? parseFloat(precioEstimado) : null
      });
      
      // Resetear form
      setClienteSeleccionado('');
      setDescripcionTrabajo('');
      setPrecioEstimado('');
      setMostrarModalTrabajo(false);
      
      // Recargar trabajos
      loadData();
    } catch (error) {
      alert('Error al crear trabajo: ' + error.message);
    }
  };

  const handleCambiarEstado = async (trabajoId, nuevoEstado) => {
    try {
      await trabajosApi.updateEstado(trabajoId, { estado: nuevoEstado });
      loadData();
    } catch (error) {
      alert('Error al actualizar estado: ' + error.message);
    }
  };

  const handleAbrirEditar = (trabajo) => {
    setTrabajoEditar({
      id: trabajo.id,
      descripcion: trabajo.descripcion,
      precioEstimado: trabajo.precioEstimado || ''
    });
    setMostrarModalEditar(true);
  };

  const handleGuardarEdicion = async (e) => {
    e.preventDefault();
    if (!trabajoEditar.descripcion.trim()) {
      alert('La descripción es obligatoria');
      return;
    }

    try {
      await trabajosApi.update(trabajoEditar.id, {
        descripcion: trabajoEditar.descripcion.trim(),
        precioEstimado: trabajoEditar.precioEstimado ? parseFloat(trabajoEditar.precioEstimado) : null
      });
      
      setMostrarModalEditar(false);
      setTrabajoEditar(null);
      loadData();
    } catch (error) {
      alert('Error al editar trabajo: ' + error.message);
    }
  };

  const getEstadoBadgeClass = (estado) => {
    const clases = {
      pendiente: 'badge-pending',
      en_proceso: 'badge-progress',
      completado: 'badge-completed',
      cancelado: 'badge-cancelled'
    };
    return clases[estado] || 'badge-pending';
  };

  const getEstadoTexto = (estado) => {
    const textos = {
      pendiente: 'Pendiente',
      en_proceso: 'En Proceso',
      completado: 'Completado',
      cancelado: 'Cancelado'
    };
    return textos[estado] || estado;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">⏳ Cargando...</div>
      </div>
    );
  }

  if (!user?.negocioId) {
    return (
      <div className="container">
        <div className="card">
          <p>❌ No tienes un negocio asignado. Contacta al administrador.</p>
        </div>
      </div>
    );
  }

  // Filtrar trabajos
  const trabajosFiltrados = filtroEstado === 'todos' 
    ? trabajos 
    : trabajos.filter(t => t.estadoActual === filtroEstado);

  const trabajosActivos = trabajos.filter(t => 
    t.estadoActual === 'pendiente' || t.estadoActual === 'en_proceso'
  );

  return (
    <div className="dashboard-trabajador">
      {/* Header */}
      <div className="container">
        <h1>👋 Hola, {user.nombre}</h1>
        <span className="negocio-badge">{user.negocio?.nombre}</span>
      </div>

      {/* Filtros */}
      <div className="container">
        <div className="estado-filters">
          <button
            className={`filter-btn ${filtroEstado === 'todos' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('todos')}
          >
            Todos ({trabajos.length})
          </button>
          <button
            className={`filter-btn ${filtroEstado === 'pendiente' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('pendiente')}
          >
            ⏳ Pendientes ({trabajos.filter(t => t.estadoActual === 'pendiente').length})
          </button>
          <button
            className={`filter-btn ${filtroEstado === 'en_proceso' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('en_proceso')}
          >
            🔧 Trabajando ({trabajos.filter(t => t.estadoActual === 'en_proceso').length})
          </button>
          <button
            className={`filter-btn ${filtroEstado === 'completado' ? 'active' : ''}`}
            onClick={() => setFiltroEstado('completado')}
          >
            ✅ Completados ({trabajos.filter(t => t.estadoActual === 'completado').length})
          </button>
        </div>
      </div>

      {/* Lista de trabajos */}
      <div className="container">
        {trabajosFiltrados.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <p><strong>No hay trabajos {filtroEstado !== 'todos' ? filtroEstado : ''}</strong></p>
            <p>Presiona el botón + para agregar un nuevo trabajo</p>
          </div>
        ) : (
          <div className="trabajos-grid">
            {trabajosFiltrados.map((trabajo) => (
              <div key={trabajo.id} className={`trabajo-card ${trabajo.estadoActual}`}>
                <div className="trabajo-header">
                  <div className="trabajo-info">
                    <h3>{trabajo.cliente.nombre}</h3>
                    <p className="trabajo-cliente">
                      {trabajo.cliente.telefono && `📞 ${trabajo.cliente.telefono}`}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`badge badge-animated ${getEstadoBadgeClass(trabajo.estadoActual)}`}>
                      {trabajo.estadoActual === 'en_proceso' && <span className="pulse-dot"></span>}
                      {getEstadoTexto(trabajo.estadoActual)}
                    </span>
                    {trabajo.estadoActual !== 'completado' && (
                      <button
                        className="btn-icon-small"
                        onClick={() => handleAbrirEditar(trabajo)}
                        title="Editar trabajo"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                </div>

                <p className="trabajo-descripcion">{trabajo.descripcion}</p>

                <div className="trabajo-meta">
                  {trabajo.precioEstimado && (
                    <span>💰 ${trabajo.precioEstimado}</span>
                  )}
                  <span>📅 {new Date(trabajo.fechaCreacion).toLocaleDateString('es-ES')}</span>
                </div>

                {/* Botones de acción */}
                <div className="trabajo-actions">
                  {trabajo.estadoActual === 'pendiente' && (
                    <button
                      className="btn-action btn-outline-primary"
                      onClick={() => handleCambiarEstado(trabajo.id, 'en_proceso')}
                    >
                      🔧 Iniciar
                    </button>
                  )}
                  
                  {trabajo.estadoActual === 'en_proceso' && (
                    <button
                      className="btn-action btn-outline-success animate-pulse-subtle"
                      onClick={() => handleCambiarEstado(trabajo.id, 'completado')}
                    >
                      ✓ Completar
                    </button>
                  )}

                  {trabajo.estadoActual === 'completado' && (
                    <div className="trabajo-completado-text">
                      <span className="checkmark-mini">✓</span> Completado
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Botón flotante agregar trabajo */}
      <button
        className="btn-agregar-trabajo"
        onClick={() => setMostrarModalTrabajo(true)}
        title="Agregar nuevo trabajo"
      >
        +
      </button>

      {/* Modal editar trabajo */}
      {mostrarModalEditar && trabajoEditar && (
        <div className="modal-overlay" onClick={() => setMostrarModalEditar(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Editar Trabajo</h2>
              <button className="btn-close" onClick={() => setMostrarModalEditar(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleGuardarEdicion}>
                <div className="form-group">
                  <label className="form-label">Descripción del trabajo *</label>
                  <textarea
                    className="form-textarea"
                    value={trabajoEditar.descripcion}
                    onChange={(e) => setTrabajoEditar({...trabajoEditar, descripcion: e.target.value})}
                    required
                    rows="3"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Precio estimado</label>
                  <input
                    type="number"
                    className="form-input"
                    value={trabajoEditar.precioEstimado}
                    onChange={(e) => setTrabajoEditar({...trabajoEditar, precioEstimado: e.target.value})}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setMostrarModalEditar(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal agregar trabajo */}
      {mostrarModalTrabajo && (
        <div className="modal-overlay" onClick={() => setMostrarModalTrabajo(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Trabajo</h2>
              <button className="btn-close" onClick={() => setMostrarModalTrabajo(false)}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <form onSubmit={handleCrearTrabajo}>
                {/* Selector de cliente */}
                <div className="form-group">
                  <label className="form-label">Cliente *</label>
                  <div className="cliente-selector">
                    <select
                      className="form-select"
                      value={clienteSeleccionado}
                      onChange={(e) => setClienteSeleccionado(e.target.value)}
                      required
                    >
                      <option value="">Selecciona un cliente...</option>
                      {clientes.map((cliente) => (
                        <option key={cliente.id} value={cliente.id}>
                          {cliente.nombre} {cliente.telefono && `- ${cliente.telefono}`}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn-nuevo-cliente"
                      onClick={() => setMostrarFormCliente(!mostrarFormCliente)}
                    >
                      {mostrarFormCliente ? '−' : '+'} Cliente
                    </button>
                  </div>
                </div>

                {/* Form nuevo cliente */}
                {mostrarFormCliente && (
                  <>
                    <div className="divider"><span>Nuevo Cliente</span></div>
                    <div className="form-group">
                      <label className="form-label">Nombre del cliente</label>
                      <input
                        type="text"
                        className="form-input"
                        value={nuevoCliente.nombre}
                        onChange={(e) => setNuevoCliente({...nuevoCliente, nombre: e.target.value})}
                        placeholder="Nombre completo"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Teléfono</label>
                      <input
                        type="tel"
                        className="form-input"
                        value={nuevoCliente.telefono}
                        onChange={(e) => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
                        placeholder="Ej: 555-1234"
                      />
                    </div>
                    <button
                      type="button"
                      className="btn btn-success"
                      style={{ width: '100%', marginBottom: '1rem' }}
                      onClick={handleCrearCliente}
                      disabled={!nuevoCliente.nombre.trim()}
                    >
                      Guardar Cliente
                    </button>
                    <div className="divider"></div>
                  </>
                )}

                {/* Descripción del trabajo */}
                <div className="form-group">
                  <label className="form-label">¿Qué trabajo llegó? *</label>
                  <textarea
                    className="form-textarea"
                    value={descripcionTrabajo}
                    onChange={(e) => setDescripcionTrabajo(e.target.value)}
                    placeholder="Ej: Lavado completo, Impresión 50 copias..."
                    required
                    rows="3"
                  />
                </div>

                {/* Precio estimado */}
                <div className="form-group">
                  <label className="form-label">Precio estimado (opcional)</label>
                  <input
                    type="number"
                    className="form-input"
                    value={precioEstimado}
                    onChange={(e) => setPrecioEstimado(e.target.value)}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setMostrarModalTrabajo(false)}
                  >
                    Cancelar
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Registrar Trabajo
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTrabajador;
