// ===== FORMATAÇÃO =====
// Formata um número como moeda brasileira: 1234.5 vira "R$ 1.234,50"
function formatarMoeda(valor) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

// Formata uma data no padrão brasileiro (dd/mm/aaaa). Sem data, mostra "-"
function formatarData(dataString) {
  if (!dataString) return '-';
  const data = new Date(dataString);
  return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
}

// Prepara uma data vinda do banco para preencher um campo de data do formulário
function formatarDataParaInput(dataString) {
  // Converte data do banco (ISO) para o formato aceito pelo <input type="date">
  if (!dataString) return '';
  return dataString.split('T')[0];
}

// Formata a quilometragem com separador de milhar: 12000 vira "12.000 km"
function formatarKm(km) {
  return new Intl.NumberFormat('pt-BR').format(km) + ' km';
}

// ===== EXIBIÇÃO DE MENSAGENS =====
// Mostra uma mensagem de erro ou sucesso no elemento indicado. As de sucesso somem após 4 segundos
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

// Esconde a mensagem exibida no elemento indicado
function esconderMensagem(elementoId) {
  const elemento = document.getElementById(elementoId);
  if (elemento) elemento.classList.add('oculto');
}

// ===== PROTEÇÃO DE PÁGINA (redireciona se não estiver logado) =====
// Chamada no topo das páginas protegidas: sem token salvo, manda para o login
function exigirLogin() {
  const token = localStorage.getItem('gearup_token');
  if (!token) {
    window.location.href = 'login.html';
  }
}

// ===== DADOS DO USUÁRIO LOGADO =====
// Retorna os dados do usuário salvos no login (ou null)
function usuarioLogado() {
  const dados = localStorage.getItem('gearup_usuario');
  return dados ? JSON.parse(dados) : null;
}

// Apaga o token e os dados do usuário e volta para a página inicial
function logout() {
  localStorage.removeItem('gearup_token');
  localStorage.removeItem('gearup_usuario');
  window.location.href = 'index.html';
}

// ===== VEÍCULO SELECIONADO (o usuário escolhe um veículo e navega pelas telas dele) =====
// Guarda o veículo escolhido na tela de veículos
function salvarVeiculoSelecionado(veiculo) {
  localStorage.setItem('gearup_veiculo_selecionado', JSON.stringify(veiculo));
}

// Retorna o veículo escolhido (ou null)
function veiculoSelecionado() {
  const dados = localStorage.getItem('gearup_veiculo_selecionado');
  return dados ? JSON.parse(dados) : null;
}

// Se nenhum veículo foi escolhido, manda para a tela de veículos
function exigirVeiculoSelecionado() {
  const veiculo = veiculoSelecionado();
  if (!veiculo) {
    window.location.href = 'veiculos.html';
  }
  return veiculo;
}