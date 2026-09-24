const express = require('express');
const router = express.Router();
const pedidoAdminController = require('../controllers/pedidoAdminController');
const checkAuth = require('../middleware/checkAuth');

router.use(checkAuth);

// Listar pedidos do MEI
router.get('/pedidos/admin', pedidoAdminController.getPedidosAdmin);

// Atualizar status de um pedido
router.put('/pedidos/admin/:id/status', pedidoAdminController.updatePedidoStatus);

// Excluir um pedido (só Concluído ou Cancelado)
router.delete('/pedidos/admin/:id', pedidoAdminController.deletePedido);

// Tirar um pedido do arquivo (volta a aparecer na lista normal)
router.put('/pedidos/admin/:id/desarquivar', pedidoAdminController.desarquivarPedido);

// --- Comandas locais ---

// Abrir uma comanda local (atendimento presencial)
router.post('/pedidos/admin', pedidoAdminController.createComandaLocal);

// Adicionar item a uma comanda aberta
router.post('/pedidos/admin/:id/itens', pedidoAdminController.addItemComanda);

// Remover item de uma comanda aberta
router.delete('/pedidos/admin/:id/itens/:itemId', pedidoAdminController.removeItemComanda);

// Gerar Pix (QR code) para a comanda
router.post('/pedidos/admin/:id/pix', pedidoAdminController.gerarPixComanda);

// Confirmar pagamento e finalizar a comanda
router.put('/pedidos/admin/:id/finalizar', pedidoAdminController.finalizarComanda);

// Reabrir uma comanda já finalizada
router.put('/pedidos/admin/:id/reabrir', pedidoAdminController.reabrirComanda);

module.exports = router;