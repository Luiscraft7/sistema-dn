const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { getTrabajos, createTrabajo, updateTrabajo, updateEstado } = require('../controllers/trabajos.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getTrabajos);
router.post('/', createTrabajo);
router.put('/:id', updateTrabajo);
router.patch('/:id/estado', updateEstado);

module.exports = router;
