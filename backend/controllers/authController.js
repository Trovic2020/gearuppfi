const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
require('dotenv').config();

// Validações simples reutilizáveis
// Retorna true se o texto tiver formato de e-mail (algo@dominio.com)
function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===== CADASTRO =====
// Cria o usuário (senha criptografada com bcrypt) e já devolve o token JWT, para entrar logado
async function cadastrar(req, res) {
  try {
    const { nome, email, telefone, senha } = req.body;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
    }

    if (!emailValido(email)) {
      return res.status(400).json({ erro: 'E-mail inválido.' });
    }

    if (senha.length < 6) {
      return res.status(400).json({ erro: 'A senha deve ter no mínimo 6 caracteres.' });
    }

    // Verifica se o e-mail já existe
    const [existentes] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);
    if (existentes.length > 0) {
      return res.status(409).json({ erro: 'Este e-mail já está cadastrado.' });
    }

    // Criptografa a senha
    const senhaHash = await bcrypt.hash(senha, 10);

    const [resultado] = await pool.query(
      'INSERT INTO usuarios (nome, email, telefone, senha) VALUES (?, ?, ?, ?)',
      [nome, email, telefone || null, senhaHash]
    );

    const token = jwt.sign({ id: resultado.insertId }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.status(201).json({
      mensagem: 'Usuário cadastrado com sucesso!',
      token,
      usuario: { id: resultado.insertId, nome, email, telefone: telefone || null }
    });

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao cadastrar usuário.' });
  }
}

// ===== LOGIN =====
// Confere e-mail e senha e devolve o token JWT (válido por 7 dias) com os dados do usuário
async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }

    const [usuarios] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (usuarios.length === 0) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const usuario = usuarios[0];
    const senhaCorreta = await bcrypt.compare(senha, usuario.senha);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }

    const token = jwt.sign({ id: usuario.id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    return res.json({
      mensagem: 'Login realizado com sucesso!',
      token,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        telefone: usuario.telefone
      }
    });

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao realizar login.' });
  }
}

// ===== BUSCAR PERFIL (usuário logado) =====
// Retorna os dados do usuário logado (sem a senha)
async function buscarPerfil(req, res) {
  try {
    const [usuarios] = await pool.query(
      'SELECT id, nome, email, telefone, criado_em FROM usuarios WHERE id = ?',
      [req.usuarioId]
    );

    if (usuarios.length === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }

    return res.json(usuarios[0]);

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao buscar perfil.' });
  }
}

// ===== EDITAR PERFIL =====
// Atualiza o nome e o telefone do usuário logado
async function editarPerfil(req, res) {
  try {
    const { nome, telefone } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'Nome é obrigatório.' });
    }

    await pool.query(
      'UPDATE usuarios SET nome = ?, telefone = ? WHERE id = ?',
      [nome, telefone || null, req.usuarioId]
    );

    return res.json({ mensagem: 'Perfil atualizado com sucesso!' });

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao atualizar perfil.' });
  }
}

// ===== ALTERAR SENHA (usuário logado, sabendo a senha atual) =====
// Confere a senha atual e grava a nova senha criptografada
async function alterarSenha(req, res) {
  try {
    const { senhaAtual, novaSenha } = req.body;

    if (!senhaAtual || !novaSenha) {
      return res.status(400).json({ erro: 'Senha atual e nova senha são obrigatórias.' });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    const [usuarios] = await pool.query('SELECT senha FROM usuarios WHERE id = ?', [req.usuarioId]);
    const senhaCorreta = await bcrypt.compare(senhaAtual, usuarios[0].senha);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: 'Senha atual incorreta.' });
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);
    await pool.query('UPDATE usuarios SET senha = ? WHERE id = ?', [novaSenhaHash, req.usuarioId]);

    return res.json({ mensagem: 'Senha alterada com sucesso!' });

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao alterar senha.' });
  }
}

module.exports = {
  cadastrar,
  login,
  buscarPerfil,
  editarPerfil,
  alterarSenha
};