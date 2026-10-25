const express = require('express');
const router = express.Router({ mergeParams: true });
const insuranceController = require('../controllers/insuranceController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas abaixo exigem login (token JWT válido)
router.use(authMiddleware);

// GET /api/veiculos/:veiculoId/seguros — lista os seguros ativos com o status de vencimento
router.get('/', insuranceController.listar);
// POST /api/veiculos/:veiculoId/seguros — registra um seguro (lança o gasto, se tiver valor)
router.post('/', insuranceController.cadastrar);
// PUT /api/veiculos/:veiculoId/seguros/:id — edita um seguro e mantém o gasto vinculado em sincronia
router.put('/:id', insuranceController.editar);
// DELETE /api/veiculos/:veiculoId/seguros/:id — remove o seguro (soft delete), o gasto e o alerta pendente dele
router.delete('/:id', insuranceController.excluir);

module.exports = router;