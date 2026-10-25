exigirLogin();
renderizarMenuLateral('oficinas.html');

const usuario = usuarioLogado();
if (usuario) {
  document.getElementById('nomeUsuarioTopo').textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
}
document.getElementById('btnSair').addEventListener('click', logout);

const modal = document.getElementById('modal');
const formItem = document.getElementById('formItem');
const tituloModal = document.getElementById('tituloModal');

// ===== CARREGAR LISTA =====
// Busca as oficinas e monta a tabela. Guarda a lista em cache para a edição
async function carregarLista() {
  try {
    const oficinas = await OficinasAPI.listar();
    const corpo = document.getElementById('corpoTabela');

    if (oficinas.length === 0) {
      corpo.innerHTML = `<tr><td colspan="5" class="tabela-vazia">Nenhuma oficina cadastrada ainda.</td></tr>`;
      return;
    }

    corpo.innerHTML = oficinas.map(o => `
      <tr>
        <td>${o.nome}</td>
        <td>${o.telefone || '-'}</td>
        <td>${o.cidade || '-'}</td>
        <td>${o.endereco || '-'}</td>
        <td>
          <div class="tabela-acoes">
            <button class="btn-icone" onclick="editarItem(${o.id})">Editar</button>
            <button class="btn-icone perigo" onclick="excluirItem(${o.id})">Excluir</button>
          </div>
        </td>
      </tr>
    `).join('');

    window._oficinasCache = oficinas;

  } catch (erro) {
    alert('Erro ao carregar oficinas: ' + erro.message);
  }
}

// ===== ABRIR MODAL: NOVA =====
// Limpa o formulário e abre o modal para uma nova oficina
document.getElementById('btnNova').addEventListener('click', () => {
  tituloModal.textContent = 'Nova Oficina';
  formItem.reset();
  document.getElementById('itemId').value = '';
  esconderMensagem('mensagemModal');
  modal.classList.remove('oculto');
});

// ===== ABRIR MODAL: EDITAR =====
// Preenche o modal com os dados da oficina escolhida (vindos do cache da lista)
function editarItem(id) {
  const item = window._oficinasCache.find(o => o.id === id);
  if (!item) return;

  tituloModal.textContent = 'Editar Oficina';
  document.getElementById('itemId').value = item.id;
  document.getElementById('nome').value = item.nome;
  document.getElementById('telefone').value = item.telefone || '';
  document.getElementById('cidade').value = item.cidade || '';
  document.getElementById('endereco').value = item.endereco || '';
  document.getElementById('observacoes').value = item.observacoes || '';

  esconderMensagem('mensagemModal');
  modal.classList.remove('oculto');
}

// ===== EXCLUIR =====
// Pede confirmação e exclui. Se a oficina tiver manutenções (erro 409), pergunta de novo e força a exclusão
async function excluirItem(id) {
  if (!confirm('Tem certeza que deseja excluir esta oficina?')) return;

  try {
    await OficinasAPI.excluir(id);
    carregarLista();
  } catch (erro) {
    // 409: oficina vinculada a manutenções. Confirmando, exclui mesmo assim
    // (as manutenções continuam existindo, só ficam sem oficina)
    if (erro.status === 409) {
      if (!confirm(`${erro.message}

Excluir mesmo assim? As manutenções continuam salvas, mas ficam sem oficina.`)) return;
      try {
        await OficinasAPI.excluir(id, true);
        carregarLista();
      } catch (erroForcado) {
        alert(erroForcado.message);
      }
      return;
    }
    alert(erro.message);
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
    nome: document.getElementById('nome').value.trim(),
    telefone: document.getElementById('telefone').value.trim(),
    cidade: document.getElementById('cidade').value.trim(),
    endereco: document.getElementById('endereco').value.trim(),
    observacoes: document.getElementById('observacoes').value.trim()
  };

  try {
    const id = document.getElementById('itemId').value;

    if (id) {
      await OficinasAPI.editar(id, dados);
    } else {
      await OficinasAPI.cadastrar(dados);
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