exigirLogin();
renderizarMenuLateral('alertas.html');

const usuario = usuarioLogado();
if (usuario) {
  document.getElementById('nomeUsuarioTopo').textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
}
document.getElementById('btnSair').addEventListener('click', logout);

const veiculo = veiculoSelecionado();

const ICONES_TIPO = {
  'Troca de Óleo': '🛢️',
  'Revisão': '🔧',
  'Pneus': '🛞',
  'Seguro': '🛡️',
  'Licenciamento': '📋',
  'IPVA': '💵',
  'Documento': '📄'
};

let statusAtivo = 'Pendente';

// ===== CARREGAR ALERTAS =====
// Busca os alertas do status da aba ativa e monta os cards (os pendentes ganham Resolver/Ignorar)
async function carregarLista() {
  try {
    const alertas = await AlertasAPI.listar(veiculo.id, statusAtivo);
    const container = document.getElementById('listaAlertas');

    if (alertas.length === 0) {
      container.innerHTML = `<p class="tabela-vazia">Nenhum alerta ${statusAtivo ? 'com esse status' : ''} no momento. 🎉</p>`;
      return;
    }

    container.innerHTML = alertas.map(a => {
      // Define a classe visual de urgência baseado no tipo/status
      const urgente = a.titulo.toLowerCase().includes('vencid') || a.titulo.toLowerCase().includes('precisa ser trocado');
      const classeUrgencia = urgente ? 'critico' : 'atencao';

      return `
        <div class="card-alerta ${a.status === 'Pendente' ? classeUrgencia : ''}">
          <div class="card-alerta-icone">${ICONES_TIPO[a.tipo_alerta] || '🔔'}</div>
          <div class="card-alerta-conteudo">
            <div class="card-alerta-titulo">${a.titulo}</div>
            <div class="card-alerta-descricao">${a.descricao || ''}</div>
          </div>
          ${a.status === 'Pendente' ? `
            <div class="card-alerta-acoes">
              <button class="btn-icone" onclick="atualizarStatus(${a.id}, 'Resolvido')">Resolver</button>
              <button class="btn-icone perigo" onclick="atualizarStatus(${a.id}, 'Ignorado')">Ignorar</button>
            </div>
          ` : `<span class="badge ${a.status === 'Resolvido' ? 'badge-ok' : 'badge-atencao'}">${a.status}</span>`}
        </div>
      `;
    }).join('');

  } catch (erro) {
    alert('Erro ao carregar alertas: ' + erro.message);
  }
}

// ===== ATUALIZAR STATUS =====
// Muda o status do alerta (Resolvido ou Ignorado) e recarrega a lista
async function atualizarStatus(id, novoStatus) {
  try {
    await AlertasAPI.atualizarStatus(veiculo.id, id, novoStatus);
    carregarLista();
  } catch (erro) {
    alert('Erro ao atualizar alerta: ' + erro.message);
  }
}

// ===== FILTRO POR ABAS =====
// Ao clicar numa aba, marca ela como ativa e lista os alertas daquele status
document.querySelectorAll('.filtro-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.filtro-tab').forEach(t => t.classList.remove('ativo'));
    tab.classList.add('ativo');
    statusAtivo = tab.dataset.status;
    carregarLista();
  });
});

carregarLista();