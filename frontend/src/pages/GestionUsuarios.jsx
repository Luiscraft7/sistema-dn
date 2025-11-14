import { useState, useEffect } from 'react';
import { usuariosApi, negociosApi } from '../services/api';
import './GestionUsuarios.css';

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [negocios, setNegocios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEdit, setUsuarioEdit] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    password: '',
    rol: 'trabajador',
    negocioId: '',
    activo: true
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [usuariosData, negociosData] = await Promise.all([
        usuariosApi.getAll(),
        negociosApi.getAll()
      ]);
      setUsuarios(usuariosData);
      setNegocios(negociosData);
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsuarios = async () => {
    try {
      const data = await usuariosApi.getAll();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      };
      
      // Si cambia el rol a dueño, limpiar negocioId
      if (name === 'rol' && value === 'dueño') {
        newData.negocioId = '';
      }
      
      return newData;
    });
  };

  const handleNuevo = () => {
    setUsuarioEdit(null);
    setFormData({
      nombre: '',
      username: '',
      password: '',
      rol: 'trabajador',
      negocioId: '',
      activo: true
    });
    setMostrarFormulario(true);
  };

  const handleEditar = (usuario) => {
    setUsuarioEdit(usuario);
    setFormData({
      nombre: usuario.nombre,
      username: usuario.username,
      password: '',
      rol: usuario.rol,
      negocioId: usuario.negocioId || '',
      activo: usuario.activo
    });
    setMostrarFormulario(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const dataToSubmit = { ...formData };
      
      // Si es dueño, negocioId debe ser null
      if (dataToSubmit.rol === 'dueño') {
        dataToSubmit.negocioId = null;
      } else if (dataToSubmit.negocioId === '') {
        // Si es trabajador y no hay negocioId, es un error
        alert('Los trabajadores deben tener un negocio asignado');
        return;
      } else {
        // Convertir negocioId a número
        dataToSubmit.negocioId = parseInt(dataToSubmit.negocioId);
      }
      
      if (usuarioEdit) {
        // Actualizar
        if (!dataToSubmit.password) {
          delete dataToSubmit.password; // No actualizar password si está vacío
        }
        await usuariosApi.update(usuarioEdit.id, dataToSubmit);
        alert('Usuario actualizado exitosamente');
      } else {
        // Crear
        await usuariosApi.create(dataToSubmit);
        alert('Usuario creado exitosamente');
      }
      
      setMostrarFormulario(false);
      setUsuarioEdit(null);
      loadUsuarios();
    } catch (error) {
      console.error('Error completo:', error);
      alert('Error: ' + error.message);
    }
  };

  const handleCancelar = () => {
    setMostrarFormulario(false);
    setUsuarioEdit(null);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container gestion-usuarios">
      <div className="page-header">
        <h1>Gestión de Usuarios</h1>
        {!mostrarFormulario && (
          <button className="btn btn-primary" onClick={handleNuevo}>
            + Nuevo Usuario
          </button>
        )}
      </div>

      {/* Formulario */}
      {mostrarFormulario && (
        <div className="card form-card">
          <h2 className="form-title">
            {usuarioEdit ? 'Editar Usuario' : 'Crear Nuevo Usuario'}
          </h2>
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="nombre">
                  Nombre completo *
                </label>
                <input
                  id="nombre"
                  name="nombre"
                  type="text"
                  className="form-input"
                  value={formData.nombre}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="username">
                  Usuario (username) *
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  className="form-input"
                  value={formData.username}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="password">
                  Contraseña {usuarioEdit && '(dejar vacío para mantener)'}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  required={!usuarioEdit}
                  placeholder={usuarioEdit ? 'Dejar vacío para no cambiar' : ''}
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="rol">
                  Rol *
                </label>
                <select
                  id="rol"
                  name="rol"
                  className="form-select"
                  value={formData.rol}
                  onChange={handleChange}
                  required
                >
                  <option value="trabajador">Trabajador</option>
                  <option value="dueño">Dueño</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="negocioId">
                  Negocio {formData.rol === 'trabajador' && '*'}
                </label>
                <select
                  id="negocioId"
                  name="negocioId"
                  className="form-select"
                  value={formData.negocioId || ''}
                  onChange={handleChange}
                  required={formData.rol === 'trabajador'}
                  disabled={formData.rol === 'dueño'}
                >
                  <option value="">
                    {formData.rol === 'dueño' ? 'No aplica' : 'Seleccionar negocio'}
                  </option>
                  {negocios.map((negocio) => (
                    <option key={negocio.id} value={negocio.id}>
                      {negocio.nombre}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-checkbox">
                <input
                  type="checkbox"
                  name="activo"
                  checked={formData.activo}
                  onChange={handleChange}
                />
                <span>Usuario activo</span>
              </label>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={handleCancelar}
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                {usuarioEdit ? 'Actualizar' : 'Crear'} Usuario
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de usuarios */}
      <div className="usuarios-grid">
        {usuarios.map((usuario) => (
          <div key={usuario.id} className="usuario-card card">
            <div className="usuario-header">
              <div>
                <h3 className="usuario-nombre">{usuario.nombre}</h3>
                <p className="usuario-username">@{usuario.username}</p>
              </div>
              {!usuario.activo && (
                <span className="badge badge-cancelled">Inactivo</span>
              )}
            </div>

            <div className="usuario-info">
              <div className="info-item">
                <span className="info-label">Rol:</span>
                <span className={`badge ${usuario.rol === 'dueño' ? 'badge-progress' : 'badge-pending'}`}>
                  {usuario.rol}
                </span>
              </div>
              {usuario.negocio && (
                <div className="info-item">
                  <span className="info-label">Negocio:</span>
                  <span className="info-value">{usuario.negocio.nombre}</span>
                </div>
              )}
              <div className="info-item">
                <span className="info-label">Creado:</span>
                <span className="info-value">
                  {new Date(usuario.creadoEn).toLocaleDateString('es-ES')}
                </span>
              </div>
            </div>

            <button
              className="btn btn-small btn-outline"
              onClick={() => handleEditar(usuario)}
            >
              Editar
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GestionUsuarios;
