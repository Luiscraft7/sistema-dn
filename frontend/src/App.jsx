import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import DashboardDueno from './pages/DashboardDueno';
import TrabajosNegocio from './pages/TrabajosNegocio';
import NuevoTrabajo from './pages/NuevoTrabajo';
import Clientes from './pages/Clientes';
import GestionUsuarios from './pages/GestionUsuarios';
import Layout from './components/Layout';

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
            <Route path="/dashboard" element={<DashboardDueno />} />
            <Route path="/negocios/:negocioId/trabajos" element={<TrabajosNegocio />} />
            <Route path="/trabajos/nuevo" element={<NuevoTrabajo />} />
            <Route path="/clientes" element={<Clientes />} />
            <Route path="/usuarios" element={
              <ProtectedRoute requireRole="dueño">
                <GestionUsuarios />
              </ProtectedRoute>
            } />
          </Route>

          {/* Ruta por defecto */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
