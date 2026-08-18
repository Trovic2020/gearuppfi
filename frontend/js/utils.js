// ===== FORMATAÇÃO =====
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

function formatarData(dataString) {
  if (!dataString) return '-';
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

function formatarDataParaInput(dataString) {
  // Converte data do banco (ISO) para o formato aceito pelo <input type="date">
  if (!dataString) return '';
  return dataString.split('T')[0];
}

function formatarKm(km) {
  return new Intl.NumberFormat('pt-BR').format(km) + ' km';
}

// ===== EXIBIÇÃO DE MENSAGENS =====
function mostrarMensagem(elementoId, texto, tipo = 'erro') {
  const elemento = document.getElementById(elementoId);
  if (!elemento) return;

  elemento.textContent = texto;
  elemento.className = `mensagem mensagem-${tipo}`;
  elemento.classList.remove('oculto');

  // Some sozinho depois de alguns segundos, se for sucesso
  if (tipo === 'sucesso') {
    setTimeout(() => elemento.classList.add('oculto'), 4000);
  }
}

function esconderMensagem(elementoId) {
  const elemento = document.getElementById(elementoId);
  if (elemento) elemento.classList.add('oculto');
}

// ===== PROTEÇÃO DE PÁGINA (redireciona se não estiver logado) =====
function exigirLogin() {
  const token = localStorage.getItem('gearup_token');
  if (!token) {
    window.location.href = 'login.html';
  }
}

// ===== DADOS DO USUÁRIO LOGADO =====
function usuarioLogado() {
  const dados = localStorage.getItem('gearup_usuario');
  return dados ? JSON.parse(dados) : null;
}

function logout() {
  localStorage.removeItem('gearup_token');
  localStorage.removeItem('gearup_usuario');
  window.location.href = 'index.html';
}

// ===== VEÍCULO SELECIONADO (o usuário escolhe um veículo e navega pelas telas dele) =====
function salvarVeiculoSelecionado(veiculo) {
  localStorage.setItem('gearup_veiculo_selecionado', JSON.stringify(veiculo));
}

function veiculoSelecionado() {
  const dados = localStorage.getItem('gearup_veiculo_selecionado');
  return dados ? JSON.parse(dados) : null;
}

function exigirVeiculoSelecionado() {
  const veiculo = veiculoSelecionado();
  if (!veiculo) {
    window.location.href = 'veiculos.html';
  }
  return veiculo;
}