const express = require('express');
const router = express.Router();
const mesaController = require('../controllers/mesaController');
const checkAuth = require('../middleware/checkAuth');

router.use(checkAuth);

router.get('/mesas', mesaController.getMesas);
router.post('/mesas', mesaController.createMesa);
router.put('/mesas/:id', mesaController.updateMesa);
router.delete('/mesas/:id', mesaController.deleteMesa);

module.exports = router;
