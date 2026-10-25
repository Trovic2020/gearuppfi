const express = require('express');
const router = express.Router({ mergeParams: true });
const reportController = require('../controllers/reportController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas abaixo exigem login (token JWT válido)
router.use(authMiddleware);

// GET /api/veiculos/:veiculoId/relatorios/completo — gera e baixa o relatório completo do veículo em PDF
router.get('/completo', reportController.gerarRelatorioCompleto);

module.exports = router;