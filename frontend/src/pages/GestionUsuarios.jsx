import { useState, useEffect } from 'react';
import { usuariosApi } from '../services/api';
import './GestionUsuarios.css';

const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEdit, setUsuarioEdit] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    username: '',
    password: '',
    rol: 'trabajador',
    activo: true
  });

  useEffect(() => {
    loadUsuarios();
  }, []);

  const loadUsuarios = async () => {
    try {
      const data = await usuariosApi.getAll();
      setUsuarios(data);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleNuevo = () => {
    setUsuarioEdit(null);
    setFormData({
      nombre: '',
      username: '',
      password: '',
      rol: 'trabajador',
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
      activo: usuario.activo
    });
    setMostrarFormulario(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (usuarioEdit) {
        // Actualizar
        const dataToUpdate = { ...formData };
        if (!dataToUpdate.password) {
          delete dataToUpdate.password; // No actualizar password si está vacío
        }
        await usuariosApi.update(usuarioEdit.id, dataToUpdate);
        alert('Usuario actualizado exitosamente');
      } else {
        // Crear
        await usuariosApi.create(formData);
        alert('Usuario creado exitosamente');
      }
      
      setMostrarFormulario(false);
      setUsuarioEdit(null);
      loadUsuarios();
    } catch (error) {
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
