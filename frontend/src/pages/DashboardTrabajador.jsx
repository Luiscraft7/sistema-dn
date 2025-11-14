import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { trabajosApi } from '../services/api';
import usePolling from '../hooks/usePolling';
import './DashboardTrabajador.css';

const DashboardTrabajador = () => {
  const { user } = useAuth();
  const [trabajos, setTrabajos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [mostrarModal, setMostrarModal] = useState(false);
  const [trabajoSeleccionado, setTrabajoSeleccionado] = useState(null);
  const [nota, setNota] = useState('');

  const loadTrabajos = async () => {
    if (!user?.negocioId) return;
    
    try {
      setActualizando(true);
      const data = await trabajosApi.getAll({ negocioId: user.negocioId });
      setTrabajos(data);
    } catch (error) {
      console.error('Error al cargar trabajos:', error);
    } finally {
      setLoading(false);
      setActualizando(false);
    }
  };

  useEffect(() => {
    loadTrabajos();
  }, [user]);

  // Polling cada 10 segundos
  usePolling(() => {
    if (!loading) loadTrabajos();
  }, 10000);

  const handleCambiarEstado = (trabajo, nuevoEstado) => {
    setTrabajoSeleccionado({ ...trabajo, nuevoEstado });
    setNota('');
    setMostrarModal(true);
  };

  const confirmarCambioEstado = async () => {
    try {
      await trabajosApi.updateEstado(trabajoSeleccionado.id, {
        estado: trabajoSeleccionado.nuevoEstado,
        nota: nota.trim() || undefined
      });
      setMostrarModal(false);
      setTrabajoSeleccionado(null);
      setNota('');
      loadTrabajos();
    } catch (error) {
      alert('Error al actualizar estado: ' + error.message);
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
        <div className="loading">Cargando trabajos...</div>
      </div>
    );
  }

  if (!user?.negocioId) {
    return (
      <div className="container">
        <div className="card">
          <p>No tienes un negocio asignado. Contacta al administrador.</p>
        </div>
      </div>
    );
  }

  const trabajosPendientes = trabajos.filter(t => t.estadoActual === 'pendiente');
  const trabajosEnProceso = trabajos.filter(t => t.estadoActual === 'en_proceso');
  const trabajosCompletados = trabajos.filter(t => t.estadoActual === 'completado');

  return (
    <div className="container dashboard-trabajador">
      <div className="page-header">
        <div>
          <h1>Mi Espacio de Trabajo</h1>
          <p className="negocio-nombre">
            📍 {user.negocio?.nombre || 'Negocio no especificado'}
          </p>
        </div>
        {actualizando && <span className="actualizando">↻ Actualizando...</span>}
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-icon pendiente">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{trabajosPendientes.length}</div>
            <div className="stat-label">Pendientes</div>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon proceso">🔧</div>
          <div className="stat-content">
            <div className="stat-value">{trabajosEnProceso.length}</div>
            <div className="stat-label">En Proceso</div>
          </div>
        </div>

        <div className="stat-card card">
          <div className="stat-icon completado">✓</div>
          <div className="stat-content">
            <div className="stat-value">{trabajosCompletados.length}</div>
            <div className="stat-label">Completados Hoy</div>
          </div>
        </div>
      </div>

      {/* Trabajos */}
      <div className="trabajos-section">
        <h2>Trabajos Activos</h2>
        
        {trabajos.length === 0 ? (
          <div className="card">
            <p>No hay trabajos en este momento.</p>
          </div>
        ) : (
          <div className="trabajos-list">
            {trabajos.map((trabajo) => (
              <div key={trabajo.id} className="trabajo-card card">
                <div className="trabajo-header">
                  <div>
                    <h3 className="trabajo-cliente">{trabajo.cliente.nombre}</h3>
                    <p className="trabajo-descripcion">{trabajo.descripcion}</p>
                  </div>
                  <span className={`badge ${getEstadoBadgeClass(trabajo.estadoActual)}`}>
                    {getEstadoTexto(trabajo.estadoActual)}
                  </span>
                </div>

                <div className="trabajo-info">
                  {trabajo.precioEstimado && (
                    <div className="info-item">
                      <span className="info-label">Precio:</span>
                      <span className="info-value">${trabajo.precioEstimado}</span>
                    </div>
                  )}
                  {trabajo.cliente.telefono && (
                    <div className="info-item">
                      <span className="info-label">Teléfono:</span>
                      <span className="info-value">{trabajo.cliente.telefono}</span>
                    </div>
                  )}
                  <div className="info-item">
                    <span className="info-label">Creado:</span>
                    <span className="info-value">
                      {new Date(trabajo.fechaCreacion).toLocaleString('es-ES')}
                    </span>
                  </div>
                </div>

                {/* Historial */}
                {trabajo.historialEstados && trabajo.historialEstados.length > 0 && (
                  <div className="historial-section">
                    <h4>Historial:</h4>
                    <div className="historial-list">
                      {trabajo.historialEstados.map((hist) => (
                        <div key={hist.id} className="historial-item">
                          <span className={`badge ${getEstadoBadgeClass(hist.estado)}`}>
                            {getEstadoTexto(hist.estado)}
                          </span>
                          <span className="historial-usuario">{hist.usuario.nombre}</span>
                          <span className="historial-fecha">
                            {new Date(hist.fechaHora).toLocaleString('es-ES')}
                          </span>
                          {hist.nota && (
                            <div className="historial-nota">💬 {hist.nota}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Acciones */}
                <div className="trabajo-acciones">
                  {trabajo.estadoActual === 'pendiente' && (
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => handleCambiarEstado(trabajo, 'en_proceso')}
                    >
                      Iniciar Trabajo
                    </button>
                  )}
                  {trabajo.estadoActual === 'en_proceso' && (
                    <>
                      <button
                        className="btn btn-small btn-success"
                        onClick={() => handleCambiarEstado(trabajo, 'completado')}
                      >
                        ✓ Completar
                      </button>
                      <button
                        className="btn btn-small btn-outline"
                        onClick={() => handleCambiarEstado(trabajo, 'pendiente')}
                      >
                        ← Volver a Pendiente
                      </button>
                    </>
                  )}
                  {trabajo.estadoActual === 'completado' && (
                    <span className="trabajo-finalizado">✓ Trabajo completado</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal para agregar nota */}
      {mostrarModal && (
        <div className="modal-overlay" onClick={() => setMostrarModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Cambiar Estado</h3>
            <p>
              Cambiar a: <strong>{getEstadoTexto(trabajoSeleccionado.nuevoEstado)}</strong>
            </p>
            
            <div className="form-group">
              <label className="form-label">
                Agregar nota o comentario (opcional):
              </label>
              <textarea
                className="form-textarea"
                value={nota}
                onChange={(e) => setNota(e.target.value)}
                placeholder="Ej: Cliente satisfecho, se entregó antes de tiempo..."
                rows="3"
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => setMostrarModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-primary"
                onClick={confirmarCambioEstado}
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardTrabajador;
