const express = require('express');
const { authMiddleware, requireRole } = require('../middleware/auth.middleware');
const { getUsuarios, createUsuario, updateUsuario } = require('../controllers/usuarios.controller');

const router = express.Router();

router.use(authMiddleware);
router.use(requireRole('dueño'));

router.get('/', getUsuarios);
router.post('/', createUsuario);
router.patch('/:id', updateUsuario);

module.exports = router;
