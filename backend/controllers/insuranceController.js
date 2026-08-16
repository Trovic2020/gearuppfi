const pool = require('../config/database');

async function veiculoPertenceAoUsuario(veiculoId, usuarioId) {
  const [veiculos] = await pool.query(
    'SELECT id FROM veiculos WHERE id = ? AND usuario_id = ?',
    [veiculoId, usuarioId]
  );
  return veiculos.length > 0;
}

// Calcula status de vencimento a partir de uma data
function calcularStatusVencimento(dataVencimento) {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const vencimento = new Date(dataVencimento);
  vencimento.setHours(0, 0, 0, 0);

  const diasRestantes = Math.round((vencimento - hoje) / (1000 * 60 * 60 * 24));

  let status = 'Em dia';
  if (diasRestantes < 0) status = 'Vencido';
  else if (diasRestantes <= 30) status = 'Vence em breve';

  return { dias_restantes: diasRestantes, status };
}

// ===== LISTAR SEGUROS DE UM VEÍCULO (com status calculado) =====
async function listar(req, res) {
  try {
    const { veiculoId } = req.params;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [seguros] = await pool.query(
      'SELECT * FROM seguros WHERE veiculo_id = ? AND ativo = TRUE ORDER BY data_vencimento ASC',
      [veiculoId]
    );

    const comStatus = seguros.map(seguro => ({
      ...seguro,
      ...calcularStatusVencimento(seguro.data_vencimento)
    }));

    return res.json(comStatus);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao listar seguros.' });
  }
}

// ===== CADASTRAR SEGURO =====
async function cadastrar(req, res) {
  try {
    const { veiculoId } = req.params;
    const { seguradora, numero_apolice, data_contratacao, data_vencimento, valor, arquivo_pdf } = req.body;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    if (!seguradora || !data_contratacao || !data_vencimento) {
      return res.status(400).json({ erro: 'Seguradora, data de contratação e vencimento são obrigatórios.' });
    }

    const [resultado] = await pool.query(
      `INSERT INTO seguros (veiculo_id, seguradora, numero_apolice, data_contratacao, data_vencimento, valor, arquivo_pdf)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [veiculoId, seguradora, numero_apolice || null, data_contratacao, data_vencimento, valor || null, arquivo_pdf || null]
    );

    // Lança no controle financeiro, se tiver valor
    if (valor && valor > 0) {
      await pool.query(
        `INSERT INTO gastos (veiculo_id, categoria, descricao, valor, data_gasto, origem_tipo, origem_id)
         VALUES (?, 'Seguro', ?, ?, ?, 'seguro', ?)`,
        [veiculoId, `Seguro - ${seguradora}`, valor, data_contratacao, resultado.insertId]
      );
    }

    return res.status(201).json({
      mensagem: 'Seguro registrado com sucesso!',
      id: resultado.insertId
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao registrar seguro.' });
  }
}

// ===== EDITAR SEGURO =====
async function editar(req, res) {
  try {
    const { veiculoId, id } = req.params;
    const { seguradora, numero_apolice, data_contratacao, data_vencimento, valor, arquivo_pdf } = req.body;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [existentes] = await pool.query('SELECT id FROM seguros WHERE id = ? AND veiculo_id = ?', [id, veiculoId]);
    if (existentes.length === 0) {
      return res.status(404).json({ erro: 'Seguro não encontrado.' });
    }

    if (!seguradora || !data_contratacao || !data_vencimento) {
      return res.status(400).json({ erro: 'Seguradora, data de contratação e vencimento são obrigatórios.' });
    }

    await pool.query(
      `UPDATE seguros SET seguradora = ?, numero_apolice = ?, data_contratacao = ?, 
       data_vencimento = ?, valor = ?, arquivo_pdf = ? WHERE id = ? AND veiculo_id = ?`,
      [seguradora, numero_apolice || null, data_contratacao, data_vencimento, valor || null, arquivo_pdf || null, id, veiculoId]
    );

    await pool.query(
      `UPDATE gastos SET valor = ? WHERE origem_tipo = 'seguro' AND origem_id = ?`,
      [valor || 0, id]
    );

    return res.json({ mensagem: 'Seguro atualizado com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao atualizar seguro.' });
  }
}

// ===== EXCLUIR SEGURO =====
async function excluir(req, res) {
  try {
    const { veiculoId, id } = req.params;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [existentes] = await pool.query('SELECT id FROM seguros WHERE id = ? AND veiculo_id = ?', [id, veiculoId]);
    if (existentes.length === 0) {
      return res.status(404).json({ erro: 'Seguro não encontrado.' });
    }

    await pool.query('UPDATE seguros SET ativo = FALSE WHERE id = ? AND veiculo_id = ?', [id, veiculoId]);

    return res.json({ mensagem: 'Seguro removido com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao remover seguro.' });
  }
}

module.exports = { listar, cadastrar, editar, excluir };