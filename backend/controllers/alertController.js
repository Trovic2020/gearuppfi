const pool = require('../config/database');

async function veiculoPertenceAoUsuario(veiculoId, usuarioId) {
  const [veiculos] = await pool.query(
    'SELECT id, quilometragem_atual FROM veiculos WHERE id = ? AND usuario_id = ?',
    [veiculoId, usuarioId]
  );
  return veiculos.length > 0 ? veiculos[0] : null;
}

// ===== GERA/ATUALIZA ALERTAS DE UM VEÍCULO (chamada interna, reutilizável) =====
async function gerarAlertasDoVeiculo(veiculoId, quilometragemAtual) {
  // --- PNEUS ---
  const [pneus] = await pool.query(
    'SELECT * FROM pneus WHERE veiculo_id = ? AND ativo = TRUE',
    [veiculoId]
  );

  for (const pneu of pneus) {
    const kmRodados = quilometragemAtual - pneu.quilometragem_instalacao;
    const percentual = (kmRodados / pneu.vida_util_km) * 100;

    if (percentual >= 80) {
      const titulo = percentual >= 100
        ? `Pneu ${pneu.marca} (${pneu.posicao}) precisa ser trocado`
        : `Pneu ${pneu.marca} (${pneu.posicao}) está próximo do fim da vida útil`;

      // Verifica se já existe um alerta pendente para esse pneu, pra não duplicar
      const [existente] = await pool.query(
        `SELECT id FROM alertas WHERE veiculo_id = ? AND origem_tipo = 'pneu' AND origem_id = ? AND status = 'Pendente'`,
        [veiculoId, pneu.id]
      );

      if (existente.length === 0) {
        await pool.query(
          `INSERT INTO alertas (veiculo_id, tipo_alerta, titulo, descricao, data_referencia, origem_tipo, origem_id)
           VALUES (?, 'Pneus', ?, ?, CURDATE(), 'pneu', ?)`,
          [veiculoId, titulo, `${percentual.toFixed(1)}% da vida útil consumida.`, pneu.id]
        );
      } else {
        // Atualiza a descrição do alerta existente
        await pool.query(
          'UPDATE alertas SET titulo = ?, descricao = ? WHERE id = ?',
          [titulo, `${percentual.toFixed(1)}% da vida útil consumida.`, existente[0].id]
        );
      }
    }
  }

  // --- SEGUROS ---
  const [seguros] = await pool.query(
    'SELECT * FROM seguros WHERE veiculo_id = ? AND ativo = TRUE',
    [veiculoId]
  );

  for (const seguro of seguros) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(seguro.data_vencimento);
    vencimento.setHours(0, 0, 0, 0);
    const diasRestantes = Math.round((vencimento - hoje) / (1000 * 60 * 60 * 24));

    if (diasRestantes <= 30) {
      const titulo = diasRestantes < 0
        ? `Seguro ${seguro.seguradora} está vencido`
        : `Seguro ${seguro.seguradora} vence em ${diasRestantes} dia(s)`;

      const [existente] = await pool.query(
        `SELECT id FROM alertas WHERE veiculo_id = ? AND origem_tipo = 'seguro' AND origem_id = ? AND status = 'Pendente'`,
        [veiculoId, seguro.id]
      );

      if (existente.length === 0) {
        await pool.query(
          `INSERT INTO alertas (veiculo_id, tipo_alerta, titulo, descricao, data_referencia, origem_tipo, origem_id)
           VALUES (?, 'Seguro', ?, ?, ?, 'seguro', ?)`,
          [veiculoId, titulo, `Vencimento em ${seguro.data_vencimento}`, seguro.data_vencimento, seguro.id]
        );
      } else {
        await pool.query('UPDATE alertas SET titulo = ? WHERE id = ?', [titulo, existente[0].id]);
      }
    }
  }

  // --- DOCUMENTOS COM VENCIMENTO ---
  const [documentos] = await pool.query(
    'SELECT * FROM documentos WHERE veiculo_id = ? AND data_vencimento IS NOT NULL',
    [veiculoId]
  );

  for (const doc of documentos) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);
    const vencimento = new Date(doc.data_vencimento);
    vencimento.setHours(0, 0, 0, 0);
    const diasRestantes = Math.round((vencimento - hoje) / (1000 * 60 * 60 * 24));

    if (diasRestantes <= 30) {
      const titulo = diasRestantes < 0
        ? `Documento ${doc.tipo_documento} está vencido`
        : `Documento ${doc.tipo_documento} vence em ${diasRestantes} dia(s)`;

      const [existente] = await pool.query(
        `SELECT id FROM alertas WHERE veiculo_id = ? AND origem_tipo = 'documento' AND origem_id = ? AND status = 'Pendente'`,
        [veiculoId, doc.id]
      );

      if (existente.length === 0) {
        await pool.query(
          `INSERT INTO alertas (veiculo_id, tipo_alerta, titulo, descricao, data_referencia, origem_tipo, origem_id)
           VALUES (?, 'Documento', ?, ?, ?, 'documento', ?)`,
          [veiculoId, titulo, `Vencimento em ${doc.data_vencimento}`, doc.data_vencimento, doc.id]
        );
      } else {
        await pool.query('UPDATE alertas SET titulo = ? WHERE id = ?', [titulo, existente[0].id]);
      }
    }
  }
}

// ===== LISTAR ALERTAS (gera antes de listar, pra estar sempre atualizado) =====
async function listar(req, res) {
  try {
    const { veiculoId } = req.params;
    const { status } = req.query;

    const veiculo = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    await gerarAlertasDoVeiculo(veiculoId, veiculo.quilometragem_atual);

    let sql = 'SELECT * FROM alertas WHERE veiculo_id = ?';
    const params = [veiculoId];

    if (status) {
      sql += ' AND status = ?';
      params.push(status);
    }

    sql += ' ORDER BY criado_em DESC';

    const [alertas] = await pool.query(sql, params);
    return res.json(alertas);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao listar alertas.' });
  }
}

// ===== MARCAR ALERTA COMO RESOLVIDO OU IGNORADO =====
async function atualizarStatus(req, res) {
  try {
    const { veiculoId, id } = req.params;
    const { status } = req.body;

    const veiculo = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    if (!['Pendente', 'Resolvido', 'Ignorado'].includes(status)) {
      return res.status(400).json({ erro: 'Status inválido.' });
    }

    const [alertas] = await pool.query('SELECT id FROM alertas WHERE id = ? AND veiculo_id = ?', [id, veiculoId]);
    if (alertas.length === 0) {
      return res.status(404).json({ erro: 'Alerta não encontrado.' });
    }

    await pool.query('UPDATE alertas SET status = ? WHERE id = ? AND veiculo_id = ?', [status, id, veiculoId]);

    return res.json({ mensagem: 'Status do alerta atualizado com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao atualizar status do alerta.' });
  }
}

module.exports = { listar, atualizarStatus, gerarAlertasDoVeiculo };