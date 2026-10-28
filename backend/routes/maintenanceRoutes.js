const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams permite acessar :veiculoId
const maintenanceController = require('../controllers/maintenanceController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas abaixo exigem login (token JWT válido)
router.use(authMiddleware);

// GET /api/veiculos/:veiculoId/manutencoes — lista as manutenções com o nome da oficina
router.get('/', maintenanceController.listar);
// POST /api/veiculos/:veiculoId/manutencoes — registra uma manutenção (lança o gasto e atualiza a quilometragem)
router.post('/', maintenanceController.cadastrar);
// PUT /api/veiculos/:veiculoId/manutencoes/:id — edita uma manutenção e mantém o gasto vinculado em sincronia
router.put('/:id', maintenanceController.editar);
// DELETE /api/veiculos/:veiculoId/manutencoes/:id — exclui uma manutenção e o gasto vinculado
router.delete('/:id', maintenanceController.excluir);

module.exports = router;