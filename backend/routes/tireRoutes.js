const express = require('express');
const router = express.Router({ mergeParams: true });
const tireController = require('../controllers/tireController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas abaixo exigem login (token JWT válido)
router.use(authMiddleware);

// GET /api/veiculos/:veiculoId/pneus — lista os pneus ativos com o desgaste calculado
router.get('/', tireController.listar);
// POST /api/veiculos/:veiculoId/pneus — registra um pneu
router.post('/', tireController.cadastrar);
// PUT /api/veiculos/:veiculoId/pneus/:id — edita um pneu
router.put('/:id', tireController.editar);
// DELETE /api/veiculos/:veiculoId/pneus/:id — remove o pneu (soft delete) e o alerta pendente dele
router.delete('/:id', tireController.excluir);

module.exports = router;