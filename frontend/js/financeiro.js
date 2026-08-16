exigirLogin();
renderizarMenuLateral('financeiro.html');

const usuario = usuarioLogado();
if (usuario) {
  document.getElementById('nomeUsuarioTopo').textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
}
document.getElementById('btnSair').addEventListener('click', logout);

const veiculo = veiculoSelecionado();

const modal = document.getElementById('modal');
const formItem = document.getElementById('formItem');

const CORES_CATEGORIA = {
  'Combustível': '#4A90D9',
  'Manutenção': '#0C447C',
  'Seguro': '#2E9E5B',
  'Pneus': '#E0A32A',
  'Documentação': '#8B5CF6',
  'Outros': '#9CA3AF'
};

const ORIGEM_LABEL = {
  'manual': 'Lançamento manual',
  'manutencao': 'Manutenção',
  'abastecimento': 'Abastecimento',
  'seguro': 'Seguro',
  'pneu': 'Pneu',
  'documento': 'Documento'
};

// ===== CARREGAR GRÁFICOS =====
async function carregarGraficos() {
  try {
    const categorias = await GastosAPI.resumoPorCategoria(veiculo.id);
    const mensal = await GastosAPI.resumoMensal(veiculo.id);

    renderizarGraficoPizza(categorias);
    renderizarGraficoBarras(mensal);
  } catch (erro) {
    console.error('Erro ao carregar gráficos:', erro);
  }
}

function renderizarGraficoPizza(categorias) {
  const container = document.getElementById('graficoCategoria');

  if (categorias.length === 0) {
    container.innerHTML = '<p class="card-grafico-vazio">Nenhum gasto registrado ainda.</p>';
    return;
  }

  const total = categorias.reduce((soma, c) => soma + parseFloat(c.total), 0);
  let acumulado = 0;
  const fatias = categorias.map(c => {
    const percentual = (parseFloat(c.total) / total) * 100;
    const cor = CORES_CATEGORIA[c.categoria] || '#9CA3AF';
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
            <span class="legenda-cor" style="background-color: ${CORES_CATEGORIA[c.categoria] || '#9CA3AF'};"></span>
            ${c.categoria} (${c.quantidade})
            <span class="valor-legenda">${formatarMoeda(c.total)}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function renderizarGraficoBarras(mensal) {
  const container = document.getElementById('graficoMensal');

  if (mensal.length === 0) {
    container.innerHTML = '<p class="card-grafico-vazio">Nenhum gasto registrado ainda.</p>';
    return;
  }

  const maiorValor = Math.max(...mensal.map(m => parseFloat(m.total)));
  const nomesMeses = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

  container.innerHTML = `
    <div class="grafico-barras">
      ${mensal.map(m => {
        const [ano, mes] = m.mes.split('-');
        const altura = maiorValor > 0 ? (parseFloat(m.total) / maiorValor) * 100 : 0;
        return `
          <div class="barra-item">
            <span class="barra-valor">${formatarMoeda(m.total)}</span>
            <div class="barra" style="height: ${altura}%;"></div>
            <span class="barra-rotulo">${nomesMeses[parseInt(mes) - 1]}</span>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

// ===== CARREGAR LISTA DE GASTOS =====
async function carregarLista() {
  try {
    const categoriaFiltro = document.getElementById('filtroCategoria').value;
    const query = categoriaFiltro ? `?categoria=${encodeURIComponent(categoriaFiltro)}` : '';

    const gastos = await GastosAPI.listar(veiculo.id, query);
    const corpo = document.getElementById('corpoTabela');

    if (gastos.length === 0) {
      corpo.innerHTML = `<tr><td colspan="6" class="tabela-vazia">Nenhum gasto encontrado.</td></tr>`;
      return;
    }

    corpo.innerHTML = gastos.map(g => `
      <tr>
        <td>${formatarData(g.data_gasto)}</td>
        <td>${g.categoria}</td>
        <td>${g.descricao || '-'}</td>
        <td>${ORIGEM_LABEL[g.origem_tipo] || g.origem_tipo}</td>
        <td>${formatarMoeda(g.valor)}</td>
        <td>
          ${g.origem_tipo === 'manual' ? `<div class="tabela-acoes"><button class="btn-icone perigo" onclick="excluirItem(${g.id})">Excluir</button></div>` : '-'}
        </td>
      </tr>
    `).join('');

  } catch (erro) {
    alert('Erro ao carregar gastos: ' + erro.message);
  }
}

document.getElementById('filtroCategoria').addEventListener('change', carregarLista);

// ===== EXCLUIR (só manuais) =====
async function excluirItem(id) {
  if (!confirm('Tem certeza que deseja excluir este lançamento?')) return;

  try {
    await GastosAPI.excluir(veiculo.id, id);
    carregarLista();
    carregarGraficos();
  } catch (erro) {
    alert('Erro ao excluir: ' + erro.message);
  }
}

// ===== ABRIR/FECHAR MODAL =====
document.getElementById('btnNova').addEventListener('click', () => {
  formItem.reset();
  esconderMensagem('mensagemModal');
  modal.classList.remove('oculto');
});

document.getElementById('btnCancelar').addEventListener('click', () => {
  modal.classList.add('oculto');
});

// ===== SALVAR GASTO MANUAL =====
formItem.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  esconderMensagem('mensagemModal');

  const btn = document.getElementById('btnSalvar');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const dados = {
    categoria: document.getElementById('categoria').value,
    descricao: document.getElementById('descricao').value.trim(),
    valor: document.getElementById('valor').value,
    data_gasto: document.getElementById('dataGasto').value
  };

  try {
    await GastosAPI.cadastrar(veiculo.id, dados);
    modal.classList.add('oculto');
    carregarLista();
    carregarGraficos();
  } catch (erro) {
    mostrarMensagem('mensagemModal', erro.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

carregarLista();
carregarGraficos();