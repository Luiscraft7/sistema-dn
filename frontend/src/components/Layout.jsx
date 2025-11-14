import { Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import './Layout.css';

const Layout = () => {
  const { user, isDueno } = useAuth();

  // Determinar el negocio actual
  const negocioNombre = user?.negocio?.nombre || 
    (user?.negocioId === 1 ? 'Lavacar' : user?.negocioId === 2 ? 'Impresión' : user?.negocioId === 3 ? 'Cabinas' : null);
  
  const negocioClass = negocioNombre && !isDueno ? `layout-${negocioNombre.toLowerCase()}` : '';

  return (
    <div className={`layout ${negocioClass}`}>
      <Navbar />
      <main className="layout-main">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
