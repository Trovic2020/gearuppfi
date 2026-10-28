const pool = require('../config/database');

// Confere se o veículo pertence ao usuário logado (true/false)
async function veiculoPertenceAoUsuario(veiculoId, usuarioId) {
  const [veiculos] = await pool.query(
    'SELECT id FROM veiculos WHERE id = ? AND usuario_id = ?',
    [veiculoId, usuarioId]
  );
  return veiculos.length > 0;
}

// ===== LISTAR GASTOS DE UM VEÍCULO (com filtros opcionais) =====
// Filtros opcionais na query string: ?categoria=, ?mes= e ?ano=
async function listar(req, res) {
  try {
    const { veiculoId } = req.params;
    const { categoria, mes, ano } = req.query;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    let sql = 'SELECT * FROM gastos WHERE veiculo_id = ?';
    const params = [veiculoId];

    if (categoria) {
      sql += ' AND categoria = ?';
      params.push(categoria);
    }
    if (mes) {
      sql += ' AND MONTH(data_gasto) = ?';
      params.push(mes);
    }
    if (ano) {
      sql += ' AND YEAR(data_gasto) = ?';
      params.push(ano);
    }

    sql += ' ORDER BY data_gasto DESC';

    const [gastos] = await pool.query(sql, params);
    return res.json(gastos);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao listar gastos.' });
  }
}

// ===== LANÇAR GASTO MANUAL =====
// Cria um gasto com origem_tipo = 'manual' (os automáticos vêm de abastecimento, manutenção e seguro)
async function cadastrar(req, res) {
  try {
    const { veiculoId } = req.params;
    const { categoria, descricao, valor, data_gasto } = req.body;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const categoriasValidas = ['Combustível', 'Manutenção', 'Seguro', 'Pneus', 'Documentação', 'Outros'];
    if (!categoria || !categoriasValidas.includes(categoria)) {
      return res.status(400).json({ erro: 'Categoria inválida.' });
    }
    if (!valor || valor <= 0 || !data_gasto) {
      return res.status(400).json({ erro: 'Valor e data são obrigatórios.' });
    }

    const [resultado] = await pool.query(
      `INSERT INTO gastos (veiculo_id, categoria, descricao, valor, data_gasto, origem_tipo)
       VALUES (?, ?, ?, ?, ?, 'manual')`,
      [veiculoId, categoria, descricao || null, valor, data_gasto]
    );

    return res.status(201).json({
      mensagem: 'Gasto registrado com sucesso!',
      id: resultado.insertId
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao registrar gasto.' });
  }
}

// ===== EXCLUIR GASTO (somente os lançados manualmente) =====
// Gastos automáticos só podem ser excluídos na tela de origem (abastecimento, manutenção ou seguro)
async function excluir(req, res) {
  try {
    const { veiculoId, id } = req.params;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [gastos] = await pool.query('SELECT * FROM gastos WHERE id = ? AND veiculo_id = ?', [id, veiculoId]);
    if (gastos.length === 0) {
      return res.status(404).json({ erro: 'Gasto não encontrado.' });
    }

    if (gastos[0].origem_tipo !== 'manual') {
      return res.status(400).json({
        erro: `Este gasto foi gerado automaticamente por um registro de ${gastos[0].origem_tipo}. Exclua-o na tela correspondente.`
      });
    }

    await pool.query('DELETE FROM gastos WHERE id = ? AND veiculo_id = ?', [id, veiculoId]);

    return res.json({ mensagem: 'Gasto removido com sucesso!' });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao remover gasto.' });
  }
}

// ===== RESUMO: GASTOS POR CATEGORIA =====
// Soma e conta os gastos de cada categoria (filtro opcional ?ano=). Usado no gráfico de pizza
async function resumoPorCategoria(req, res) {
  try {
    const { veiculoId } = req.params;
    const { ano } = req.query;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    let sql = `SELECT categoria, SUM(valor) AS total, COUNT(*) AS quantidade 
               FROM gastos WHERE veiculo_id = ?`;
    const params = [veiculoId];

    if (ano) {
      sql += ' AND YEAR(data_gasto) = ?';
      params.push(ano);
    }

    sql += ' GROUP BY categoria ORDER BY total DESC';

    const [resumo] = await pool.query(sql, params);
    return res.json(resumo);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao gerar resumo por categoria.' });
  }
}

// ===== RESUMO: GASTOS MENSAIS (últimos 12 meses) =====
// Soma os gastos de cada mês. Usado no gráfico de barras
async function resumoMensal(req, res) {
  try {
    const { veiculoId } = req.params;

    const pertence = await veiculoPertenceAoUsuario(veiculoId, req.usuarioId);
    if (!pertence) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const [resumo] = await pool.query(
      `SELECT DATE_FORMAT(data_gasto, '%Y-%m') AS mes, SUM(valor) AS total
       FROM gastos 
       WHERE veiculo_id = ? AND data_gasto >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(data_gasto, '%Y-%m')
       ORDER BY mes ASC`,
      [veiculoId]
    );

    return res.json(resumo);
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao gerar resumo mensal.' });
  }
}

module.exports = { listar, cadastrar, excluir, resumoPorCategoria, resumoMensal };