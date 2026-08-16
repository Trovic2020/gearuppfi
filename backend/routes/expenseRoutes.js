const express = require('express');
const router = express.Router({ mergeParams: true });
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', expenseController.listar);
router.get('/resumo-categoria', expenseController.resumoPorCategoria);
router.get('/resumo-mensal', expenseController.resumoMensal);
router.post('/', expenseController.cadastrar);
router.put('/:id', expenseController.editar);
router.delete('/:id', expenseController.excluir);

module.exports = router;