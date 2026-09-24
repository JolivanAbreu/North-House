const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const checkAuth = require('../middleware/checkAuth');

// Rotas de Autenticação
router.post('/registro', authController.registro);
router.post('/login', authController.login);
router.post('/esqueci-senha', authController.esqueciSenha);
router.post('/redefinir-senha/:token', authController.redefinirSenha);

// Rota de teste protegida
router.get('/teste-auth', checkAuth, (req, res) => {
  res.status(200).json({ 
    message: 'Você está autenticado!', 
    usuario: req.userData 
  });
});

module.exports = router;