import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.middleware.js';
import { getNegocios } from '../controllers/negocios.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// GET /api/negocios - Listar todos los negocios
router.get('/', getNegocios);

export default router;
