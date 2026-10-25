const express = require('express');
const router = express.Router({ mergeParams: true });
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas abaixo exigem login (token JWT válido)
router.use(authMiddleware);

// GET /api/veiculos/:veiculoId/dashboard — indicadores e dados dos gráficos do painel do veículo
router.get('/', dashboardController.resumo);

module.exports = router;