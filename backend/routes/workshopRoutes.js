const express = require('express');
const router = express.Router();
const workshopController = require('../controllers/workshopController');
const authMiddleware = require('../middlewares/authMiddleware');

// Todas as rotas abaixo exigem login (token JWT válido)
router.use(authMiddleware);

// GET /api/oficinas — lista as oficinas do usuário
router.get('/', workshopController.listar);
// POST /api/oficinas — cadastra uma oficina
router.post('/', workshopController.cadastrar);
// PUT /api/oficinas/:id — edita uma oficina
router.put('/:id', workshopController.editar);
// DELETE /api/oficinas/:id — exclui uma oficina (?forcar=true se tiver manutenções vinculadas)
router.delete('/:id', workshopController.excluir);

module.exports = router;