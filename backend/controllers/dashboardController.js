const pool = require('../config/database');
const { gerarAlertasDoVeiculo } = require('./alertController');

// Busca o veículo, desde que pertença ao usuário logado. Retorna null se não pertencer
async function buscarVeiculoDoUsuario(veiculoId, usuarioId) {
  const [veiculos] = await pool.query(
    'SELECT * FROM veiculos WHERE id = ? AND usuario_id = ?',
    [veiculoId, usuarioId]
  );
  return veiculos.length > 0 ? veiculos[0] : null;
}

// ===== RESUMO DO DASHBOARD =====
// Monta os dados do painel: indicadores (gasto do mês e do ano, manutenções, consumo médio,
// alertas pendentes) e os dados dos gráficos. Atualiza os alertas antes de contar.
async function resumo(req, res) {
  try {
    const { veiculoId } = req.params;

    const veiculo = await buscarVeiculoDoUsuario(veiculoId, req.usuarioId);
    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    // Garante que os alertas estão atualizados antes de contar
    await gerarAlertasDoVeiculo(veiculoId, veiculo.quilometragem_atual);

    const hoje = new Date();
    const mesAtual = hoje.getMonth() + 1;
    const anoAtual = hoje.getFullYear();

    // --- Indicadores principais ---
    const [gastoMes] = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM gastos 
       WHERE veiculo_id = ? AND MONTH(data_gasto) = ? AND YEAR(data_gasto) = ?`,
      [veiculoId, mesAtual, anoAtual]
    );

    const [gastoAno] = await pool.query(
      `SELECT COALESCE(SUM(valor), 0) AS total FROM gastos 
       WHERE veiculo_id = ? AND YEAR(data_gasto) = ?`,
      [veiculoId, anoAtual]
    );

    const [totalManutencoes] = await pool.query(
      'SELECT COUNT(*) AS total FROM manutencoes WHERE veiculo_id = ?',
      [veiculoId]
    );

    const [alertasPendentes] = await pool.query(
      `SELECT COUNT(*) AS total FROM alertas WHERE veiculo_id = ? AND status = 'Pendente'`,
      [veiculoId]
    );

    // Consumo médio geral (mesma lógica da Parte 6)
    const [abastecimentos] = await pool.query(
      'SELECT * FROM abastecimentos WHERE veiculo_id = ? ORDER BY quilometragem ASC',
      [veiculoId]
    );

    let consumoMedio = null;
    if (abastecimentos.length >= 2) {
      const primeiro = abastecimentos[0];
      const ultimo = abastecimentos[abastecimentos.length - 1];
      const kmTotal = ultimo.quilometragem - primeiro.quilometragem;
      const litrosTotal = abastecimentos.slice(1).reduce((soma, a) => soma + parseFloat(a.litros), 0);
      consumoMedio = litrosTotal > 0 ? parseFloat((kmTotal / litrosTotal).toFixed(2)) : null;
    }

    // --- Dados para gráficos ---
    const [gastosPorCategoria] = await pool.query(
      `SELECT categoria, SUM(valor) AS total FROM gastos 
       WHERE veiculo_id = ? AND YEAR(data_gasto) = ? GROUP BY categoria ORDER BY total DESC`,
      [veiculoId, anoAtual]
    );

    const [gastosMensais] = await pool.query(
      `SELECT DATE_FORMAT(data_gasto, '%Y-%m') AS mes, SUM(valor) AS total
       FROM gastos WHERE veiculo_id = ? AND data_gasto >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(data_gasto, '%Y-%m') ORDER BY mes ASC`,
      [veiculoId]
    );

    // Os 12 abastecimentos mais recentes, em ordem cronológica para o gráfico
    const [consumoAbastecimentos] = await pool.query(
      `SELECT * FROM (
         SELECT data_abastecimento, litros, valor_total, quilometragem
         FROM abastecimentos WHERE veiculo_id = ? ORDER BY data_abastecimento DESC, quilometragem DESC LIMIT 12
       ) AS recentes
       ORDER BY data_abastecimento ASC, quilometragem ASC`,
      [veiculoId]
    );

    const [historicoManutencao] = await pool.query(
      `SELECT tipo_servico, data_servico, quilometragem, valor 
       FROM manutencoes WHERE veiculo_id = ? ORDER BY data_servico DESC LIMIT 10`,
      [veiculoId]
    );

    return res.json({
      veiculo: {
        id: veiculo.id,
        marca: veiculo.marca,
        modelo: veiculo.modelo,
        placa: veiculo.placa,
        quilometragem_atual: veiculo.quilometragem_atual,
        tipo_combustivel: veiculo.tipo_combustivel,
        foto_url: veiculo.foto_url
      },
      indicadores: {
        gasto_mes: parseFloat(gastoMes[0].total),
        gasto_ano: parseFloat(gastoAno[0].total),
        total_manutencoes: totalManutencoes[0].total,
        consumo_medio: consumoMedio,
        alertas_pendentes: alertasPendentes[0].total
      },
      graficos: {
        gastos_por_categoria: gastosPorCategoria,
        gastos_mensais: gastosMensais,
        consumo_abastecimentos: consumoAbastecimentos,
        historico_manutencao: historicoManutencao
      }
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao gerar dashboard.' });
  }
}

module.exports = { resumo };