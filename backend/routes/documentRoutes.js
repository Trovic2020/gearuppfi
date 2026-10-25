const express = require('express');
const router = express.Router({ mergeParams: true });
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middlewares/authMiddleware');
const upload = require('../config/upload');

// Todas as rotas abaixo exigem login (token JWT válido)
router.use(authMiddleware);

// GET /api/veiculos/:veiculoId/documentos — lista os documentos com o link de cada arquivo
router.get('/', documentController.listar);
// POST /api/veiculos/:veiculoId/documentos — envia um novo documento (PDF, JPG ou PNG)
// upload.single('arquivo') processa UM arquivo enviado no campo chamado "arquivo"
router.post('/', upload.single('arquivo'), documentController.cadastrar);
// DELETE /api/veiculos/:veiculoId/documentos/:id — apaga o documento do banco e o arquivo do disco
router.delete('/:id', documentController.excluir);

module.exports = router;