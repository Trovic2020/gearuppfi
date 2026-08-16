const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', workshopController.listar);
router.get('/:id', workshopController.buscarPorId);
router.post('/', workshopController.cadastrar);
router.put('/:id', workshopController.editar);
router.delete('/:id', workshopController.excluir);

module.exports = router;