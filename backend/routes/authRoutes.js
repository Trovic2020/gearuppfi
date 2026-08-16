const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas públicas
router.post('/cadastro', authController.cadastrar);
router.post('/login', authController.login);
router.post('/esqueci-senha', authController.solicitarRecuperacao);
router.post('/redefinir-senha', authController.redefinirSenha);

// Rotas protegidas (precisam estar logado)
router.get('/perfil', authMiddleware, authController.buscarPerfil);
router.put('/perfil', authMiddleware, authController.editarPerfil);
router.put('/alterar-senha', authMiddleware, authController.alterarSenha);

module.exports = router;