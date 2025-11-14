import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { trabajosApi, negociosApi } from '../services/api';
import { usePolling } from '../hooks/usePolling';
import './TrabajosNegocio.css';

const TrabajosNegocio = () => {
  const { negocioId } = useParams();
  const [negocio, setNegocio] = useState(null);
  const [trabajos, setTrabajos] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [loading, setLoading] = useState(true);

  // Polling cada 10 segundos para actualizar trabajos en tiempo casi real
  usePolling(() => {
    if (!loading) {
      loadData();
    }
  }, 10000);

  useEffect(() => {
    loadData();
  }, [negocioId, filtroEstado]);

  const loadData = async () => {
    try {
      const [negociosData, trabajosData] = await Promise.all([
        negociosApi.getAll(),
        trabajosApi.getAll({ negocioId, estado: filtroEstado || undefined })
      ]);

      const negocioActual = negociosData.find(n => n.id === parseInt(negocioId));
      setNegocio(negocioActual);
      setTrabajos(trabajosData);
    } catch (error) {
      console.error('Error al cargar trabajos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCambiarEstado = async (trabajoId, nuevoEstado) => {
    try {
      await trabajosApi.updateEstado(trabajoId, nuevoEstado);
      loadData(); // Recargar datos
    } catch (error) {
      alert('Error al actualizar estado: ' + error.message);
    }
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
    <div className="container trabajos-negocio">
      <div className="page-header">
        <div>
          <Link to="/dashboard" className="back-link">← Volver</Link>
          <h1>{negocio?.nombre || 'Negocio'}</h1>
        </div>
        <Link to="/trabajos/nuevo" className="btn btn-primary">
          + Nuevo Trabajo
        </Link>
      </div>

      {/* Filtros */}
      <div className="card filters">
        <label className="form-label">Filtrar por estado:</label>
        <div className="filter-buttons">
          <button
            className={`btn btn-small ${filtroEstado === '' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFiltroEstado('')}
          >
            Todos
          </button>
          <button
            className={`btn btn-small ${filtroEstado === 'pendiente' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFiltroEstado('pendiente')}
          >
            Pendientes
          </button>
          <button
            className={`btn btn-small ${filtroEstado === 'en_proceso' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFiltroEstado('en_proceso')}
          >
            En Proceso
          </button>
          <button
            className={`btn btn-small ${filtroEstado === 'completado' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFiltroEstado('completado')}
          >
            Completados
          </button>
        </div>
      </div>

      {/* Lista de trabajos */}
      <div className="trabajos-container">
        {trabajos.length === 0 ? (
          <div className="card empty-message">
            No hay trabajos {filtroEstado && `con estado "${getEstadoTexto(filtroEstado)}"`}
          </div>
        ) : (
          trabajos.map((trabajo) => (
            <div key={trabajo.id} className="trabajo-card card">
              <div className="trabajo-header">
                <div>
                  <h3 className="trabajo-cliente">{trabajo.cliente.nombre}</h3>
                  {trabajo.cliente.telefono && (
                    <a href={`tel:${trabajo.cliente.telefono}`} className="trabajo-telefono">
                      {trabajo.cliente.telefono}
                    </a>
                  )}
                </div>
                <span className={`badge ${getEstadoBadge(trabajo.estadoActual)}`}>
                  {getEstadoTexto(trabajo.estadoActual)}
                </span>
              </div>

              <div className="trabajo-body">
                <p className="trabajo-descripcion">{trabajo.descripcion}</p>
                {trabajo.precioEstimado && (
                  <p className="trabajo-precio">
                    Precio estimado: ${trabajo.precioEstimado.toFixed(2)}
                  </p>
                )}
                <p className="trabajo-fecha">
                  Creado: {new Date(trabajo.fechaCreacion).toLocaleDateString('es-ES')}
                </p>
              </div>

              {/* Acciones */}
              {trabajo.estadoActual !== 'completado' && trabajo.estadoActual !== 'cancelado' && (
                <div className="trabajo-actions">
                  {trabajo.estadoActual === 'pendiente' && (
                    <button
                      className="btn btn-small btn-primary"
                      onClick={() => handleCambiarEstado(trabajo.id, 'en_proceso')}
                    >
                      Iniciar
                    </button>
                  )}
                  {trabajo.estadoActual === 'en_proceso' && (
                    <button
                      className="btn btn-small btn-success"
                      onClick={() => handleCambiarEstado(trabajo.id, 'completado')}
                    >
                      Completar
                    </button>
                  )}
                  <button
                    className="btn btn-small btn-danger"
                    onClick={() => handleCambiarEstado(trabajo.id, 'cancelado')}
                  >
                    Cancelar
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TrabajosNegocio;
