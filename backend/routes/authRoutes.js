const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middlewares/authMiddleware');

// Rotas públicas
// POST /api/auth/cadastro — cria a conta e já devolve o token de login
router.post('/cadastro', authController.cadastrar);
// POST /api/auth/login — confere e-mail e senha e devolve o token JWT
router.post('/login', authController.login);

// Rotas protegidas (precisam estar logado)
// GET /api/auth/perfil — dados do usuário logado
router.get('/perfil', authMiddleware, authController.buscarPerfil);
// PUT /api/auth/perfil — edita nome e telefone do usuário logado
router.put('/perfil', authMiddleware, authController.editarPerfil);
// PUT /api/auth/alterar-senha — troca a senha informando a senha atual
router.put('/alterar-senha', authMiddleware, authController.alterarSenha);

module.exports = router;