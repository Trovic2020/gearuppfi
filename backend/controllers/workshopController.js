const pool = require('../config/database');

// ===== LISTAR OFICINAS DO USUÁRIO =====
async function listar(req, res) {
  try {
    const [oficinas] = await pool.query(
      'SELECT * FROM oficinas WHERE usuario_id = ? ORDER BY nome ASC',
      [req.usuarioId]
    );
    return res.json(oficinas);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao listar oficinas.' });
  }
}

// ===== BUSCAR UMA OFICINA =====
async function buscarPorId(req, res) {
  try {
    const { id } = req.params;
    const [oficinas] = await pool.query(
      'SELECT * FROM oficinas WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );
    if (oficinas.length === 0) {
      return res.status(404).json({ erro: 'Oficina não encontrada.' });
    }
    return res.json(oficinas[0]);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao buscar oficina.' });
  }
}

// ===== CADASTRAR OFICINA =====
async function cadastrar(req, res) {
  try {
    const { nome, telefone, endereco, cidade, observacoes } = req.body;

    if (!nome) {
      return res.status(400).json({ erro: 'Nome da oficina é obrigatório.' });
    }

    const [resultado] = await pool.query(
      'INSERT INTO oficinas (usuario_id, nome, telefone, endereco, cidade, observacoes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.usuarioId, nome, telefone || null, endereco || null, cidade || null, observacoes || null]
    );

    return res.status(201).json({
      mensagem: 'Oficina cadastrada com sucesso!',
      id: resultado.insertId
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao cadastrar oficina.' });
  }
}

// ===== EDITAR OFICINA =====
async function editar(req, res) {
  try {
    const { id } = req.params;
    const { nome, telefone, endereco, cidade, observacoes } = req.body;

    const [existentes] = await pool.query(
      'SELECT id FROM oficinas WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );
    if (existentes.length === 0) {
      return res.status(404).json({ erro: 'Oficina não encontrada.' });
    }

    if (!nome) {
      return res.status(400).json({ erro: 'Nome da oficina é obrigatório.' });
    }

    await pool.query(
      'UPDATE oficinas SET nome = ?, telefone = ?, endereco = ?, cidade = ?, observacoes = ? WHERE id = ? AND usuario_id = ?',
      [nome, telefone || null, endereco || null, cidade || null, observacoes || null, id, req.usuarioId]
    );

    return res.json({ mensagem: 'Oficina atualizada com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao atualizar oficina.' });
  }
}

// ===== EXCLUIR OFICINA =====
async function excluir(req, res) {
  try {
    const { id } = req.params;

    const [existentes] = await pool.query(
      'SELECT id FROM oficinas WHERE id = ? AND usuario_id = ?',
      [id, req.usuarioId]
    );
    if (existentes.length === 0) {
      return res.status(404).json({ erro: 'Oficina não encontrada.' });
    }

    // Verifica se há manutenções vinculadas a essa oficina
    const [vinculadas] = await pool.query(
      'SELECT COUNT(*) AS total FROM manutencoes WHERE oficina_id = ?',
      [id]
    );

    if (vinculadas[0].total > 0) {
      // Não bloqueia a exclusão, mas desvincula as manutenções antigas (FK já tem ON DELETE SET NULL)
      return res.status(409).json({
        erro: `Esta oficina está vinculada a ${vinculadas[0].total} manutenção(ões). Excluir mesmo assim vai desvincular esses registros. Confirme enviando ?forcar=true na URL.`
      });
    }

    await pool.query('DELETE FROM oficinas WHERE id = ? AND usuario_id = ?', [id, req.usuarioId]);

    return res.json({ mensagem: 'Oficina removida com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao remover oficina.' });
  }
}

module.exports = { listar, buscarPorId, cadastrar, editar, excluir };