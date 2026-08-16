const express = require('express');
const router = express.Router({ mergeParams: true });
const tireController = require('../controllers/tireController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(authMiddleware);

router.get('/', tireController.listar);
router.post('/', tireController.cadastrar);
router.put('/:id', tireController.editar);
router.delete('/:id', tireController.excluir);

module.exports = router;