exigirLogin();
renderizarMenuLateral('pneus.html');

const usuario = usuarioLogado();
if (usuario) {
  document.getElementById('nomeUsuarioTopo').textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
}
document.getElementById('btnSair').addEventListener('click', logout);

const veiculo = veiculoSelecionado();

const modal = document.getElementById('modal');
const formItem = document.getElementById('formItem');
const tituloModal = document.getElementById('tituloModal');

// Mapeia o status retornado pela API para a classe visual do badge
function classeBadgeStatus(status) {
  if (status === 'Trocar') return 'badge-critico';
  if (status === 'Atenção') return 'badge-atencao';
  return 'badge-ok';
}

// ===== CARREGAR LISTA =====
async function carregarLista() {
  try {
    const pneus = await PneusAPI.listar(veiculo.id);
    const corpo = document.getElementById('corpoTabela');

    if (pneus.length === 0) {
      corpo.innerHTML = `<tr><td colspan="6" class="tabela-vazia">Nenhum pneu registrado ainda.</td></tr>`;
      return;
    }

    corpo.innerHTML = pneus.map(p => `
      <tr>
        <td>${p.marca}${p.modelo ? ' ' + p.modelo : ''}</td>
        <td>${p.posicao}</td>
        <td>${formatarData(p.data_instalacao)}</td>
        <td>${p.percentual_usado}% (${formatarKm(p.km_restante)} restantes)</td>
        <td><span class="badge ${classeBadgeStatus(p.status)}">${p.status}</span></td>
        <td>
          <div class="tabela-acoes">
            <button class="btn-icone" onclick="editarItem(${p.id})">Editar</button>
            <button class="btn-icone perigo" onclick="excluirItem(${p.id})">Excluir</button>
          </div>
        </td>
      </tr>
    `).join('');

    window._pneusCache = pneus;

  } catch (erro) {
    alert('Erro ao carregar pneus: ' + erro.message);
  }
}

// ===== ABRIR MODAL: NOVO =====
document.getElementById('btnNova').addEventListener('click', () => {
  tituloModal.textContent = 'Novo Pneu';
  formItem.reset();
  document.getElementById('itemId').value = '';
  esconderMensagem('mensagemModal');
  modal.classList.remove('oculto');
});

// ===== ABRIR MODAL: EDITAR =====
function editarItem(id) {
  const item = window._pneusCache.find(p => p.id === id);
  if (!item) return;

  tituloModal.textContent = 'Editar Pneu';
  document.getElementById('itemId').value = item.id;
  document.getElementById('marca').value = item.marca;
  document.getElementById('modelo').value = item.modelo || '';
  document.getElementById('posicao').value = item.posicao;
  document.getElementById('dataInstalacao').value = formatarDataParaInput(item.data_instalacao);
  document.getElementById('quilometragemInstalacao').value = item.quilometragem_instalacao;
  document.getElementById('vidaUtilKm').value = item.vida_util_km;
  document.getElementById('observacoes').value = item.observacoes || '';

  esconderMensagem('mensagemModal');
  modal.classList.remove('oculto');
}

// ===== EXCLUIR =====
async function excluirItem(id) {
  if (!confirm('Tem certeza que deseja excluir este pneu?')) return;

  try {
    await PneusAPI.excluir(veiculo.id, id);
    carregarLista();
  } catch (erro) {
    alert('Erro ao excluir: ' + erro.message);
  }
}

// ===== FECHAR MODAL =====
document.getElementById('btnCancelar').addEventListener('click', () => {
  modal.classList.add('oculto');
});

// ===== SALVAR =====
formItem.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  esconderMensagem('mensagemModal');

  const btn = document.getElementById('btnSalvar');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const dados = {
    marca: document.getElementById('marca').value.trim(),
    modelo: document.getElementById('modelo').value.trim(),
    posicao: document.getElementById('posicao').value,
    data_instalacao: document.getElementById('dataInstalacao').value,
    quilometragem_instalacao: document.getElementById('quilometragemInstalacao').value,
    vida_util_km: document.getElementById('vidaUtilKm').value || 50000,
    observacoes: document.getElementById('observacoes').value.trim()
  };

  try {
    const id = document.getElementById('itemId').value;

    if (id) {
      await PneusAPI.editar(veiculo.id, id, dados);
    } else {
      await PneusAPI.cadastrar(veiculo.id, dados);
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