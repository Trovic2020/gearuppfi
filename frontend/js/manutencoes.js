exigirLogin();
renderizarMenuLateral('manutencoes.html');

const usuario = usuarioLogado();
if (usuario) {
  document.getElementById('nomeUsuarioTopo').textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
}
document.getElementById('btnSair').addEventListener('click', logout);

const veiculo = veiculoSelecionado();

const modal = document.getElementById('modal');
const formItem = document.getElementById('formItem');
const tituloModal = document.getElementById('tituloModal');

// ===== CARREGAR OFICINAS NO SELECT =====
async function carregarOficinasNoSelect() {
  try {
    const oficinas = await OficinasAPI.listar();
    const select = document.getElementById('oficinaId');
    oficinas.forEach(o => {
      const opcao = document.createElement('option');
      opcao.value = o.id;
      opcao.textContent = o.nome;
      select.appendChild(opcao);
    });
  } catch (erro) {
    console.error('Erro ao carregar oficinas:', erro);
  }
}

// ===== CARREGAR MANUTENÇÕES =====
async function carregarLista() {
  try {
    const manutencoes = await ManutencoesAPI.listar(veiculo.id);
    const corpo = document.getElementById('corpoTabela');

    if (manutencoes.length === 0) {
      corpo.innerHTML = `<tr><td colspan="6" class="tabela-vazia">Nenhuma manutenção registrada ainda.</td></tr>`;
      return;
    }

    corpo.innerHTML = manutencoes.map(m => `
      <tr>
        <td>${formatarData(m.data_servico)}</td>
        <td>${m.tipo_servico}</td>
        <td>${formatarKm(m.quilometragem)}</td>
        <td>${m.oficina_nome || '-'}</td>
        <td>${formatarMoeda(m.valor)}</td>
        <td>
          <div class="tabela-acoes">
            <button class="btn-icone" onclick="editarItem(${m.id})">Editar</button>
            <button class="btn-icone perigo" onclick="excluirItem(${m.id})">Excluir</button>
          </div>
        </td>
      </tr>
    `).join('');

    // Guarda os dados na memória pra facilitar edição sem nova chamada à API
    window._manutencoesCache = manutencoes;

  } catch (erro) {
    alert('Erro ao carregar manutenções: ' + erro.message);
  }
}

// ===== ABRIR MODAL: NOVA =====
document.getElementById('btnNova').addEventListener('click', () => {
  tituloModal.textContent = 'Nova Manutenção';
  formItem.reset();
  document.getElementById('itemId').value = '';
  esconderMensagem('mensagemModal');
  modal.classList.remove('oculto');
});

// ===== ABRIR MODAL: EDITAR =====
function editarItem(id) {
  const item = window._manutencoesCache.find(m => m.id === id);
  if (!item) return;

  tituloModal.textContent = 'Editar Manutenção';
  document.getElementById('itemId').value = item.id;
  document.getElementById('tipoServico').value = item.tipo_servico;
  document.getElementById('dataServico').value = formatarDataParaInput(item.data_servico);
  document.getElementById('quilometragem').value = item.quilometragem;
  document.getElementById('oficinaId').value = item.oficina_id || '';
  document.getElementById('valor').value = item.valor;
  document.getElementById('observacoes').value = item.observacoes || '';

  esconderMensagem('mensagemModal');
  modal.classList.remove('oculto');
}

// ===== EXCLUIR =====
async function excluirItem(id) {
  if (!confirm('Tem certeza que deseja excluir esta manutenção?')) return;

  try {
    await ManutencoesAPI.excluir(veiculo.id, id);
    carregarLista();
  } catch (erro) {
    alert('Erro ao excluir: ' + erro.message);
  }
}

// ===== FECHAR MODAL =====
document.getElementById('btnCancelar').addEventListener('click', () => {
  modal.classList.add('oculto');
});

// ===== SALVAR (CADASTRAR OU EDITAR) =====
formItem.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  esconderMensagem('mensagemModal');

  const btn = document.getElementById('btnSalvar');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const dados = {
    tipo_servico: document.getElementById('tipoServico').value.trim(),
    data_servico: document.getElementById('dataServico').value,
    quilometragem: document.getElementById('quilometragem').value,
    oficina_id: document.getElementById('oficinaId').value || null,
    valor: document.getElementById('valor').value || 0,
    observacoes: document.getElementById('observacoes').value.trim()
  };

  try {
    const id = document.getElementById('itemId').value;

    if (id) {
      await ManutencoesAPI.editar(veiculo.id, id, dados);
    } else {
      await ManutencoesAPI.cadastrar(veiculo.id, dados);
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

carregarOficinasNoSelect();
carregarLista();