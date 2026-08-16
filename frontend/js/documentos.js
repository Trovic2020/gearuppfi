exigirLogin();
renderizarMenuLateral('documentos.html');

const usuario = usuarioLogado();
if (usuario) {
  document.getElementById('nomeUsuarioTopo').textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
}
document.getElementById('btnSair').addEventListener('click', logout);

const veiculo = veiculoSelecionado();

const modal = document.getElementById('modal');
const formItem = document.getElementById('formItem');

const ICONES_TIPO = {
  'CRLV': '🚙',
  'Licenciamento': '📋',
  'IPVA': '💵',
  'Seguro': '🛡️',
  'Laudo': '📝',
  'Outros': '📄'
};

// URL base do backend, para montar o link completo do arquivo
const BASE_URL_ARQUIVOS = 'http://localhost:3000';

// ===== CARREGAR LISTA =====
async function carregarLista() {
  try {
    const documentos = await DocumentosAPI.listar(veiculo.id);
    const grid = document.getElementById('gridDocumentos');

    if (documentos.length === 0) {
      grid.innerHTML = `<p class="tabela-vazia">Nenhum documento enviado ainda.</p>`;
      return;
    }

    grid.innerHTML = documentos.map(d => `
      <div class="card-documento">
        <div class="card-documento-topo">
          <div class="card-documento-icone">${ICONES_TIPO[d.tipo_documento] || '📄'}</div>
          <div style="overflow: hidden;">
            <div class="card-documento-tipo">${d.tipo_documento}</div>
            <div class="card-documento-nome" title="${d.nome_arquivo}">${d.nome_arquivo}</div>
          </div>
        </div>
        <div class="card-documento-venc">
          ${d.data_vencimento ? 'Vence em: ' + formatarData(d.data_vencimento) : 'Sem data de vencimento'}
        </div>
        <div class="card-documento-acoes">
          <a href="${BASE_URL_ARQUIVOS}${d.url}" target="_blank" class="btn-icone">Visualizar</a>
          <button class="btn-icone perigo" onclick="excluirItem(${d.id})">Excluir</button>
        </div>
      </div>
    `).join('');

  } catch (erro) {
    alert('Erro ao carregar documentos: ' + erro.message);
  }
}

// ===== ABRIR MODAL =====
document.getElementById('btnNova').addEventListener('click', () => {
  formItem.reset();
  esconderMensagem('mensagemModal');
  modal.classList.remove('oculto');
});

// ===== FECHAR MODAL =====
document.getElementById('btnCancelar').addEventListener('click', () => {
  modal.classList.add('oculto');
});

// ===== EXCLUIR =====
async function excluirItem(id) {
  if (!confirm('Tem certeza que deseja excluir este documento? O arquivo será apagado permanentemente.')) return;

  try {
    await DocumentosAPI.excluir(veiculo.id, id);
    carregarLista();
  } catch (erro) {
    alert('Erro ao excluir: ' + erro.message);
  }
}

// ===== ENVIAR (UPLOAD) =====
formItem.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  esconderMensagem('mensagemModal');

  const btn = document.getElementById('btnSalvar');
  const arquivoInput = document.getElementById('arquivo');

  if (!arquivoInput.files[0]) {
    mostrarMensagem('mensagemModal', 'Selecione um arquivo.', 'erro');
    return;
  }

  btn.disabled = true;
  btn.textContent = 'Enviando...';

  // Upload usa FormData, não JSON
  const formData = new FormData();
  formData.append('arquivo', arquivoInput.files[0]);
  formData.append('tipo_documento', document.getElementById('tipoDocumento').value);
  formData.append('data_vencimento', document.getElementById('dataVencimento').value);
  formData.append('observacoes', document.getElementById('observacoes').value.trim());

  try {
    await DocumentosAPI.cadastrar(veiculo.id, formData);
    modal.classList.add('oculto');
    carregarLista();
  } catch (erro) {
    mostrarMensagem('mensagemModal', erro.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar';
  }
});

carregarLista();