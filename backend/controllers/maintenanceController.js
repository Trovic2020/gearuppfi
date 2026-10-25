const pool = require('../config/database');

// Função auxiliar: confirma que o veículo pertence ao usuário logado
async function veiculoPertenceAoUsuario(veiculoId, usuarioId) {
  const [veiculos] = await pool.query(
    'SELECT id FROM veiculos WHERE id = ? AND usuario_id = ?',
    [veiculoId, usuarioId]
  );
  return veiculos.length > 0;
}

// ===== LISTAR MANUTENÇÕES DE UM VEÍCULO =====
async function listar(req, res) {
  try {
    const { veiculoId } = req.params;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [manutencoes] = await pool.query(
      `SELECT m.*, o.nome AS oficina_nome 
       FROM manutencoes m
       LEFT JOIN oficinas o ON m.oficina_id = o.id
       WHERE m.veiculo_id = ?
       ORDER BY m.data_servico DESC`,
      [veiculoId]
    );

    return res.json(manutencoes);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao listar manutenções.' });
  }
}

// ===== BUSCAR UMA MANUTENÇÃO ESPECÍFICA =====
async function buscarPorId(req, res) {
  try {
    const { veiculoId, id } = req.params;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [manutencoes] = await pool.query(
      `SELECT m.*, o.nome AS oficina_nome 
       FROM manutencoes m
       LEFT JOIN oficinas o ON m.oficina_id = o.id
       WHERE m.id = ? AND m.veiculo_id = ?`,
      [id, veiculoId]
    );

    if (manutencoes.length === 0) {
      return res.status(404).json({ erro: 'Manutenção não encontrada.' });
    }

    return res.json(manutencoes[0]);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao buscar manutenção.' });
  }
}

// ===== CADASTRAR MANUTENÇÃO =====
async function cadastrar(req, res) {
  try {
    const { veiculoId } = req.params;
    const { tipo_servico, data_servico, quilometragem, oficina_id, valor, observacoes } = req.body;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    if (!tipo_servico || !data_servico || quilometragem === undefined) {
      return res.status(400).json({ erro: 'Tipo de serviço, data e quilometragem são obrigatórios.' });
    }

    // Se veio oficina_id, confirma que ela é do usuário
    if (oficina_id) {
      const [oficinas] = await pool.query(
        'SELECT id FROM oficinas WHERE id = ? AND usuario_id = ?',
        [oficina_id, req.usuarioId]
      );
      if (oficinas.length === 0) {
        return res.status(400).json({ erro: 'Oficina inválida.' });
      }
    }

    const [resultado] = await pool.query(
      `INSERT INTO manutencoes (veiculo_id, oficina_id, tipo_servico, data_servico, quilometragem, valor, observacoes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [veiculoId, oficina_id || null, tipo_servico, data_servico, quilometragem, valor || 0, observacoes || null]
    );

    // Se teve valor, lança automaticamente no controle financeiro (gastos)
    if (valor && valor > 0) {
      await pool.query(
        `INSERT INTO gastos (veiculo_id, categoria, descricao, valor, data_gasto, origem_tipo, origem_id)
         VALUES (?, 'Manutenção', ?, ?, ?, 'manutencao', ?)`,
        [veiculoId, tipo_servico, valor, data_servico, resultado.insertId]
      );
    }

    // Atualiza a quilometragem do veículo, se a informada for maior que a atual
    await pool.query(
      'UPDATE veiculos SET quilometragem_atual = ? WHERE id = ? AND quilometragem_atual < ?',
      [quilometragem, veiculoId, quilometragem]
    );

    return res.status(201).json({
      mensagem: 'Manutenção registrada com sucesso!',
      id: resultado.insertId
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao registrar manutenção.' });
  }
}

// ===== EDITAR MANUTENÇÃO =====
async function editar(req, res) {
  try {
    const { veiculoId, id } = req.params;
    const { tipo_servico, data_servico, quilometragem, oficina_id, valor, observacoes } = req.body;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [manutencoes] = await pool.query(
      'SELECT id FROM manutencoes WHERE id = ? AND veiculo_id = ?',
      [id, veiculoId]
    );
    if (manutencoes.length === 0) {
      return res.status(404).json({ erro: 'Manutenção não encontrada.' });
    }

    if (!tipo_servico || !data_servico || quilometragem === undefined) {
      return res.status(400).json({ erro: 'Tipo de serviço, data e quilometragem são obrigatórios.' });
    }

    await pool.query(
      `UPDATE manutencoes SET tipo_servico = ?, data_servico = ?, quilometragem = ?, 
       oficina_id = ?, valor = ?, observacoes = ? WHERE id = ? AND veiculo_id = ?`,
      [tipo_servico, data_servico, quilometragem, oficina_id || null, valor || 0, observacoes || null, id, veiculoId]
    );

    // Mantém o gasto vinculado em sincronia: atualiza, cria (se agora tem valor) ou remove (se zerou)
    if (valor && valor > 0) {
      const [atualizado] = await pool.query(
        `UPDATE gastos SET descricao = ?, valor = ?, data_gasto = ?
         WHERE origem_tipo = 'manutencao' AND origem_id = ?`,
        [tipo_servico, valor, data_servico, id]
      );
      if (atualizado.affectedRows === 0) {
        await pool.query(
          `INSERT INTO gastos (veiculo_id, categoria, descricao, valor, data_gasto, origem_tipo, origem_id)
           VALUES (?, 'Manutenção', ?, ?, ?, 'manutencao', ?)`,
          [veiculoId, tipo_servico, valor, data_servico, id]
        );
      }
    } else {
      await pool.query(`DELETE FROM gastos WHERE origem_tipo = 'manutencao' AND origem_id = ?`, [id]);
    }

    return res.json({ mensagem: 'Manutenção atualizada com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao atualizar manutenção.' });
  }
}

// ===== EXCLUIR MANUTENÇÃO =====
async function excluir(req, res) {
  try {
    const { veiculoId, id } = req.params;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [manutencoes] = await pool.query(
      'SELECT id FROM manutencoes WHERE id = ? AND veiculo_id = ?',
      [id, veiculoId]
    );
    if (manutencoes.length === 0) {
      return res.status(404).json({ erro: 'Manutenção não encontrada.' });
    }

    // Remove também o gasto vinculado (se existir)
    await pool.query(`DELETE FROM gastos WHERE origem_tipo = 'manutencao' AND origem_id = ?`, [id]);
    await pool.query('DELETE FROM manutencoes WHERE id = ? AND veiculo_id = ?', [id, veiculoId]);

    return res.json({ mensagem: 'Manutenção removida com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao remover manutenção.' });
  }
}

module.exports = { listar, buscarPorId, cadastrar, editar, excluir };