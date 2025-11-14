import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { negociosApi, trabajosApi } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { usePolling } from '../hooks/usePolling';
import './DashboardDueno.css';

const DashboardDueno = () => {
  const { isDueno } = useAuth();
  const [negocios, setNegocios] = useState([]);
  const [trabajosRecientes, setTrabajosRecientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    pendientes: 0,
    enProceso: 0,
    completados: 0
  });

  // Polling cada 15 segundos para actualizar datos automáticamente
  usePolling(() => {
    if (!loading) {
      loadData();
    }
  }, 15000);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [negociosData, trabajosData] = await Promise.all([
        negociosApi.getAll(),
        trabajosApi.getAll()
      ]);

      setNegocios(negociosData);
      setTrabajosRecientes(trabajosData.slice(0, 10));

      // Calcular estadísticas
      const pendientes = trabajosData.filter(t => t.estadoActual === 'pendiente').length;
      const enProceso = trabajosData.filter(t => t.estadoActual === 'en_proceso').length;
      const completados = trabajosData.filter(t => t.estadoActual === 'completado').length;

      setStats({ pendientes, enProceso, completados });
    } catch (error) {
      console.error('Error al cargar datos:', error);
    } finally {
      setLoading(false);
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

  const getProgressPercentage = (estado) => {
    const percentages = {
      pendiente: 33,
      en_proceso: 66,
      completado: 100,
      cancelado: 0
    };
    return percentages[estado] || 0;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="container dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <Link to="/trabajos/nuevo" className="btn btn-primary">
          + Nuevo Trabajo
        </Link>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card card">
          <div className="stat-label">Pendientes</div>
          <div className="stat-value" style={{ color: '#f59e0b' }}>
            {stats.pendientes}
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">En Proceso</div>
          <div className="stat-value" style={{ color: '#3b82f6' }}>
            {stats.enProceso}
          </div>
        </div>
        <div className="stat-card card">
          <div className="stat-label">Completados</div>
          <div className="stat-value" style={{ color: '#10b981' }}>
            {stats.completados}
          </div>
        </div>
      </div>

      {/* Negocios */}
      <section className="dashboard-section">
        <h2 className="section-title">Negocios</h2>
        <div className="negocios-grid">
          {negocios.map((negocio) => {
            const iconConfig = {
              'Lavacar': { icon: '🚗', color: '#3b82f6', emoji: '💧' },
              'Impresión': { icon: '🖨️', color: '#8b5cf6', emoji: '📄' },
              'Cabinas': { icon: '💻', color: '#10b981', emoji: '🌐' }
            };
            const config = iconConfig[negocio.nombre] || { icon: '📋', color: '#6b7280', emoji: '❓' };
            
            return (
              <Link
                key={negocio.id}
                to={`/negocios/${negocio.id}/trabajos`}
                className="negocio-card card"
                style={{ borderTop: `4px solid ${config.color}` }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{config.icon}</div>
                <h3 className="negocio-nombre">{negocio.nombre}</h3>
                <p className="negocio-trabajos">
                  {config.emoji} {negocio._count?.trabajos || 0} trabajos
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Trabajos Recientes */}
      <section className="dashboard-section">
        <h2 className="section-title">Trabajos Recientes</h2>
        <div className="card">
          {trabajosRecientes.length === 0 ? (
            <p className="empty-message">No hay trabajos registrados</p>
          ) : (
            <div className="trabajos-list">
              {trabajosRecientes.map((trabajo) => (
                <div key={trabajo.id} className="trabajo-item">
                  <div className="trabajo-info">
                    <div className="trabajo-negocio">{trabajo.negocio.nombre}</div>
                    <div className="trabajo-cliente">{trabajo.cliente.nombre}</div>
                    <div className="trabajo-descripcion">{trabajo.descripcion}</div>
                    <div className="trabajo-fecha">
                      {new Date(trabajo.fechaCreacion).toLocaleDateString('es-CR', { 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })} • {new Date(trabajo.fechaCreacion).toLocaleTimeString('es-CR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    
                    {/* Barra de progreso */}
                    <div className="trabajo-progress-container">
                      <div className="trabajo-progress-bar">
                        <div 
                          className={`trabajo-progress-fill ${trabajo.estadoActual}`}
                          style={{ width: `${getProgressPercentage(trabajo.estadoActual)}%` }}
                        >
                          <span className="progress-label">{getProgressPercentage(trabajo.estadoActual)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="trabajo-meta">
                    <span className={`badge badge-animated ${getEstadoBadge(trabajo.estadoActual)}`}>
                      {trabajo.estadoActual === 'en_proceso' && <span className="pulse-dot"></span>}
                      {getEstadoTexto(trabajo.estadoActual)}
                      {trabajo.estadoActual === 'completado' && <span className="checkmark-small">✓</span>}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default DashboardDueno;
