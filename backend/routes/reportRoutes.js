const express = require('express');
const router = express.Router({ mergeParams: true });
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/completo', reportController.gerarRelatorioCompleto);

module.exports = router;