const express = require('express');
const router = express.Router({ mergeParams: true });
const healthController = require('../controllers/healthController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', healthController.calcularSaude);

module.exports = router;