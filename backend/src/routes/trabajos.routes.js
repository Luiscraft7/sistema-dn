import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { 
  getTrabajos, 
  createTrabajo, 
  updateEstadoTrabajo 
} from '../controllers/trabajos.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/trabajos - Listar trabajos (con filtros)
router.get('/', getTrabajos);

// POST /api/trabajos - Crear trabajo
router.post('/', createTrabajo);

// PATCH /api/trabajos/:id/estado - Actualizar estado
router.patch('/:id/estado', updateEstadoTrabajo);

export default router;
