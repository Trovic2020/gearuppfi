const pool = require('../config/database');
const PDFDocument = require('pdfkit');

async function buscarVeiculoDoUsuario(veiculoId, usuarioId) {
  const [veiculos] = await pool.query(
    'SELECT * FROM veiculos WHERE id = ? AND usuario_id = ?',
    [veiculoId, usuarioId]
  );
  return veiculos.length > 0 ? veiculos[0] : null;
}

function formatarMoeda(valor) {
  return `R$ ${parseFloat(valor || 0).toFixed(2).replace('.', ',')}`;
}

function formatarData(data) {
  if (!data) return '-';
  return new Date(data).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

async function gerarRelatorioCompleto(req, res) {
  try {
    const { veiculoId } = req.params;

    const veiculo = await buscarVeiculoDoUsuario(veiculoId, req.usuarioId);
    if (!veiculo) {
      return res.status(404).json({ erro: 'Veículo não encontrado.' });
    }

    // Busca todos os dados necessários
    const [manutencoes] = await pool.query(
      `SELECT m.*, o.nome AS oficina_nome FROM manutencoes m 
       LEFT JOIN oficinas o ON m.oficina_id = o.id 
       WHERE m.veiculo_id = ? ORDER BY m.data_servico DESC`,
      [veiculoId]
    );

    const [abastecimentos] = await pool.query(
      'SELECT * FROM abastecimentos WHERE veiculo_id = ? ORDER BY data_abastecimento DESC',
      [veiculoId]
    );

    const [gastosPorCategoria] = await pool.query(
      `SELECT categoria, SUM(valor) AS total FROM gastos WHERE veiculo_id = ? GROUP BY categoria ORDER BY total DESC`,
      [veiculoId]
    );

    const [gastoTotal] = await pool.query(
      'SELECT COALESCE(SUM(valor), 0) AS total FROM gastos WHERE veiculo_id = ?',
      [veiculoId]
    );

    const [documentos] = await pool.query('SELECT * FROM documentos WHERE veiculo_id = ?', [veiculoId]);

    const [seguros] = await pool.query(
      'SELECT * FROM seguros WHERE veiculo_id = ? AND ativo = TRUE ORDER BY data_vencimento DESC',
      [veiculoId]
    );

    // ===== MONTA O PDF =====
    const doc = new PDFDocument({ margin: 50 });

    // Configura a resposta HTTP para "baixar" o PDF
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=relatorio-${veiculo.placa}.pdf`);
    doc.pipe(res);

    // --- Cabeçalho ---
    doc.fontSize(20).fillColor('#0C447C').text('GearUp - Relatório do Veículo', { align: 'center' });
    doc.moveDown();
    doc.fontSize(10).fillColor('#666666').text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, { align: 'center' });
    doc.moveDown(2);

    // --- Dados do veículo ---
    doc.fontSize(14).fillColor('#000000').text('Dados do Veículo', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333333');
    doc.text(`Veículo: ${veiculo.marca} ${veiculo.modelo}`);
    doc.text(`Placa: ${veiculo.placa}`);
    doc.text(`Ano: ${veiculo.ano_fabricacao || '-'}/${veiculo.ano_modelo || '-'}`);
    doc.text(`Cor: ${veiculo.cor || '-'}`);
    doc.text(`Quilometragem atual: ${veiculo.quilometragem_atual} km`);
    doc.text(`Combustível: ${veiculo.tipo_combustivel}`);
    doc.moveDown(1.5);

    // --- Situação do seguro ---
    doc.fontSize(14).fillColor('#000000').text('Situação do Seguro', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333333');
    if (seguros.length === 0) {
      doc.text('Nenhum seguro ativo cadastrado.');
    } else {
      seguros.forEach(s => {
        doc.text(`${s.seguradora} — Apólice ${s.numero_apolice || '-'} — Vencimento: ${formatarData(s.data_vencimento)} — ${formatarMoeda(s.valor)}`);
      });
    }
    doc.moveDown(1.5);

    // --- Situação dos documentos ---
    doc.fontSize(14).fillColor('#000000').text('Situação dos Documentos', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333333');
    if (documentos.length === 0) {
      doc.text('Nenhum documento cadastrado.');
    } else {
      documentos.forEach(d => {
        const vencInfo = d.data_vencimento ? ` — Vencimento: ${formatarData(d.data_vencimento)}` : '';
        doc.text(`${d.tipo_documento} — ${d.nome_arquivo}${vencInfo}`);
      });
    }
    doc.moveDown(1.5);

    // --- Gastos totais ---
    doc.fontSize(14).fillColor('#000000').text('Gastos Totais', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333333');
    doc.text(`Total geral: ${formatarMoeda(gastoTotal[0].total)}`);
    doc.moveDown(0.3);
    gastosPorCategoria.forEach(g => {
      doc.text(`  ${g.categoria}: ${formatarMoeda(g.total)}`);
    });
    doc.moveDown(1.5);

    // --- Histórico de manutenções ---
    doc.fontSize(14).fillColor('#000000').text('Histórico de Manutenções', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333333');
    if (manutencoes.length === 0) {
      doc.text('Nenhuma manutenção registrada.');
    } else {
      manutencoes.forEach(m => {
        doc.text(`${formatarData(m.data_servico)} — ${m.tipo_servico} — ${m.quilometragem} km — ${formatarMoeda(m.valor)}${m.oficina_nome ? ' — ' + m.oficina_nome : ''}`);
      });
    }
    doc.moveDown(1.5);

    // --- Histórico de abastecimentos ---
    doc.fontSize(14).fillColor('#000000').text('Histórico de Abastecimentos', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor('#333333');
    if (abastecimentos.length === 0) {
      doc.text('Nenhum abastecimento registrado.');
    } else {
      abastecimentos.forEach(a => {
        doc.text(`${formatarData(a.data_abastecimento)} — ${a.litros}L — ${formatarMoeda(a.valor_total)} — ${a.quilometragem} km${a.posto ? ' — ' + a.posto : ''}`);
      });
    }

    // Finaliza o PDF
    doc.end();

  } catch (erro) {
    console.error(erro);
    return res.status(500).json({ erro: 'Erro ao gerar relatório.' });
  }
}

module.exports = { gerarRelatorioCompleto };