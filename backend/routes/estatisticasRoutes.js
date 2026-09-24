const express = require('express');
const router = express.Router();
const estatisticasController = require('../controllers/estatisticasController');
const checkAuth = require('../middleware/checkAuth');

router.use(checkAuth);

router.get('/estatisticas/dashboard', estatisticasController.getDashboardStats);

module.exports = router;