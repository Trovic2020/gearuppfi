const express = require('express');
const router = express.Router({ mergeParams: true });
const healthController = require('../controllers/healthController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas abaixo exigem login (token JWT válido)
router.use(authMiddleware);

// GET /api/veiculos/:veiculoId/saude — calcula a pontuação de saúde do veículo (0 a 100)
router.get('/', healthController.calcularSaude);

module.exports = router;