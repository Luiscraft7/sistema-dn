import { useState, useEffect } from 'react';
import { clientesApi, trabajosApi } from '../services/api';
import './Clientes.css';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null);
  const [trabajosCliente, setTrabajosCliente] = useState([]);
  const [loadingTrabajos, setLoadingTrabajos] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono: '',
    notaExtra: ''
  });

  useEffect(() => {
    loadClientes();
  }, [buscar]);

  const loadClientes = async () => {
    try {
      const data = await clientesApi.getAll(buscar);
      setClientes(data);
    } catch (error) {
      console.error('Error al cargar clientes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNuevoCliente(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await clientesApi.create(nuevoCliente);
      setNuevoCliente({ nombre: '', telefono: '', notaExtra: '' });
      setMostrarFormulario(false);
      loadClientes();
      alert('Cliente creado exitosamente');
    } catch (error) {
      alert('Error al crear cliente: ' + error.message);
    }
  };

  const handleVerTrabajos = async (cliente) => {
    setClienteSeleccionado(cliente);
    setLoadingTrabajos(true);
    try {
      const trabajos = await trabajosApi.getAll();
      // Filtrar trabajos del cliente seleccionado
      const trabajosDelCliente = trabajos.filter(t => t.clienteId === cliente.id);
      setTrabajosCliente(trabajosDelCliente);
    } catch (error) {
      console.error('Error al cargar trabajos:', error);
      alert('Error al cargar los trabajos del cliente');
    } finally {
      setLoadingTrabajos(false);
    }
  };

  const cerrarModalTrabajos = () => {
    setClienteSeleccionado(null);
    setTrabajosCliente([]);
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      pendiente: 'badge-pending',
      en_proceso: 'badge-progress',
      completado: 'badge-completed',
      cancelado: 'badge-cancelled'
    };
    return badges[estado] || '';
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
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container clientes">
      <div className="page-header">
        <h1>Clientes</h1>
        <button
          className="btn btn-primary"
          onClick={() => setMostrarFormulario(!mostrarFormulario)}
        >
          {mostrarFormulario ? 'Cancelar' : '+ Nuevo Cliente'}
        </button>
      </div>

      {/* Formulario nuevo cliente */}
      {mostrarFormulario && (
        <div className="card form-card">
          <h2 className="form-title">Crear Nuevo Cliente</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="nombre">
                Nombre *
              </label>
              <input
                id="nombre"
                name="nombre"
                type="text"
                className="form-input"
                value={nuevoCliente.nombre}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="telefono">
                Teléfono
              </label>
              <input
                id="telefono"
                name="telefono"
                type="tel"
                className="form-input"
                value={nuevoCliente.telefono}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="notaExtra">
                Nota extra
              </label>
              <textarea
                id="notaExtra"
                name="notaExtra"
                className="form-textarea"
                value={nuevoCliente.notaExtra}
                onChange={handleChange}
                rows="3"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Guardar Cliente
            </button>
          </form>
        </div>
      )}

      {/* Búsqueda */}
      <div className="card search-card">
        <input
          type="text"
          className="form-input"
          placeholder="Buscar por nombre o teléfono..."
          value={buscar}
          onChange={(e) => setBuscar(e.target.value)}
        />
      </div>

      {/* Lista de clientes */}
      <div className="clientes-grid">
        {clientes.length === 0 ? (
          <div className="card empty-message">
            {buscar ? 'No se encontraron clientes' : 'No hay clientes registrados'}
          </div>
        ) : (
          clientes.map((cliente) => (
            <div key={cliente.id} className="cliente-card card">
              <h3 className="cliente-nombre">{cliente.nombre}</h3>
              
              {cliente.telefono && (
                <a href={`tel:${cliente.telefono}`} className="cliente-telefono">
                  📞 {cliente.telefono}
                </a>
              )}
              
              {cliente.notaExtra && (
                <p className="cliente-nota">{cliente.notaExtra}</p>
              )}
              
              <div className="cliente-meta">
                <button
                  className="cliente-trabajos-btn"
                  onClick={() => handleVerTrabajos(cliente)}
                >
                  {cliente._count?.trabajos || 0} trabajo(s)
                </button>
                <span className="cliente-fecha">
                  Desde {new Date(cliente.creadoEn).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de trabajos del cliente */}
      {clienteSeleccionado && (
        <div className="modal-overlay" onClick={cerrarModalTrabajos}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Trabajos de {clienteSeleccionado.nombre}</h2>
              <button className="modal-close" onClick={cerrarModalTrabajos}>
                ✕
              </button>
            </div>

            <div className="modal-body">
              {loadingTrabajos ? (
                <div className="loading">Cargando trabajos...</div>
              ) : trabajosCliente.length === 0 ? (
                <p className="empty-message">Este cliente no tiene trabajos registrados</p>
              ) : (
                <div className="trabajos-cliente-list">
                  {trabajosCliente.map((trabajo) => (
                    <div key={trabajo.id} className="trabajo-cliente-item">
                      <div className="trabajo-header">
                        <span className="trabajo-negocio-badge">
                          {trabajo.negocio.nombre}
                        </span>
                        <span className={`badge ${getEstadoBadge(trabajo.estadoActual)}`}>
                          {getEstadoTexto(trabajo.estadoActual)}
                        </span>
                      </div>
                      
                      <p className="trabajo-descripcion">{trabajo.descripcion}</p>
                      
                      <div className="trabajo-detalles">
                        <span className="trabajo-precio">
                          ₡{trabajo.precioEstimado ? trabajo.precioEstimado.toLocaleString('es-CR') : '0'}
                        </span>
                        <span className="trabajo-fecha">
                          {new Date(trabajo.fechaCreacion).toLocaleDateString('es-CR', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric' 
                          })} • {new Date(trabajo.fechaCreacion).toLocaleTimeString('es-CR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Clientes;
