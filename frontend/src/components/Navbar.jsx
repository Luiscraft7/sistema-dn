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

  return (
    <nav className="navbar">
      <div className="container navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          Sistema DN
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
