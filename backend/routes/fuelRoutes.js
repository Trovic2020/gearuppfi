const express = require('express');
const router = express.Router({ mergeParams: true });
const fuelController = require('../controllers/fuelController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas abaixo exigem login (token JWT válido)
router.use(authMiddleware);

// GET /api/veiculos/:veiculoId/abastecimentos — lista os abastecimentos com o consumo (km/l) de cada um
router.get('/', fuelController.listar);
// GET /api/veiculos/:veiculoId/abastecimentos/estatisticas — consumo médio, preço médio do litro e gastos do mês/ano
router.get('/estatisticas', fuelController.estatisticas);
// POST /api/veiculos/:veiculoId/abastecimentos — registra um abastecimento (também lança o gasto e atualiza a quilometragem)
router.post('/', fuelController.cadastrar);
// PUT /api/veiculos/:veiculoId/abastecimentos/:id — edita um abastecimento e o gasto vinculado
router.put('/:id', fuelController.editar);
// DELETE /api/veiculos/:veiculoId/abastecimentos/:id — exclui um abastecimento e o gasto vinculado
router.delete('/:id', fuelController.excluir);

module.exports = router;