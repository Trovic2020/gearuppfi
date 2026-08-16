const pool = require('../config/database');

async function buscarVeiculoDoUsuario(veiculoId, usuarioId) {
  const [veiculos] = await pool.query(
    'SELECT * FROM veiculos WHERE id = ? AND usuario_id = ?',
    [veiculoId, usuarioId]
  );
  return veiculos.length > 0 ? veiculos[0] : null;
}

async function calcularSaude(req, res) {
  try {
    const { veiculoId } = req.params;

    const veiculo = await buscarVeiculoDoUsuario(veiculoId, req.usuarioId);
    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    const criterios = [];
    let pontuacaoTotal = 0;

    // ===== 1. SEGURO ATIVO (20 pontos) =====
    const [seguros] = await pool.query(
      `SELECT * FROM seguros WHERE veiculo_id = ? AND ativo = TRUE 
       AND data_vencimento >= CURDATE() ORDER BY data_vencimento DESC LIMIT 1`,
      [veiculoId]
    );
    const temSeguroValido = seguros.length > 0;
    criterios.push({
      criterio: 'Seguro ativo',
      pontos: temSeguroValido ? 20 : 0,
      max: 20,
      detalhe: temSeguroValido ? 'Seguro válido e não vencido.' : 'Sem seguro ativo ou vencido.'
    });
    pontuacaoTotal += temSeguroValido ? 20 : 0;

    // ===== 2. DOCUMENTAÇÃO REGULAR (20 pontos) =====
    const [documentosVencidos] = await pool.query(
      `SELECT COUNT(*) AS total FROM documentos 
       WHERE veiculo_id = ? AND data_vencimento IS NOT NULL AND data_vencimento < CURDATE()`,
      [veiculoId]
    );
    const semDocVencido = documentosVencidos[0].total === 0;
    criterios.push({
      criterio: 'Documentação regular',
      pontos: semDocVencido ? 20 : 0,
      max: 20,
      detalhe: semDocVencido ? 'Nenhum documento vencido.' : `${documentosVencidos[0].total} documento(s) vencido(s).`
    });
    pontuacaoTotal += semDocVencido ? 20 : 0;

    // ===== 3. PNEUS DENTRO DA VIDA ÚTIL (20 pontos) =====
    const [pneus] = await pool.query(
      'SELECT * FROM pneus WHERE veiculo_id = ? AND ativo = TRUE',
      [veiculoId]
    );

    let pneusOk = true;
    let piorPercentual = 0;
    for (const pneu of pneus) {
      const kmRodados = veiculo.quilometragem_atual - pneu.quilometragem_instalacao;
      const percentual = (kmRodados / pneu.vida_util_km) * 100;
      if (percentual > piorPercentual) piorPercentual = percentual;
      if (percentual >= 100) pneusOk = false;
    }
    // Se não tem pneu nenhum cadastrado, não penaliza (considera OK)
    const pontosPneus = pneus.length === 0 ? 20 : (pneusOk ? 20 : 0);
    criterios.push({
      criterio: 'Pneus dentro da vida útil',
      pontos: pontosPneus,
      max: 20,
      detalhe: pneus.length === 0
        ? 'Nenhum pneu cadastrado.'
        : `Pior pneu com ${piorPercentual.toFixed(1)}% da vida útil consumida.`
    });
    pontuacaoTotal += pontosPneus;

    // ===== 4. TROCA DE ÓLEO EM DIA (20 pontos) =====
    const [ultimaTrocaOleo] = await pool.query(
      `SELECT * FROM manutencoes WHERE veiculo_id = ? AND tipo_servico LIKE '%óleo%' 
       ORDER BY data_servico DESC LIMIT 1`,
      [veiculoId]
    );

    let pontosOleo = 0;
    let detalheOleo = 'Nenhuma troca de óleo registrada.';
    if (ultimaTrocaOleo.length > 0) {
      const kmDesdeTroca = veiculo.quilometragem_atual - ultimaTrocaOleo[0].quilometragem;
      const mesesDesdeTroca = (new Date() - new Date(ultimaTrocaOleo[0].data_servico)) / (1000 * 60 * 60 * 24 * 30);

      if (kmDesdeTroca <= 10000 && mesesDesdeTroca <= 12) {
        pontosOleo = 20;
        detalheOleo = `Última troca há ${kmDesdeTroca} km, dentro do intervalo recomendado.`;
      } else {
        detalheOleo = `Última troca há ${kmDesdeTroca} km ou ${mesesDesdeTroca.toFixed(1)} meses — recomenda-se nova troca.`;
      }
    }
    criterios.push({ criterio: 'Troca de óleo em dia', pontos: pontosOleo, max: 20, detalhe: detalheOleo });
    pontuacaoTotal += pontosOleo;

    // ===== 5. MANUTENÇÕES EM DIA (20 pontos) =====
    // Critério: pelo menos uma manutenção registrada nos últimos 6 meses OU nenhuma manutenção pendente crítica
    const [manutencaoRecente] = await pool.query(
      `SELECT COUNT(*) AS total FROM manutencoes 
       WHERE veiculo_id = ? AND data_servico >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)`,
      [veiculoId]
    );
    const manutencaoEmDia = manutencaoRecente[0].total > 0;
    criterios.push({
      criterio: 'Manutenções em dia',
      pontos: manutencaoEmDia ? 20 : 0,
      max: 20,
      detalhe: manutencaoEmDia
        ? 'Manutenção registrada nos últimos 6 meses.'
        : 'Nenhuma manutenção registrada nos últimos 6 meses.'
    });
    pontuacaoTotal += manutencaoEmDia ? 20 : 0;

    // ===== CLASSIFICAÇÃO FINAL =====
    let classificacao = 'Necessita manutenção';
    if (pontuacaoTotal >= 90) classificacao = 'Excelente';
    else if (pontuacaoTotal >= 60) classificacao = 'Atenção';

    return res.json({
      pontuacao: pontuacaoTotal,
      classificacao,
      criterios
    });
  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao calcular saúde do veículo.' });
  }
}

module.exports = { calcularSaude };