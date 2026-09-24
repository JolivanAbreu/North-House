const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');
const checkAuth = require('../middleware/checkAuth'); 

router.post('/categorias', checkAuth, categoriaController.createCategoria);
router.get('/categorias', checkAuth, categoriaController.getCategorias);
router.put('/categorias/:id', checkAuth, categoriaController.updateCategoria);
router.delete('/categorias/:id', checkAuth, categoriaController.deleteCategoria);

module.exports = router;