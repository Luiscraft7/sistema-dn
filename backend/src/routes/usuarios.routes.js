import { Router } from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware.js';
import { 
  getUsuarios, 
  createUsuario, 
  updateUsuario 
} from '../controllers/usuarios.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Solo el rol 'dueño' puede gestionar usuarios
router.use(requireRole('dueño'));

// GET /api/usuarios - Listar usuarios
router.get('/', getUsuarios);

// POST /api/usuarios - Crear usuario
router.post('/', createUsuario);

// PATCH /api/usuarios/:id - Actualizar usuario
router.patch('/:id', updateUsuario);

export default router;
