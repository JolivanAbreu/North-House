const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const checkAuth = require('../middleware/checkAuth');

router.use(checkAuth);

router.get('/clientes', clienteController.listarClientes);
router.get('/clientes/:telefone/pedidos', clienteController.historicoCliente);

module.exports = router;