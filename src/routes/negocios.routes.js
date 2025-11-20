const express = require('express');
const { authMiddleware } = require('../middleware/auth.middleware');
const { getNegocios } = require('../controllers/negocios.controller');

const router = express.Router();

router.use(authMiddleware);

router.get('/', getNegocios);

module.exports = router;
