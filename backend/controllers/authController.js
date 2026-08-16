const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const pool = require('../config/database');
require('dotenv').config();

// Validações simples reutilizáveis
function emailValido(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ===== CADASTRO =====
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

// ===== SOLICITAR RECUPERAÇÃO DE SENHA (esqueci minha senha) =====
async function solicitarRecuperacao(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ erro: 'E-mail é obrigatório.' });
    }

    const [usuarios] = await pool.query('SELECT id FROM usuarios WHERE email = ?', [email]);

    // Por segurança, não informamos se o e-mail existe ou não
    if (usuarios.length === 0) {
      return res.json({ mensagem: 'Se o e-mail existir em nossa base, você receberá instruções.' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expira = new Date(Date.now() + 60 * 60 * 1000); // expira em 1 hora

    await pool.query(
      'UPDATE usuarios SET reset_token = ?, reset_token_expira = ? WHERE id = ?',
      [token, expira, usuarios[0].id]
    );

    // TODO (próxima etapa opcional): enviar esse token por e-mail real (Nodemailer)
    // Por enquanto, retornamos o token na resposta só para fins de teste em desenvolvimento
    return res.json({
      mensagem: 'Se o e-mail existir em nossa base, você receberá instruções.',
      tokenDev: token // ⚠️ remover isso quando integrar envio de e-mail de verdade
    });

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao solicitar recuperação de senha.' });
  }
}

// ===== REDEFINIR SENHA COM TOKEN =====
async function redefinirSenha(req, res) {
  try {
    const { token, novaSenha } = req.body;

    if (!token || !novaSenha) {
      return res.status(400).json({ erro: 'Token e nova senha são obrigatórios.' });
    }

    if (novaSenha.length < 6) {
      return res.status(400).json({ erro: 'A nova senha deve ter no mínimo 6 caracteres.' });
    }

    const [usuarios] = await pool.query(
      'SELECT id FROM usuarios WHERE reset_token = ? AND reset_token_expira > NOW()',
      [token]
    );

    if (usuarios.length === 0) {
      return res.status(400).json({ erro: 'Token inválido ou expirado.' });
    }

    const novaSenhaHash = await bcrypt.hash(novaSenha, 10);

    await pool.query(
      'UPDATE usuarios SET senha = ?, reset_token = NULL, reset_token_expira = NULL WHERE id = ?',
      [novaSenhaHash, usuarios[0].id]
    );

    return res.json({ mensagem: 'Senha redefinida com sucesso!' });

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao redefinir senha.' });
  }
}

module.exports = {
  cadastrar,
  login,
  buscarPerfil,
  editarPerfil,
  alterarSenha,
  solicitarRecuperacao,
  redefinirSenha
};