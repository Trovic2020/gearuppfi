exigirLogin();
renderizarMenuLateral('dashboard.html');

const usuario = usuarioLogado();
if (usuario) {
  document.getElementById('nomeUsuarioTopo').textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
}
document.getElementById('btnSair').addEventListener('click', logout);

const veiculo = veiculoSelecionado();

// Paleta de cores fixa para os gráficos (categoria de gastos)
const CORES_CATEGORIA = {
  'Combustível': '#2563EB',
  'Manutenção': '#7C3AED',
  'Seguro': '#16A34A',
  'Pneus': '#D97706',
  'Documentação': '#DB2777',
  'Outros': '#94A3B8'
};

async function carregarDashboard() {
  try {
    const dados = await DashboardAPI.resumo(veiculo.id);

    // ===== INDICADORES =====
    document.getElementById('grid-indicadores').innerHTML = `
      <div class="card-indicador">
        <span class="rotulo">Gasto no mês</span>
        <span class="valor">${formatarMoeda(dados.indicadores.gasto_mes)}</span>
      </div>
      <div class="card-indicador">
        <span class="rotulo">Gasto no ano</span>
        <span class="valor">${formatarMoeda(dados.indicadores.gasto_ano)}</span>
      </div>
      <div class="card-indicador">
        <span class="rotulo">Manutenções</span>
        <span class="valor">${dados.indicadores.total_manutencoes}</span>
      </div>
      <div class="card-indicador">
        <span class="rotulo">Consumo médio</span>
        <span class="valor">${dados.indicadores.consumo_medio ? dados.indicadores.consumo_medio + ' km/l' : '-'}</span>
      </div>
      <div class="card-indicador ${dados.indicadores.alertas_pendentes > 0 ? 'alerta' : ''}">
        <span class="rotulo">Alertas pendentes</span>
        <span class="valor">${dados.indicadores.alertas_pendentes}</span>
      </div>
    `;

    // ===== GRÁFICO DE PIZZA: GASTOS POR CATEGORIA =====
    renderizarGraficoPizza(dados.graficos.gastos_por_categoria);

    // ===== GRÁFICO DE BARRAS: GASTOS MENSAIS =====
    renderizarGraficoBarras(dados.graficos.gastos_mensais);

    // ===== LISTA: MANUTENÇÕES RECENTES =====
    renderizarListaManutencao(dados.graficos.historico_manutencao);

    // ===== GRÁFICO: CONSUMO DE COMBUSTÍVEL =====
    renderizarGraficoConsumo(dados.graficos.consumo_abastecimentos);

  } catch (erro) {
    alert('Erro ao carregar dashboard: ' + erro.message);
  }
}

function renderizarGraficoPizza(categorias) {
  const container = document.getElementById('graficoCategoria');

  if (categorias.length === 0) {
    container.innerHTML = '<p class="card-grafico-vazio">Nenhum gasto registrado ainda.</p>';
    return;
  }

  const total = categorias.reduce((soma, c) => soma + parseFloat(c.total), 0);

  // Monta o conic-gradient dinamicamente
  let acumulado = 0;
  const fatias = categorias.map(c => {
    const percentual = (parseFloat(c.total) / total) * 100;
    const cor = CORES_CATEGORIA[c.categoria] || '#94A3B8';
    const inicio = acumulado;
    acumulado += percentual;
    return `${cor} ${inicio}% ${acumulado}%`;
  }).join(', ');

  container.innerHTML = `
    <div class="grafico-pizza-container">
      <div class="grafico-pizza" style="background: conic-gradient(${fatias});"></div>
      <div class="legenda-pizza">
        ${categorias.map(c => `
          <div class="legenda-item">
            <span class="legenda-cor" style="background-color: ${CORES_CATEGORIA[c.categoria] || '#94A3B8'};"></span>
            ${c.categoria}
            <span class="valor-legenda">${formatarMoeda(c.total)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderizarGraficoBarras(gastosMensais) {
  const container = document.getElementById('graficoMensal');

  if (gastosMensais.length === 0) {
    container.innerHTML = '<p class="card-grafico-vazio">Nenhum gasto registrado ainda.</p>';
    return;
  }

  const maiorValor = Math.max(...gastosMensais.map(g => parseFloat(g.total)));

  const nomesMeses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  container.innerHTML = `
    <div class="grafico-barras">
      ${gastosMensais.map(g => {
        const [ano, mes] = g.mes.split('-');
        const altura = maiorValor > 0 ? (parseFloat(g.total) / maiorValor) * 100 : 0;
        return `
          <div class="barra-item">
            <span class="barra-valor">${formatarMoeda(g.total)}</span>
            <div class="barra" style="height: ${altura}%;"></div>
            <span class="barra-rotulo">${nomesMeses[parseInt(mes) - 1]}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderizarListaManutencao(manutencoes) {
  const container = document.getElementById('listaManutencaoRecente');

  if (manutencoes.length === 0) {
    container.innerHTML = '<p class="card-grafico-vazio">Nenhuma manutenção registrada ainda.</p>';
    return;
  }

  container.innerHTML = `
    <div class="lista-recente">
      ${manutencoes.map(m => `
        <div class="item-lista">
          <div>
            <div class="item-lista-titulo">${m.tipo_servico}</div>
            <div class="item-lista-sub">${formatarData(m.data_servico)} • ${formatarKm(m.quilometragem)}</div>
          </div>
          <div class="item-lista-valor">${formatarMoeda(m.valor)}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function renderizarGraficoConsumo(abastecimentos) {
  const container = document.getElementById('graficoConsumo');

  if (abastecimentos.length < 2) {
    container.innerHTML = '<p class="card-grafico-vazio">Cadastre pelo menos 2 abastecimentos para ver o consumo.</p>';
    return;
  }

  // Calcula consumo entre cada par de abastecimentos consecutivos
  const consumos = [];
  for (let i = 1; i < abastecimentos.length; i++) {
    const kmRodados = abastecimentos[i].quilometragem - abastecimentos[i - 1].quilometragem;
    const litros = parseFloat(abastecimentos[i].litros);
    const consumo = litros > 0 ? kmRodados / litros : 0;
    consumos.push({
      data: abastecimentos[i].data_abastecimento,
      consumo: consumo.toFixed(1)
    });
  }

  const maiorConsumo = Math.max(...consumos.map(c => parseFloat(c.consumo)));

  container.innerHTML = `
    <div class="grafico-barras">
      ${consumos.map(c => {
        const altura = maiorConsumo > 0 ? (parseFloat(c.consumo) / maiorConsumo) * 100 : 0;
        return `
          <div class="barra-item">
            <span class="barra-valor">${c.consumo} km/l</span>
            <div class="barra" style="height: ${altura}%;"></div>
            <span class="barra-rotulo">${formatarData(c.data).slice(0, 5)}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ===== BAIXAR RELATÓRIO PDF =====
document.getElementById('btnBaixarRelatorio').addEventListener('click', async () => {
  try {
    await RelatoriosAPI.baixarCompleto(veiculo.id);
  } catch (erro) {
    alert('Erro ao gerar relatório: ' + erro.message);
  }
});

carregarDashboard();