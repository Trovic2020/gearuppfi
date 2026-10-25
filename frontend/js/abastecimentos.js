exigirLogin();
renderizarMenuLateral('abastecimentos.html');

const usuario = usuarioLogado();
if (usuario) {
  document.getElementById('nomeUsuarioTopo').textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
}
document.getElementById('btnSair').addEventListener('click', logout);

const veiculo = veiculoSelecionado();

const modal = document.getElementById('modal');
const formItem = document.getElementById('formItem');
const tituloModal = document.getElementById('tituloModal');

// ===== CARREGAR INDICADORES (estatísticas) =====
// Busca as estatísticas e preenche os cards de consumo médio, preço do litro e gastos
async function carregarIndicadores() {
  try {
    const stats = await AbastecimentosAPI.estatisticas(veiculo.id);

    document.getElementById('grid-indicadores').innerHTML = `
      <div class="card-indicador">
        <span class="rotulo">Consumo médio</span>
        <span class="valor">${stats.consumo_medio_geral ? stats.consumo_medio_geral + ' km/l' : '-'}</span>
      </div>
      <div class="card-indicador">
        <span class="rotulo">Preço médio/litro</span>
        <span class="valor">${stats.preco_medio_litro ? formatarMoeda(stats.preco_medio_litro) : '-'}</span>
      </div>
      <div class="card-indicador">
        <span class="rotulo">Gasto no mês</span>
        <span class="valor">${formatarMoeda(stats.gasto_mensal)}</span>
      </div>
      <div class="card-indicador">
        <span class="rotulo">Gasto no ano</span>
        <span class="valor">${formatarMoeda(stats.gasto_anual)}</span>
      </div>
    `;
  } catch (erro) {
    console.error('Erro ao carregar indicadores:', erro);
  }
}

// ===== CARREGAR LISTA =====
// Busca os abastecimentos e monta a tabela. Guarda a lista em cache para a edição
async function carregarLista() {
  try {
    const abastecimentos = await AbastecimentosAPI.listar(veiculo.id);
    const corpo = document.getElementById('corpoTabela');

    if (abastecimentos.length === 0) {
      corpo.innerHTML = `<tr><td colspan="7" class="tabela-vazia">Nenhum abastecimento registrado ainda.</td></tr>`;
      return;
    }

    corpo.innerHTML = abastecimentos.map(a => `
      <tr>
        <td>${formatarData(a.data_abastecimento)}</td>
        <td>${a.posto || '-'}</td>
        <td>${parseFloat(a.litros).toFixed(2)} L</td>
        <td>${formatarMoeda(a.valor_total)}</td>
        <td>${formatarKm(a.quilometragem)}</td>
        <td>${a.consumo_medio ? a.consumo_medio + ' km/l' : '-'}</td>
        <td>
          <div class="tabela-acoes">
            <button class="btn-icone" onclick="editarItem(${a.id})">Editar</button>
            <button class="btn-icone perigo" onclick="excluirItem(${a.id})">Excluir</button>
          </div>
        </td>
      </tr>
    `).join('');

    window._abastecimentosCache = abastecimentos;

  } catch (erro) {
    alert('Erro ao carregar abastecimentos: ' + erro.message);
  }
}

// ===== ABRIR MODAL: NOVO =====
// Limpa o formulário e abre o modal para um novo abastecimento
document.getElementById('btnNova').addEventListener('click', () => {
  tituloModal.textContent = 'Novo Abastecimento';
  formItem.reset();
  document.getElementById('itemId').value = '';
  document.getElementById('tanqueCheio').checked = true;
  esconderMensagem('mensagemModal');
  modal.classList.remove('oculto');
});

// ===== ABRIR MODAL: EDITAR =====
// Preenche o modal com os dados do abastecimento escolhido (vindos do cache da lista)
function editarItem(id) {
  const item = window._abastecimentosCache.find(a => a.id === id);
  if (!item) return;

  tituloModal.textContent = 'Editar Abastecimento';
  document.getElementById('itemId').value = item.id;
  document.getElementById('dataAbastecimento').value = formatarDataParaInput(item.data_abastecimento);
  document.getElementById('posto').value = item.posto || '';
  document.getElementById('tipoCombustivel').value = item.tipo_combustivel;
  document.getElementById('litros').value = item.litros;
  document.getElementById('valorTotal').value = item.valor_total;
  document.getElementById('quilometragem').value = item.quilometragem;
  document.getElementById('tanqueCheio').checked = !!item.tanque_cheio;

  esconderMensagem('mensagemModal');
  modal.classList.remove('oculto');
}

// ===== EXCLUIR =====
// Pede confirmação, exclui e recarrega a lista e os indicadores
async function excluirItem(id) {
  if (!confirm('Tem certeza que deseja excluir este abastecimento?')) return;

  try {
    await AbastecimentosAPI.excluir(veiculo.id, id);
    carregarLista();
    carregarIndicadores();
  } catch (erro) {
    alert('Erro ao excluir: ' + erro.message);
  }
}

// ===== FECHAR MODAL =====
// Fecha o modal sem salvar
document.getElementById('btnCancelar').addEventListener('click', () => {
  modal.classList.add('oculto');
});

// ===== SALVAR =====
// Cadastra (sem id) ou edita (com id) e recarrega a lista e os indicadores
formItem.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  esconderMensagem('mensagemModal');

  const btn = document.getElementById('btnSalvar');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const dados = {
    data_abastecimento: document.getElementById('dataAbastecimento').value,
    posto: document.getElementById('posto').value.trim(),
    tipo_combustivel: document.getElementById('tipoCombustivel').value,
    litros: document.getElementById('litros').value,
    valor_total: document.getElementById('valorTotal').value,
    quilometragem: document.getElementById('quilometragem').value,
    tanque_cheio: document.getElementById('tanqueCheio').checked
  };

  try {
    const id = document.getElementById('itemId').value;

    if (id) {
      await AbastecimentosAPI.editar(veiculo.id, id, dados);
    } else {
      await AbastecimentosAPI.cadastrar(veiculo.id, dados);
    }

    modal.classList.add('oculto');
    carregarLista();
    carregarIndicadores();
  } catch (erro) {
    mostrarMensagem('mensagemModal', erro.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

carregarLista();
carregarIndicadores();