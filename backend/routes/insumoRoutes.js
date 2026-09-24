const express = require('express');
const router = express.Router();
const insumoController = require('../controllers/insumoController');
const checkAuth = require('../middleware/checkAuth');

// Todas as rotas de insumo são protegidas
router.post('/insumos', checkAuth, insumoController.createInsumo);
router.get('/insumos', checkAuth, insumoController.getInsumos);
router.put('/insumos/:id', checkAuth, insumoController.updateInsumo);
router.delete('/insumos/:id', checkAuth, insumoController.deleteInsumo);

// Rota para adicionar estoque
router.post('/insumos/:id/estoque', checkAuth, insumoController.adicionarEstoque);

module.exports = router;