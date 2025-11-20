import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { 
  getClientes, 
  createCliente,
  getClientesCabinas,
  deleteCliente
} from '../controllers/clientes.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/clientes - Listar clientes
router.get('/', getClientes);

// GET /api/clientes/cabinas - Listar solo clientes de cabinas
router.get('/cabinas', getClientesCabinas);

// POST /api/clientes - Crear cliente
router.post('/', createCliente);

// DELETE /api/clientes/:id - Eliminar cliente
router.delete('/:id', deleteCliente);

export default router;
