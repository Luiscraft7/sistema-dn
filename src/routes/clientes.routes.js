const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { getClientes, getClientesCabinas, createCliente, deleteCliente } = require('../controllers/clientes.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getClientes);
router.get('/cabinas', getClientesCabinas);
router.post('/', createCliente);
router.delete('/:id', deleteCliente);

module.exports = router;
