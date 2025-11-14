import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isDueno } = useAuth();
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
            Dashboard
          </Link>
          <Link to="/clientes" className="navbar-link">
            Clientes
          </Link>
          {isDueno && (
            <Link to="/usuarios" className="navbar-link">
              Usuarios
            </Link>
          )}
        </div>

        <div className="navbar-user">
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
