const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilController');
const checkAuth = require('../middleware/checkAuth');
const checkDono = require('../middleware/checkDono');

// Protege todas as rotas de perfil com autenticação
router.use(checkAuth);

// GET /api/perfil (dono e atendentes podem ver, ex: pra saber se a loja está pausada)
router.get('/perfil', perfilController.getPerfil);

// PUT /api/perfil (só o dono pode alterar as configurações da loja)
router.put('/perfil', checkDono, perfilController.updatePerfil);

module.exports = router;