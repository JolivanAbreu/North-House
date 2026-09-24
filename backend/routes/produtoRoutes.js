const express = require('express');
const router = express.Router();
const produtoController = require('../controllers/produtoController');
const checkAuth = require('../middleware/checkAuth');

// --- DEFINIÇÃO DAS ROTAS ---

// Aplica o middleware de autenticação em TODAS as rotas abaixo
router.use(checkAuth);

// Endpoint de Lógica 
// POST /api/produtos/calcular-preco
router.post('/produtos/calcular-preco', produtoController.calcularPreco);

// CRUD de Produtos
// POST /api/produtos
router.post('/produtos', produtoController.createProduto);

// GET /api/produtos
router.get('/produtos', produtoController.getProdutos);

// PUT /api/produtos/:id (Atualiza os dados básicos do produto)
router.put('/produtos/:id', produtoController.updateProduto);

// DELETE /api/produtos/:id
router.delete('/produtos/:id', produtoController.deleteProduto);

// Ficha Técnica
// POST /api/produtos/:id/insumos (Adiciona UM insumo)
router.post('/produtos/:id/insumos', produtoController.addInsumoToFichaTecnica);

// PUT /api/produtos/:id/insumos (Sincroniza/Substitui TODOS os insumos)
router.put('/produtos/:id/insumos', produtoController.updateFichaTecnica);

// Variações do Produto (ex: Tamanho, Sabor)
router.get('/produtos/:id/variacoes', produtoController.getVariacoes);
router.post('/produtos/:id/variacoes', produtoController.createVariacao);
router.put('/produtos/variacoes/:variacaoId', produtoController.updateVariacao);
router.delete('/produtos/variacoes/:variacaoId', produtoController.deleteVariacao);


module.exports = router;