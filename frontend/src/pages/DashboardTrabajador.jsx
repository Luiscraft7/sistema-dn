import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { trabajosApi, clientesApi } from '../services/api';
import usePolling from '../hooks/usePolling';
import './DashboardTrabajador.css';

// Trabajos predeterminados por negocio (precios en colones ₡)
const TRABAJOS_PREDETERMINADOS = {
  'Lavacar': [
    { nombre: 'Lavado de carro completo', precio: 5000 },
    { nombre: 'Lavado de moto', precio: 2500 },
    { nombre: 'Lavado express', precio: 3000 },
    { nombre: 'Lavado + encerado', precio: 8000 },
    { nombre: 'Limpieza interior', precio: 4000 },
    { nombre: 'Pulido de carrocería', precio: 10000 }
  ],
  'Impresión': [
    { nombre: 'Impresión B/N (por página)', precio: 50 },
    { nombre: 'Impresión color (por página)', precio: 200 },
    { nombre: 'Copias simples', precio: 25 },
    { nombre: 'Impresión de fotos', precio: 500 },
    { nombre: 'Encuadernado', precio: 1500 },
    { nombre: 'Laminado A4', precio: 300 }
  ],
  'Cabinas': [
    { nombre: 'Hora de internet', precio: 500 },
    { nombre: 'Media hora internet', precio: 300 },
    { nombre: 'Impresión documento', precio: 100 },
    { nombre: 'Escaneo', precio: 200 },
    { nombre: 'Quemado de CD/DVD', precio: 1000 },
    { nombre: 'Uso de cámara web', precio: 800 }
  ]
};

const DashboardTrabajador = () => {
  const { user } = useAuth();

  // Nombre de negocio "seguro" usando negocioId como respaldo
  const negocioNombre =
    user?.negocio?.nombre ||
    (user?.negocioId === 1 ? 'Lavacar'
      : user?.negocioId === 2 ? 'Impresión'
      : user?.negocioId === 3 ? 'Cabinas'
      : null);
  const [trabajos, setTrabajos] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [filtroFecha, setFiltroFecha] = useState('hoy');
  
  // Estados del modal - con key basada en userId para forzar reset
  const [mostrarModalTrabajo, setMostrarModalTrabajo] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false);
  const [modoPersonalizado, setModoPersonalizado] = useState(false);
  
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

  // Resetear todo cuando cambia el usuario
  useEffect(() => {
    if (user?.id) {
      // Cerrar todos los modales
      setMostrarModalTrabajo(false);
      setMostrarModalEditar(false);
      setMostrarFormCliente(false);
      
      // Limpiar todos los formularios
      setClienteSeleccionado('');
      setDescripcionTrabajo('');
      setPrecioEstimado('');
      setModoPersonalizado(false);
      setTrabajoEditar(null);
      setNuevoCliente({ nombre: '', telefono: '' });
      
      // Resetear filtros
      setFiltroEstado('todos');
      setFiltroFecha('hoy');
      
      // Cargar datos del nuevo usuario
      setLoading(true);
      loadData();
    }
  }, [user?.id]);

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

  const handleSeleccionarPredeterminado = (trabajo) => {
    setDescripcionTrabajo(trabajo.nombre);
    setPrecioEstimado(trabajo.precio.toString());
    setModoPersonalizado(false);
  };

  const handleAbrirModalTrabajo = () => {
    // No abrir hasta tener claro el negocio del usuario
    if (!negocioNombre) {
      alert('Espera un momento mientras se carga tu negocio y vuelve a intentarlo.');
      return;
    }

    // Resetear estados antes de abrir el modal
    setClienteSeleccionado('');
    setDescripcionTrabajo('');
    setPrecioEstimado('');
    setMostrarFormCliente(false);

    // Determinar si hay trabajos predeterminados para este negocio
    const predeterminados = TRABAJOS_PREDETERMINADOS[negocioNombre];
    const tienePredeterminados = Array.isArray(predeterminados) && predeterminados.length > 0;

    // Si no hay predeterminados, entrar directo a modo personalizado
    setModoPersonalizado(!tienePredeterminados);

    setMostrarModalTrabajo(true);
  };

  const handleCerrarModalTrabajo = () => {
    setMostrarModalTrabajo(false);
    setClienteSeleccionado('');
    setDescripcionTrabajo('');
    setPrecioEstimado('');
    setModoPersonalizado(false);
    setMostrarFormCliente(false);
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
      
      // Cerrar modal y resetear
      handleCerrarModalTrabajo();
      
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

  // Filtrar trabajos por fecha
  const filtrarPorFecha = (trabajos) => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const mañana = new Date(hoy);
    mañana.setDate(mañana.getDate() + 1);
    
    return trabajos.filter(trabajo => {
      const fechaTrabajo = new Date(trabajo.fechaCreacion);
      fechaTrabajo.setHours(0, 0, 0, 0);
      
      if (filtroFecha === 'hoy') {
        return fechaTrabajo.getTime() === hoy.getTime();
      } else if (filtroFecha === 'semana') {
        const hace7Dias = new Date(hoy);
        hace7Dias.setDate(hace7Dias.getDate() - 7);
        return fechaTrabajo >= hace7Dias;
      } else if (filtroFecha === 'mes') {
        const hace30Dias = new Date(hoy);
        hace30Dias.setDate(hace30Dias.getDate() - 30);
        return fechaTrabajo >= hace30Dias;
      }
      return true; // 'todos'
    });
  };

  // Filtrar trabajos por estado y fecha
  let trabajosFiltrados = trabajos;
  
  // Aplicar filtro de fecha
  trabajosFiltrados = filtrarPorFecha(trabajosFiltrados);
  
  // Aplicar filtro de estado
  if (filtroEstado !== 'todos') {
    trabajosFiltrados = trabajosFiltrados.filter(t => t.estadoActual === filtroEstado);
  }

  const trabajosActivos = trabajos.filter(t => 
    t.estadoActual === 'pendiente' || t.estadoActual === 'en_proceso'
  );

  return (
    <div className="dashboard-trabajador">
      {/* Header */}
      <div className="container">
        <h1>👋 Hola, {user.nombre}</h1>
        <span className="negocio-badge">{negocioNombre || 'Sin negocio'}</span>
      </div>

      {/* Filtros */}
      <div className="container">
        <div className="filtros-section">
          <div className="filtro-grupo">
            <label className="filtro-label">Estado:</label>
            <div className="estado-filters">
              <button
                className={`filter-btn ${filtroEstado === 'todos' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('todos')}
              >
                Todos
              </button>
              <button
                className={`filter-btn ${filtroEstado === 'pendiente' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('pendiente')}
              >
                ⏳ Pendientes
              </button>
              <button
                className={`filter-btn ${filtroEstado === 'en_proceso' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('en_proceso')}
              >
                🔧 Trabajando
              </button>
              <button
                className={`filter-btn ${filtroEstado === 'completado' ? 'active' : ''}`}
                onClick={() => setFiltroEstado('completado')}
              >
                ✅ Completados
              </button>
            </div>
          </div>

          <div className="filtro-grupo">
            <label className="filtro-label">Fecha:</label>
            <div className="estado-filters">
              <button
                className={`filter-btn ${filtroFecha === 'hoy' ? 'active' : ''}`}
                onClick={() => setFiltroFecha('hoy')}
              >
                📅 Hoy
              </button>
              <button
                className={`filter-btn ${filtroFecha === 'semana' ? 'active' : ''}`}
                onClick={() => setFiltroFecha('semana')}
              >
                📆 Esta semana
              </button>
              <button
                className={`filter-btn ${filtroFecha === 'mes' ? 'active' : ''}`}
                onClick={() => setFiltroFecha('mes')}
              >
                📊 Este mes
              </button>
              <button
                className={`filter-btn ${filtroFecha === 'todos' ? 'active' : ''}`}
                onClick={() => setFiltroFecha('todos')}
              >
                🗂️ Historial
              </button>
            </div>
          </div>
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
                    <span>💰 ₡{trabajo.precioEstimado.toLocaleString('es-CR')}</span>
                  )}
                  <span>📅 {new Date(trabajo.fechaCreacion).toLocaleDateString('es-CR')}</span>
                  <span>🕐 {new Date(trabajo.fechaCreacion).toLocaleTimeString('es-CR', { hour: '2-digit', minute: '2-digit' })}</span>
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
        onClick={handleAbrirModalTrabajo}
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
                  <label className="form-label">Precio (₡ Colones)</label>
                  <div className="input-with-prefix">
                    <span className="input-prefix">₡</span>
                    <input
                      type="number"
                      className="form-input with-prefix"
                      value={trabajoEditar.precioEstimado}
                      onChange={(e) => setTrabajoEditar({...trabajoEditar, precioEstimado: e.target.value})}
                      placeholder="0"
                      step="50"
                      min="0"
                    />
                  </div>
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
        <div className="modal-overlay" onClick={handleCerrarModalTrabajo} key={`modal-${user?.id}`}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Nuevo Trabajo</h2>
              <button className="btn-close" onClick={handleCerrarModalTrabajo}>
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

                {/* Opciones predeterminadas */}
                {!modoPersonalizado &&
                 !descripcionTrabajo &&
                 negocioNombre &&
                 TRABAJOS_PREDETERMINADOS[negocioNombre] && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Trabajos frecuentes:</label>
                      <div className="trabajos-predeterminados">
                        {TRABAJOS_PREDETERMINADOS[negocioNombre].map((trabajo, index) => (
                          <button
                            key={index}
                            type="button"
                            className={`btn-predeterminado ${descripcionTrabajo === trabajo.nombre ? 'activo' : ''}`}
                            onClick={() => handleSeleccionarPredeterminado(trabajo)}
                          >
                            <span className="trabajo-nombre">{trabajo.nombre}</span>
                            <span className="trabajo-precio">₡{trabajo.precio.toLocaleString('es-CR')}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <button
                      type="button"
                      className="btn-personalizado"
                      onClick={() => setModoPersonalizado(true)}
                    >
                      ✏️ Escribir trabajo personalizado
                    </button>

                    <div className="divider"></div>
                  </>
                )}

                {/* Descripción del trabajo (modo personalizado o con valor) */}
                {(modoPersonalizado || descripcionTrabajo) && (
                  <>
                    {modoPersonalizado && (
                      <button
                        type="button"
                        className="btn-volver"
                        onClick={() => {
                          setModoPersonalizado(false);
                          setDescripcionTrabajo('');
                          setPrecioEstimado('');
                        }}
                      >
                        ← Volver a opciones rápidas
                      </button>
                    )}
                    
                    <div className="form-group">
                      <label className="form-label">Descripción del trabajo *</label>
                      <textarea
                        className="form-textarea"
                        value={descripcionTrabajo}
                        onChange={(e) => setDescripcionTrabajo(e.target.value)}
                        placeholder="Describe el trabajo..."
                        required
                        rows="3"
                      />
                    </div>

                    {/* Precio estimado */}
                    <div className="form-group">
                      <label className="form-label">Precio (₡ Colones)</label>
                      <div className="input-with-prefix">
                        <span className="input-prefix">₡</span>
                        <input
                          type="number"
                          className="form-input with-prefix"
                          value={precioEstimado}
                          onChange={(e) => setPrecioEstimado(e.target.value)}
                          placeholder="0"
                          step="50"
                          min="0"
                        />
                      </div>
                    </div>
                  </>
                )}

                {descripcionTrabajo && (
                  <div className="modal-footer">
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCerrarModalTrabajo}
                    >
                      Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary">
                      Registrar Trabajo
                    </button>
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTrabajador;
