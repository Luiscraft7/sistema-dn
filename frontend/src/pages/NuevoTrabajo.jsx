import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { negociosApi, clientesApi, trabajosApi } from '../services/api';
import './NuevoTrabajo.css';

const NuevoTrabajo = () => {
  const navigate = useNavigate();
  const [negocios, setNegocios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mostrarNuevoCliente, setMostrarNuevoCliente] = useState(false);

  const [formData, setFormData] = useState({
    negocioId: '',
    clienteId: '',
    descripcion: '',
    precioEstimado: ''
  });

  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: '',
    telefono: '',
    notaExtra: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [negociosData, clientesData] = await Promise.all([
        negociosApi.getAll(),
        clientesApi.getAll()
      ]);
      setNegocios(negociosData);
      setClientes(clientesData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleClienteChange = (e) => {
    const { name, value } = e.target;
    setNuevoCliente(prev => ({ ...prev, [name]: value }));
  };

  const handleCrearCliente = async (e) => {
    e.preventDefault();
    try {
      const cliente = await clientesApi.create(nuevoCliente);
      setClientes(prev => [cliente, ...prev]);
      setFormData(prev => ({ ...prev, clienteId: cliente.id.toString() }));
      setMostrarNuevoCliente(false);
      setNuevoCliente({ nombre: '', telefono: '', notaExtra: '' });
      alert('Cliente creado exitosamente');
    } catch (error) {
      alert('Error al crear cliente: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await trabajosApi.create({
        negocioId: parseInt(formData.negocioId),
        clienteId: parseInt(formData.clienteId),
        descripcion: formData.descripcion,
        precioEstimado: formData.precioEstimado ? parseFloat(formData.precioEstimado) : null
      });

      alert('Trabajo creado exitosamente');
      navigate('/dashboard');
    } catch (error) {
      alert('Error al crear trabajo: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container nuevo-trabajo">
      <div className="page-header">
        <div>
          <button onClick={() => navigate(-1)} className="back-link">
            ← Volver
          </button>
          <h1>Nuevo Trabajo</h1>
        </div>
      </div>

      <div className="form-container">
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="negocioId">
                Negocio *
              </label>
              <select
                id="negocioId"
                name="negocioId"
                className="form-select"
                value={formData.negocioId}
                onChange={handleChange}
                required
              >
                <option value="">Seleccionar negocio</option>
                {negocios.map((negocio) => (
                  <option key={negocio.id} value={negocio.id}>
                    {negocio.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <div className="form-label-with-action">
                <label className="form-label" htmlFor="clienteId">
                  Cliente *
                </label>
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => setMostrarNuevoCliente(!mostrarNuevoCliente)}
                >
                  {mostrarNuevoCliente ? 'Seleccionar existente' : '+ Crear nuevo cliente'}
                </button>
              </div>

              {!mostrarNuevoCliente ? (
                <select
                  id="clienteId"
                  name="clienteId"
                  className="form-select"
                  value={formData.clienteId}
                  onChange={handleChange}
                  required
                >
                  <option value="">Seleccionar cliente</option>
                  {clientes.map((cliente) => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.telefono && `- ${cliente.telefono}`}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="nuevo-cliente-form">
                  <div className="form-group">
                    <input
                      type="text"
                      name="nombre"
                      className="form-input"
                      placeholder="Nombre del cliente"
                      value={nuevoCliente.nombre}
                      onChange={handleClienteChange}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="tel"
                      name="telefono"
                      className="form-input"
                      placeholder="Teléfono (opcional)"
                      value={nuevoCliente.telefono}
                      onChange={handleClienteChange}
                    />
                  </div>
                  <div className="form-group">
                    <input
                      type="text"
                      name="notaExtra"
                      className="form-input"
                      placeholder="Nota extra (opcional)"
                      value={nuevoCliente.notaExtra}
                      onChange={handleClienteChange}
                    />
                  </div>
                  <button
                    type="button"
                    className="btn btn-secondary btn-small"
                    onClick={handleCrearCliente}
                    disabled={!nuevoCliente.nombre.trim()}
                  >
                    Guardar Cliente
                  </button>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="descripcion">
                Descripción del trabajo *
              </label>
              <textarea
                id="descripcion"
                name="descripcion"
                className="form-textarea"
                value={formData.descripcion}
                onChange={handleChange}
                required
                rows="4"
                placeholder="Describe el trabajo a realizar..."
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="precioEstimado">
                Precio estimado (opcional)
              </label>
              <input
                id="precioEstimado"
                name="precioEstimado"
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                value={formData.precioEstimado}
                onChange={handleChange}
                placeholder="0.00"
              />
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => navigate(-1)}
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Trabajo'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NuevoTrabajo;
