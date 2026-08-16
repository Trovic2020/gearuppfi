const pool = require('../config/database');

async function veiculoPertenceAoUsuario(veiculoId, usuarioId) {
  const [veiculos] = await pool.query(
    'SELECT id, quilometragem_atual FROM veiculos WHERE id = ? AND usuario_id = ?',
    [veiculoId, usuarioId]
  );
  return veiculos.length > 0 ? veiculos[0] : null;
}

// Calcula o status de vida útil de um pneu
function calcularStatusPneu(pneu, quilometragemAtualVeiculo) {
  const kmRodados = quilometragemAtualVeiculo - pneu.quilometragem_instalacao;
  const percentualUsado = (kmRodados / pneu.vida_util_km) * 100;

  let status = 'OK';
  if (percentualUsado >= 100) status = 'Trocar';
  else if (percentualUsado >= 80) status = 'Atenção';

  return {
    km_rodados: kmRodados,
    percentual_usado: parseFloat(percentualUsado.toFixed(1)),
    km_restante: Math.max(pneu.vida_util_km - kmRodados, 0),
    status
  };
}

// ===== LISTAR PNEUS DE UM VEÍCULO (com status calculado) =====
async function listar(req, res) {
  try {
    const { veiculoId } = req.params;

    const veiculo = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [pneus] = await pool.query(
      'SELECT * FROM pneus WHERE veiculo_id = ? AND ativo = TRUE ORDER BY data_instalacao DESC',
      [veiculoId]
    );

    const comStatus = pneus.map(pneu => ({
      ...pneu,
      ...calcularStatusPneu(pneu, veiculo.quilometragem_atual)
    }));

    return res.json(comStatus);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao listar pneus.' });
  }
}

// ===== CADASTRAR PNEU =====
async function cadastrar(req, res) {
  try {
    const { veiculoId } = req.params;
    const { marca, modelo, posicao, data_instalacao, quilometragem_instalacao, vida_util_km, observacoes } = req.body;

    const veiculo = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    if (!marca || !data_instalacao || quilometragem_instalacao === undefined) {
      return res.status(400).json({ erro: 'Marca, data de instalação e quilometragem são obrigatórios.' });
    }

    const [resultado] = await pool.query(
      `INSERT INTO pneus (veiculo_id, marca, modelo, posicao, data_instalacao, quilometragem_instalacao, vida_util_km, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [veiculoId, marca, modelo || null, posicao || 'Jogo Completo', data_instalacao, quilometragem_instalacao, vida_util_km || 50000, observacoes || null]
    );

    return res.status(201).json({
      mensagem: 'Pneu registrado com sucesso!',
      id: resultado.insertId
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao registrar pneu.' });
  }
}

// ===== EDITAR PNEU =====
async function editar(req, res) {
  try {
    const { veiculoId, id } = req.params;
    const { marca, modelo, posicao, data_instalacao, quilometragem_instalacao, vida_util_km, observacoes } = req.body;

    const veiculo = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [existentes] = await pool.query('SELECT id FROM pneus WHERE id = ? AND veiculo_id = ?', [id, veiculoId]);
    if (existentes.length === 0) {
      return res.status(404).json({ erro: 'Pneu não encontrado.' });
    }

    if (!marca || !data_instalacao || quilometragem_instalacao === undefined) {
      return res.status(400).json({ erro: 'Marca, data de instalação e quilometragem são obrigatórios.' });
    }

    await pool.query(
      `UPDATE pneus SET marca = ?, modelo = ?, posicao = ?, data_instalacao = ?, 
       quilometragem_instalacao = ?, vida_util_km = ?, observacoes = ? WHERE id = ? AND veiculo_id = ?`,
      [marca, modelo || null, posicao || 'Jogo Completo', data_instalacao, quilometragem_instalacao, vida_util_km || 50000, observacoes || null, id, veiculoId]
    );

    return res.json({ mensagem: 'Pneu atualizado com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao atualizar pneu.' });
  }
}

// ===== EXCLUIR (soft delete, ex: quando o pneu é substituído) =====
async function excluir(req, res) {
  try {
    const { veiculoId, id } = req.params;

    const veiculo = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [existentes] = await pool.query('SELECT id FROM pneus WHERE id = ? AND veiculo_id = ?', [id, veiculoId]);
    if (existentes.length === 0) {
      return res.status(404).json({ erro: 'Pneu não encontrado.' });
    }

    await pool.query('UPDATE pneus SET ativo = FALSE WHERE id = ? AND veiculo_id = ?', [id, veiculoId]);

    return res.json({ mensagem: 'Pneu removido com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao remover pneu.' });
  }
}

module.exports = { listar, cadastrar, editar, excluir };