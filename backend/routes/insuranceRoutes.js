const express = require('express');
const router = express.Router({ mergeParams: true });
const insuranceController = require('../controllers/insuranceController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', insuranceController.listar);
router.post('/', insuranceController.cadastrar);
router.put('/:id', insuranceController.editar);
router.delete('/:id', insuranceController.excluir);

module.exports = router;