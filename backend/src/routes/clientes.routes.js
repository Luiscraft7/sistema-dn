import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { 
  getClientes, 
  createCliente 
} from '../controllers/clientes.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/clientes - Listar clientes
router.get('/', getClientes);

// POST /api/clientes - Crear cliente
router.post('/', createCliente);

export default router;
