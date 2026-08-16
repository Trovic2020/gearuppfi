const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams permite acessar :veiculoId
const maintenanceController = require('../controllers/maintenanceController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', maintenanceController.listar);
router.get('/:id', maintenanceController.buscarPorId);
router.post('/', maintenanceController.cadastrar);
router.put('/:id', maintenanceController.editar);
router.delete('/:id', maintenanceController.excluir);

module.exports = router;