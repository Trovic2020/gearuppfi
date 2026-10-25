const express = require('express');
const router = express.Router({ mergeParams: true });
const alertController = require('../controllers/alertController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas abaixo exigem login (token JWT válido)
router.use(authMiddleware);

// GET /api/veiculos/:veiculoId/alertas — gera os alertas atualizados e lista (filtro opcional ?status=)
router.get('/', alertController.listar);
// PATCH /api/veiculos/:veiculoId/alertas/:id/status — muda o status do alerta (Pendente, Resolvido ou Ignorado)
router.patch('/:id/status', alertController.atualizarStatus);

module.exports = router;