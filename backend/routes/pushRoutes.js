const express = require('express');
const router = express.Router();
const pushController = require('../controllers/pushController');
const checkAuth = require('../middleware/checkAuth');

router.get('/push/vapid-public-key', pushController.getChavePublica);
router.use(checkAuth);
router.post('/push/inscrever', pushController.inscrever);
router.post('/push/desinscrever', pushController.desinscrever);

module.exports = router;
