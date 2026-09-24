const express = require('express');
const router = express.Router();
const publicController = require('../controllers/publicController');
const pagamentoController = require('../controllers/pagamentoController');

router.get('/public/vitrine/:usuarioId', publicController.getVitrine);
router.post('/public/pedidos', publicController.createPedido);

router.get('/public/pedidos/:token', publicController.getPedidoStatus);

// Webhook do Mercado Pago (confirmação automática de pagamento Pix)
router.post('/public/pagamentos/webhook', pagamentoController.webhookMercadoPago);

module.exports = router;