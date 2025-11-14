import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isDueno } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Configuración de iconos y colores por negocio
  const negocioConfig = {
    'Lavacar': { icon: '🚗', color: '#3b82f6', emoji: '💧' },
    'Impresión': { icon: '🖨️', color: '#8b5cf6', emoji: '📄' },
    'Cabinas': { icon: '💻', color: '#10b981', emoji: '🌐' }
  };

  const negocioNombre = user?.negocio?.nombre || 
    (user?.negocioId === 1 ? 'Lavacar' : user?.negocioId === 2 ? 'Impresión' : user?.negocioId === 3 ? 'Cabinas' : null);
  
  const config = negocioNombre ? negocioConfig[negocioNombre] : null;

  return (
    <nav className={`navbar ${negocioNombre ? `navbar-${negocioNombre.toLowerCase()}` : ''}`}>
      <div className="container navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          {config && <span className="navbar-icon">{config.icon}</span>}
          <span>Sistema DN</span>
          {!isDueno && config && (
            <span className="navbar-negocio-badge" style={{ backgroundColor: config.color }}>
              {config.emoji} {negocioNombre}
            </span>
          )}
        </Link>

        <div className="navbar-menu">
          <Link to="/dashboard" className="navbar-link">
            {isDueno ? 'Dashboard' : 'Mi Trabajo'}
          </Link>
          {isDueno && (
            <>
              <Link to="/clientes" className="navbar-link">
                Clientes
              </Link>
              <Link to="/usuarios" className="navbar-link">
                Usuarios
              </Link>
            </>
          )}
        </div>

        <div className="navbar-user">
          <button 
            onClick={toggleTheme} 
            className="btn btn-small btn-outline"
            title={theme === 'light' ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
          <span className="navbar-username">{user?.nombre}</span>
          <button onClick={handleLogout} className="btn btn-small btn-outline">
            Salir
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
