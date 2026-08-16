const express = require('express');
const router = express.Router({ mergeParams: true });
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../config/upload');

router.use(authMiddleware);

router.get('/', documentController.listar);
// upload.single('arquivo') processa UM arquivo enviado no campo chamado "arquivo"
router.post('/', upload.single('arquivo'), documentController.cadastrar);
router.delete('/:id', documentController.excluir);

module.exports = router;