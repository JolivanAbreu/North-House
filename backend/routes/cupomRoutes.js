const express = require('express');
const router = express.Router();
const cupomController = require('../controllers/cupomController');
const checkAuth = require('../middleware/checkAuth');

// --- Rotas Admin (protegidas) ---
router.get('/cupons', checkAuth, cupomController.getCupons);
router.post('/cupons', checkAuth, cupomController.createCupom);
router.put('/cupons/:id', checkAuth, cupomController.updateCupom);
router.delete('/cupons/:id', checkAuth, cupomController.deleteCupom);

// --- Rota Pública (validação no carrinho) ---
router.post('/public/cupons/validar', cupomController.validarCupomPublico);

module.exports = router;
