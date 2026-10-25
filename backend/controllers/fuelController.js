const pool = require('../config/database');

async function veiculoPertenceAoUsuario(veiculoId, usuarioId) {
  const [veiculos] = await pool.query(
    'SELECT id FROM veiculos WHERE id = ? AND usuario_id = ?',
    [veiculoId, usuarioId]
  );
  return veiculos.length > 0;
}

// ===== LISTAR ABASTECIMENTOS (com consumo calculado) =====
async function listar(req, res) {
  try {
    const { veiculoId } = req.params;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [abastecimentos] = await pool.query(
      'SELECT * FROM abastecimentos WHERE veiculo_id = ? ORDER BY quilometragem ASC',
      [veiculoId]
    );

    // Calcula o consumo médio de cada abastecimento em relação ao anterior
    const comConsumo = abastecimentos.map((atual, index) => {
      if (index === 0) {
        return { ...atual, consumo_medio: null };
      }
      const anterior = abastecimentos[index - 1];
      const kmRodados = atual.quilometragem - anterior.quilometragem;
      const consumo = kmRodados > 0 ? (kmRodados / atual.litros).toFixed(2) : null;
      return { ...atual, consumo_medio: consumo ? parseFloat(consumo) : null };
    });

    // Retorna do mais recente para o mais antigo (mais intuitivo pro usuário)
    return res.json(comConsumo.reverse());
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao listar abastecimentos.' });
  }
}

// ===== CADASTRAR ABASTECIMENTO =====
async function cadastrar(req, res) {
  try {
    const { veiculoId } = req.params;
    const { data_abastecimento, posto, tipo_combustivel, litros, valor_total, quilometragem, tanque_cheio } = req.body;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    if (!data_abastecimento || !tipo_combustivel || !litros || !valor_total || quilometragem === undefined) {
      return res.status(400).json({ erro: 'Data, tipo de combustível, litros, valor total e quilometragem são obrigatórios.' });
    }

    const [resultado] = await pool.query(
      `INSERT INTO abastecimentos (veiculo_id, data_abastecimento, posto, tipo_combustivel, litros, valor_total, quilometragem, tanque_cheio)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [veiculoId, data_abastecimento, posto || null, tipo_combustivel, litros, valor_total, quilometragem, tanque_cheio !== undefined ? tanque_cheio : true]
    );

    // Lança no controle financeiro
    await pool.query(
      `INSERT INTO gastos (veiculo_id, categoria, descricao, valor, data_gasto, origem_tipo, origem_id)
       VALUES (?, 'Combustível', ?, ?, ?, 'abastecimento', ?)`,
      [veiculoId, `Abastecimento - ${tipo_combustivel}`, valor_total, data_abastecimento, resultado.insertId]
    );

    // Atualiza quilometragem do veículo, se maior
    await pool.query(
      'UPDATE veiculos SET quilometragem_atual = ? WHERE id = ? AND quilometragem_atual < ?',
      [quilometragem, veiculoId, quilometragem]
    );

    return res.status(201).json({
      mensagem: 'Abastecimento registrado com sucesso!',
      id: resultado.insertId
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao registrar abastecimento.' });
  }
}

// ===== EDITAR ABASTECIMENTO =====
async function editar(req, res) {
  try {
    const { veiculoId, id } = req.params;
    const { data_abastecimento, posto, tipo_combustivel, litros, valor_total, quilometragem, tanque_cheio } = req.body;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [existentes] = await pool.query(
      'SELECT id FROM abastecimentos WHERE id = ? AND veiculo_id = ?',
      [id, veiculoId]
    );
    if (existentes.length === 0) {
      return res.status(404).json({ erro: 'Abastecimento não encontrado.' });
    }

    if (!data_abastecimento || !tipo_combustivel || !litros || !valor_total || quilometragem === undefined) {
      return res.status(400).json({ erro: 'Data, tipo de combustível, litros, valor total e quilometragem são obrigatórios.' });
    }

    await pool.query(
      `UPDATE abastecimentos SET data_abastecimento = ?, posto = ?, tipo_combustivel = ?, 
       litros = ?, valor_total = ?, quilometragem = ?, tanque_cheio = ? WHERE id = ? AND veiculo_id = ?`,
      [data_abastecimento, posto || null, tipo_combustivel, litros, valor_total, quilometragem, tanque_cheio !== undefined ? tanque_cheio : true, id, veiculoId]
    );

    await pool.query(
      `UPDATE gastos SET descricao = ?, valor = ?, data_gasto = ? WHERE origem_tipo = 'abastecimento' AND origem_id = ?`,
      [`Abastecimento - ${tipo_combustivel}`, valor_total, data_abastecimento, id]
    );

    return res.json({ mensagem: 'Abastecimento atualizado com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao atualizar abastecimento.' });
  }
}

// ===== EXCLUIR ABASTECIMENTO =====
async function excluir(req, res) {
  try {
    const { veiculoId, id } = req.params;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [existentes] = await pool.query(
      'SELECT id FROM abastecimentos WHERE id = ? AND veiculo_id = ?',
      [id, veiculoId]
    );
    if (existentes.length === 0) {
      return res.status(404).json({ erro: 'Abastecimento não encontrado.' });
    }

    await pool.query(`DELETE FROM gastos WHERE origem_tipo = 'abastecimento' AND origem_id = ?`, [id]);
    await pool.query('DELETE FROM abastecimentos WHERE id = ? AND veiculo_id = ?', [id, veiculoId]);

    return res.json({ mensagem: 'Abastecimento removido com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao remover abastecimento.' });
  }
}

// ===== ESTATÍSTICAS DE CONSUMO E GASTOS =====
async function estatisticas(req, res) {
  try {
    const { veiculoId } = req.params;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [abastecimentos] = await pool.query(
      'SELECT * FROM abastecimentos WHERE veiculo_id = ? ORDER BY quilometragem ASC',
      [veiculoId]
    );

    if (abastecimentos.length < 2) {
      return res.json({
        consumo_medio_geral: null,
        gasto_mensal: 0,
        gasto_anual: 0,
        preco_medio_litro: abastecimentos.length === 1
          ? parseFloat((abastecimentos[0].valor_total / abastecimentos[0].litros).toFixed(2))
          : null,
        mensagem: 'É necessário pelo menos 2 abastecimentos para calcular o consumo médio.'
      });
    }

    // Consumo médio geral: total de km rodados ÷ total de litros (exceto o primeiro abastecimento, que é só referência)
    const primeiro = abastecimentos[0];
    const ultimo = abastecimentos[abastecimentos.length - 1];
    const kmTotal = ultimo.quilometragem - primeiro.quilometragem;
    const litrosTotal = abastecimentos.slice(1).reduce((soma, a) => soma + parseFloat(a.litros), 0);
    const consumoMedioGeral = litrosTotal > 0 ? (kmTotal / litrosTotal).toFixed(2) : null;

    // Preço médio por litro (histórico completo)
    const valorTotalGasto = abastecimentos.reduce((soma, a) => soma + parseFloat(a.valor_total), 0);
    const litrosTotalGeral = abastecimentos.reduce((soma, a) => soma + parseFloat(a.litros), 0);
    const precoMedioLitro = (valorTotalGasto / litrosTotalGeral).toFixed(2);

    // Gasto do mês atual
    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    const [gastoMensal] = await pool.query(
      `SELECT COALESCE(SUM(valor_total), 0) AS total FROM abastecimentos 
       WHERE veiculo_id = ? AND MONTH(data_abastecimento) = ? AND YEAR(data_abastecimento) = ?`,
      [veiculoId, mesAtual, anoAtual]
    );

    const [gastoAnual] = await pool.query(
      `SELECT COALESCE(SUM(valor_total), 0) AS total FROM abastecimentos 
       WHERE veiculo_id = ? AND YEAR(data_abastecimento) = ?`,
      [veiculoId, anoAtual]
    );

    return res.json({
      consumo_medio_geral: consumoMedioGeral ? parseFloat(consumoMedioGeral) : null,
      preco_medio_litro: parseFloat(precoMedioLitro),
      gasto_mensal: parseFloat(gastoMensal[0].total),
      gasto_anual: parseFloat(gastoAnual[0].total)
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao calcular estatísticas.' });
  }
}

module.exports = { listar, cadastrar, editar, excluir, estatisticas };