const express = require('express');
const router = express.Router({ mergeParams: true });
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas abaixo exigem login (token JWT válido)
router.use(authMiddleware);

// GET /api/veiculos/:veiculoId/gastos — lista os gastos (filtros opcionais: ?categoria=, ?mes=, ?ano=)
router.get('/', expenseController.listar);
// GET /api/veiculos/:veiculoId/gastos/resumo-categoria — total e quantidade de gastos por categoria (filtro opcional ?ano=)
router.get('/resumo-categoria', expenseController.resumoPorCategoria);
// GET /api/veiculos/:veiculoId/gastos/resumo-mensal — total gasto por mês nos últimos 12 meses
router.get('/resumo-mensal', expenseController.resumoMensal);
// POST /api/veiculos/:veiculoId/gastos — lança um gasto manual
router.post('/', expenseController.cadastrar);
// PUT /api/veiculos/:veiculoId/gastos/:id — edita um gasto (só os lançados manualmente)
router.put('/:id', expenseController.editar);
// DELETE /api/veiculos/:veiculoId/gastos/:id — exclui um gasto (só os lançados manualmente)
router.delete('/:id', expenseController.excluir);

module.exports = router;