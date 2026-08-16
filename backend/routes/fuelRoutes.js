const express = require('express');
const router = express.Router({ mergeParams: true });
const fuelController = require('../controllers/fuelController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', fuelController.listar);
router.get('/estatisticas', fuelController.estatisticas);
router.post('/', fuelController.cadastrar);
router.put('/:id', fuelController.editar);
router.delete('/:id', fuelController.excluir);

module.exports = router;