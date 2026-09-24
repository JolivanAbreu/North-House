const express = require('express');
const router = express.Router();
const equipeController = require('../controllers/equipeController');
const checkAuth = require('../middleware/checkAuth');
const checkDono = require('../middleware/checkDono');

router.use(checkAuth);
router.use(checkDono);

router.get('/equipe', equipeController.listarEquipe);
router.post('/equipe', equipeController.criarAtendente);
router.delete('/equipe/:id', equipeController.removerAtendente);

module.exports = router;
