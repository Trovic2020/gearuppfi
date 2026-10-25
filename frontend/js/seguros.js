exigirLogin();
renderizarMenuLateral('seguros.html');

const usuario = usuarioLogado();
if (usuario) {
  document.getElementById('nomeUsuarioTopo').textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
}
document.getElementById('btnSair').addEventListener('click', logout);

const veiculo = veiculoSelecionado();

const modal = document.getElementById('modal');
const formItem = document.getElementById('formItem');
const tituloModal = document.getElementById('tituloModal');

// Mapeia o status de vencimento retornado pela API para a classe visual do badge
function classeBadgeStatus(status) {
  if (status === 'Vencido') return 'badge-critico';
  if (status === 'Vence em breve') return 'badge-atencao';
  return 'badge-ok';
}

// ===== CARREGAR LISTA =====
// Busca os seguros e monta a tabela com o status de vencimento. Guarda a lista em cache para a edição
async function carregarLista() {
  try {
    const seguros = await SegurosAPI.listar(veiculo.id);
    const corpo = document.getElementById('corpoTabela');

    if (seguros.length === 0) {
      corpo.innerHTML = `<tr><td colspan="7" class="tabela-vazia">Nenhum seguro registrado ainda.</td></tr>`;
      return;
    }

    corpo.innerHTML = seguros.map(s => `
      <tr>
        <td>${s.seguradora}</td>
        <td>${s.numero_apolice || '-'}</td>
        <td>${formatarData(s.data_contratacao)}</td>
        <td>${formatarData(s.data_vencimento)}</td>
        <td>${formatarMoeda(s.valor)}</td>
        <td><span class="badge ${classeBadgeStatus(s.status)}">${s.status}</span></td>
        <td>
          <div class="tabela-acoes">
            <button class="btn-icone" onclick="editarItem(${s.id})">Editar</button>
            <button class="btn-icone perigo" onclick="excluirItem(${s.id})">Excluir</button>
          </div>
        </td>
      </tr>
    `).join('');

    window._segurosCache = seguros;

  } catch (erro) {
    alert('Erro ao carregar seguros: ' + erro.message);
  }
}

// ===== ABRIR MODAL: NOVO =====
// Limpa o formulário e abre o modal para um novo seguro
document.getElementById('btnNova').addEventListener('click', () => {
  tituloModal.textContent = 'Novo Seguro';
  formItem.reset();
  document.getElementById('itemId').value = '';
  esconderMensagem('mensagemModal');
  modal.classList.remove('oculto');
});

// ===== ABRIR MODAL: EDITAR =====
// Preenche o modal com os dados do seguro escolhido (vindos do cache da lista)
function editarItem(id) {
  const item = window._segurosCache.find(s => s.id === id);
  if (!item) return;

  tituloModal.textContent = 'Editar Seguro';
  document.getElementById('itemId').value = item.id;
  document.getElementById('seguradora').value = item.seguradora;
  document.getElementById('numeroApolice').value = item.numero_apolice || '';
  document.getElementById('dataContratacao').value = formatarDataParaInput(item.data_contratacao);
  document.getElementById('dataVencimento').value = formatarDataParaInput(item.data_vencimento);
  document.getElementById('valor').value = item.valor || '';

  esconderMensagem('mensagemModal');
  modal.classList.remove('oculto');
}

// ===== EXCLUIR =====
// Pede confirmação, exclui e recarrega a lista
async function excluirItem(id) {
  if (!confirm('Tem certeza que deseja excluir este seguro?')) return;

  try {
    await SegurosAPI.excluir(veiculo.id, id);
    carregarLista();
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
// Cadastra (sem id) ou edita (com id) e recarrega a lista
formItem.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  esconderMensagem('mensagemModal');

  const btn = document.getElementById('btnSalvar');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const dados = {
    seguradora: document.getElementById('seguradora').value.trim(),
    numero_apolice: document.getElementById('numeroApolice').value.trim(),
    data_contratacao: document.getElementById('dataContratacao').value,
    data_vencimento: document.getElementById('dataVencimento').value,
    valor: document.getElementById('valor').value || null
  };

  try {
    const id = document.getElementById('itemId').value;

    if (id) {
      await SegurosAPI.editar(veiculo.id, id, dados);
    } else {
      await SegurosAPI.cadastrar(veiculo.id, dados);
    }

    modal.classList.add('oculto');
    carregarLista();
  } catch (erro) {
    mostrarMensagem('mensagemModal', erro.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});

carregarLista();