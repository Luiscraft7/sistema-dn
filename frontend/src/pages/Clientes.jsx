import { useState, useEffect } from 'react';
import { clientesApi } from '../services/api';
import './Clientes.css';

const Clientes = () => {
  const [clientes, setClientes] = useState([]);
  const [buscar, setBuscar] = useState('');
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
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
                <span className="cliente-trabajos">
                  {cliente._count?.trabajos || 0} trabajo(s)
                </span>
                <span className="cliente-fecha">
                  Desde {new Date(cliente.creadoEn).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Clientes;
