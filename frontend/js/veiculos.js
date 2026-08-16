exigirLogin();

BASE_URL_ARQUIVOS = 'http://localhost:3000';

// ===== ESTADO =====
let veiculoEmEdicao = null;

// ===== ELEMENTOS =====
const listaVeiculos = document.getElementById('listaVeiculos');
const estadoVazio = document.getElementById('estadoVazio');
const modalVeiculo = document.getElementById('modalVeiculo');
const formVeiculo = document.getElementById('formVeiculo');
const tituloModalVeiculo = document.getElementById('tituloModalVeiculo');

// ===== EXIBE NOME DO USUÁRIO NO TOPO =====
const usuario = usuarioLogado();
if (usuario) {
  document.getElementById('nomeUsuarioTopo').textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
}

// ===== LOGOUT =====
document.getElementById('btnSair').addEventListener('click', logout);

// ===== CARREGAR VEÍCULOS =====
async function carregarVeiculos() {
  try {
    const veiculos = await VeiculosAPI.listar();

    if (veiculos.length === 0) {
      listaVeiculos.classList.add('oculto');
      estadoVazio.classList.remove('oculto');
      return;
    }

    listaVeiculos.classList.remove('oculto');
    estadoVazio.classList.add('oculto');

    listaVeiculos.innerHTML = veiculos.map(v => `
      <div class="card-veiculo" data-id="${v.id}">
        <button class="card-veiculo-excluir" data-excluir-id="${v.id}" title="Excluir veículo">×</button>
        <div class="card-veiculo-foto">
          ${v.foto_url ? `<img src="${BASE_URL_ARQUIVOS}${v.foto_url}" alt="${v.modelo}">` : '🚗'}
        </div>
        <div class="card-veiculo-info">
          <h3>${v.marca} ${v.modelo}</h3>
          <p>${formatarKm(v.quilometragem_atual)} • ${v.tipo_combustivel}</p>
          <span class="card-veiculo-placa">${v.placa}</span>
        </div>
      </div>
    `).join('');

    // Clique no card leva pro dashboard daquele veículo
    document.querySelectorAll('.card-veiculo').forEach(card => {
      card.addEventListener('click', () => {
        const veiculo = veiculos.find(v => v.id == card.dataset.id);
        salvarVeiculoSelecionado(veiculo);
        window.location.href = 'dashboard.html';
      });
    });

    // Clique no botão "×" exclui o veículo, sem abrir o dashboard
    document.querySelectorAll('.card-veiculo-excluir').forEach(botao => {
      botao.addEventListener('click', async (evento) => {
        evento.stopPropagation(); // impede que o clique "vaze" pro card por trás

        const id = botao.dataset.excluirId;
        const veiculo = veiculos.find(v => v.id == id);

        const confirmar = confirm(`Tem certeza que deseja excluir o veículo ${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})?\n\nO histórico será preservado, mas o veículo sairá da sua lista.`);
        if (!confirmar) return;

        try {
          await VeiculosAPI.excluir(id);
          carregarVeiculos();
        } catch (erro) {
          alert('Erro ao excluir veículo: ' + erro.message);
        }
      });
    });

  } catch (erro) {
    alert('Erro ao carregar veículos: ' + erro.message);
  }
}

carregarVeiculos();

// ===== ABRIR MODAL: NOVO VEÍCULO =====
function abrirModalNovoVeiculo() {
  veiculoEmEdicao = null;
  tituloModalVeiculo.textContent = 'Novo Veículo';
  formVeiculo.reset();
  document.getElementById('veiculoId').value = '';
  esconderMensagem('mensagemModalVeiculo');
  modalVeiculo.classList.remove('oculto');
}

document.getElementById('btnNovoVeiculo').addEventListener('click', abrirModalNovoVeiculo);
document.getElementById('btnNovoVeiculoVazio').addEventListener('click', abrirModalNovoVeiculo);


function abrirModalEditarVeiculo(veiculo) {
  veiculoEmEdicao = veiculo;
  tituloModal_setTexto('Editar Veículo');
  document.getElementById('veiculoId').value = veiculo.id;
  document.getElementById('marca').value = veiculo.marca;
  document.getElementById('modelo').value = veiculo.modelo;
  document.getElementById('anoFabricacao').value = veiculo.ano_fabricacao || '';
  document.getElementById('anoModelo').value = veiculo.ano_modelo || '';
  document.getElementById('cor').value = veiculo.cor || '';
  document.getElementById('placa').value = veiculo.placa;
  document.getElementById('quilometragemAtual').value = veiculo.quilometragem_atual;
  document.getElementById('tipoCombustivel').value = veiculo.tipo_combustivel;
  document.getElementById('dataAquisicao').value = formatarDataParaInput(veiculo.data_aquisicao);

  const previa = document.getElementById('previaFoto');
  if (veiculo.foto_url) {
    previa.src = `http://localhost:3000${veiculo.foto_url}`;
    previa.style.display = 'block';
  } else {
    previa.style.display = 'none';
  }

  esconderMensagem('mensagemModalVeiculo');
  modalVeiculo.classList.remove('oculto');
}

function tituloModal_setTexto(texto) {
  document.getElementById('tituloModalVeiculo').textContent = texto;
}

// Listener dos botões de editar (adicione junto aos outros listeners de card, dentro de carregarVeiculos)
document.querySelectorAll('.card-veiculo-editar').forEach(botao => {
  botao.addEventListener('click', (evento) => {
    evento.stopPropagation();
    const veiculo = veiculos.find(v => v.id == botao.dataset.editarId);
    abrirModalEditarVeiculo(veiculo);
  });
});

// ===== FECHAR MODAL =====
document.getElementById('btnCancelarVeiculo').addEventListener('click', () => {
  modalVeiculo.classList.add('oculto');
});

// ===== SALVAR (CADASTRAR OU EDITAR) =====
formVeiculo.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  esconderMensagem('mensagemModalVeiculo');

  const btn = document.getElementById('btnSalvarVeiculo');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const dados = {
    marca: document.getElementById('marca').value.trim(),
    modelo: document.getElementById('modelo').value.trim(),
    ano_fabricacao: document.getElementById('anoFabricacao').value || null,
    ano_modelo: document.getElementById('anoModelo').value || null,
    cor: document.getElementById('cor').value.trim(),
    placa: document.getElementById('placa').value.trim().toUpperCase(),
    quilometragem_atual: document.getElementById('quilometragemAtual').value || 0,
    tipo_combustivel: document.getElementById('tipoCombustivel').value,
    data_aquisicao: document.getElementById('dataAquisicao').value || null
  };

  try {
    const id = document.getElementById('veiculoId').value;
    let veiculoId = id;

    if (id) {
      await VeiculosAPI.editar(id, dados);
    } else {
      const resposta = await VeiculosAPI.cadastrar(dados);
      veiculoId = resposta.id;
    }

    // Se o usuário selecionou uma foto, envia agora (precisa do id do veículo)
    const arquivoFoto = document.getElementById('fotoVeiculo').files[0];
    if (arquivoFoto && veiculoId) {
      const formData = new FormData();
      formData.append('foto', arquivoFoto);
      await VeiculosAPI.atualizarFoto(veiculoId, formData);
    }

    modalVeiculo.classList.add('oculto');
    carregarVeiculos();
  } catch (erro) {
    mostrarMensagem('mensagemModalVeiculo', erro.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar';
  }
});