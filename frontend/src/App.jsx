import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardDueno from './pages/DashboardDueno';
import DashboardTrabajador from './pages/DashboardTrabajador';
import TrabajosNegocio from './pages/TrabajosNegocio';
import NuevoTrabajo from './pages/NuevoTrabajo';
import Clientes from './pages/Clientes';
import GestionUsuarios from './pages/GestionUsuarios';
import Layout from './components/Layout';

// Componente para redirigir al dashboard correcto según el rol
const DashboardRedirect = () => {
  const { user } = useAuth();
  if (user?.rol === 'dueño') {
    return <DashboardDueno />;
  } else if (user?.rol === 'trabajador') {
    return <DashboardTrabajador />;
  }
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Ruta pública */}
          <Route path="/login" element={<Login />} />

          {/* Rutas protegidas */}
          <Route element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            
            {/* Rutas solo para dueño */}
            <Route path="/negocios/:negocioId/trabajos" element={
              <ProtectedRoute requireRole="dueño">
                <TrabajosNegocio />
              </ProtectedRoute>
            } />
            <Route path="/trabajos/nuevo" element={
              <ProtectedRoute requireRole="dueño">
                <NuevoTrabajo />
              </ProtectedRoute>
            } />
            <Route path="/usuarios" element={
              <ProtectedRoute requireRole="dueño">
                <GestionUsuarios />
              </ProtectedRoute>
            } />
            
            {/* Rutas compartidas */}
            <Route path="/clientes" element={<Clientes />} />
          </Route>

          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
