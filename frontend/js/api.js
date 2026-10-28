// ===== CONFIGURAÇÃO BASE =====
const API_URL = 'http://localhost:3000/api';

// ===== FUNÇÃO GENÉRICA DE REQUISIÇÃO =====
// Faz qualquer chamada à API: envia o token, converte os dados em JSON (ou manda o FormData
// quando comArquivo = true) e lança um erro com a mensagem da API se a resposta não for OK.
// Retorna o JSON da resposta, ou um Blob quando a resposta é um arquivo (ex: PDF).
async function apiRequest(endpoint, metodo = 'GET', dados = null, comArquivo = false) {
  const token = localStorage.getItem('gearup_token');

  const opcoes = {
    method: metodo,
    headers: {}
  };

  // Se tiver token salvo, envia no header
  if (token) {
    opcoes.headers['Authorization'] = `Bearer ${token}`;
  }

  // Se for envio de arquivo (FormData), não define Content-Type manualmente
  // (o navegador define automaticamente com o boundary correto)
  if (dados && !comArquivo) {
    opcoes.headers['Content-Type'] = 'application/json';
    opcoes.body = JSON.stringify(dados);
  } else if (dados && comArquivo) {
    opcoes.body = dados; // dados já é um FormData
  }

  const resposta = await fetch(`${API_URL}${endpoint}`, opcoes);

  // Se o token expirou ou é inválido, desloga automaticamente
  if (resposta.status === 401) {
    localStorage.removeItem('gearup_token');
    localStorage.removeItem('gearup_usuario');
    if (!window.location.pathname.includes('login.html') && window.location.pathname !== '/') {
      window.location.href = 'login.html';
    }
  }

  const contentType = resposta.headers.get('content-type');

  // Se a resposta for um PDF ou outro binário, retorna o blob direto
  if (contentType && !contentType.includes('application/json')) {
    if (!resposta.ok) throw new Error('Erro ao processar a requisição.');
    return resposta.blob();
  }

  const json = await resposta.json();

  if (!resposta.ok) {
    const erro = new Error(json.erro || 'Erro ao processar a requisição.');
    erro.status = resposta.status;
    throw erro;
  }

  return json;
}

// ===== MÓDULO: AUTENTICAÇÃO =====
// Cadastro, login, perfil e senha (/api/auth)
const AuthAPI = {
  cadastrar: (dados) => apiRequest('/auth/cadastro', 'POST', dados),
  login: (dados) => apiRequest('/auth/login', 'POST', dados),
  buscarPerfil: () => apiRequest('/auth/perfil'),
  editarPerfil: (dados) => apiRequest('/auth/perfil', 'PUT', dados),
  alterarSenha: (dados) => apiRequest('/auth/alterar-senha', 'PUT', dados)
};

// ===== MÓDULO: VEÍCULOS =====
// Listar, cadastrar, editar e excluir veículos, mais o envio da foto (/api/veiculos)
const VeiculosAPI = {
  listar: () => apiRequest('/veiculos'),
  cadastrar: (dados) => apiRequest('/veiculos', 'POST', dados),
  editar: (id, dados) => apiRequest(`/veiculos/${id}`, 'PUT', dados),
  atualizarFoto: (id, formData) => apiRequest(`/veiculos/${id}/foto`, 'POST', formData, true),
  excluir: (id) => apiRequest(`/veiculos/${id}`, 'DELETE')
};

// ===== MÓDULO: MANUTENÇÕES =====
// Listar, cadastrar, editar e excluir as manutenções de um veículo
const ManutencoesAPI = {
  listar: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/manutencoes`),
  cadastrar: (veiculoId, dados) => apiRequest(`/veiculos/${veiculoId}/manutencoes`, 'POST', dados),
  editar: (veiculoId, id, dados) => apiRequest(`/veiculos/${veiculoId}/manutencoes/${id}`, 'PUT', dados),
  excluir: (veiculoId, id) => apiRequest(`/veiculos/${veiculoId}/manutencoes/${id}`, 'DELETE')
};

// ===== MÓDULO: ABASTECIMENTOS =====
// Listar, cadastrar, editar e excluir abastecimentos, mais as estatísticas de consumo
const AbastecimentosAPI = {
  listar: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/abastecimentos`),
  estatisticas: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/abastecimentos/estatisticas`),
  cadastrar: (veiculoId, dados) => apiRequest(`/veiculos/${veiculoId}/abastecimentos`, 'POST', dados),
  editar: (veiculoId, id, dados) => apiRequest(`/veiculos/${veiculoId}/abastecimentos/${id}`, 'PUT', dados),
  excluir: (veiculoId, id) => apiRequest(`/veiculos/${veiculoId}/abastecimentos/${id}`, 'DELETE')
};

// ===== MÓDULO: PNEUS =====
// Listar, cadastrar, editar e excluir os pneus de um veículo
const PneusAPI = {
  listar: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/pneus`),
  cadastrar: (veiculoId, dados) => apiRequest(`/veiculos/${veiculoId}/pneus`, 'POST', dados),
  editar: (veiculoId, id, dados) => apiRequest(`/veiculos/${veiculoId}/pneus/${id}`, 'PUT', dados),
  excluir: (veiculoId, id) => apiRequest(`/veiculos/${veiculoId}/pneus/${id}`, 'DELETE')
};

// ===== MÓDULO: SEGUROS =====
// Listar, cadastrar, editar e excluir os seguros de um veículo
const SegurosAPI = {
  listar: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/seguros`),
  cadastrar: (veiculoId, dados) => apiRequest(`/veiculos/${veiculoId}/seguros`, 'POST', dados),
  editar: (veiculoId, id, dados) => apiRequest(`/veiculos/${veiculoId}/seguros/${id}`, 'PUT', dados),
  excluir: (veiculoId, id) => apiRequest(`/veiculos/${veiculoId}/seguros/${id}`, 'DELETE')
};

// ===== MÓDULO: DOCUMENTOS =====
// Listar, enviar (upload com FormData) e excluir os documentos de um veículo
const DocumentosAPI = {
  listar: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/documentos`),
  cadastrar: (veiculoId, formData) => apiRequest(`/veiculos/${veiculoId}/documentos`, 'POST', formData, true),
  excluir: (veiculoId, id) => apiRequest(`/veiculos/${veiculoId}/documentos/${id}`, 'DELETE')
};

// ===== MÓDULO: OFICINAS =====
// CRUD de oficinas. excluir(id, true) força a exclusão mesmo com manutenções vinculadas
const OficinasAPI = {
  listar: () => apiRequest('/oficinas'),
  cadastrar: (dados) => apiRequest('/oficinas', 'POST', dados),
  editar: (id, dados) => apiRequest(`/oficinas/${id}`, 'PUT', dados),
  excluir: (id, forcar = false) => apiRequest(`/oficinas/${id}${forcar ? '?forcar=true' : ''}`, 'DELETE')
};

// ===== MÓDULO: GASTOS =====
// Listar gastos (filtros na query string), resumos para os gráficos, cadastro e exclusão de gastos manuais
const GastosAPI = {
  listar: (veiculoId, filtros = '') => apiRequest(`/veiculos/${veiculoId}/gastos${filtros}`),
  resumoPorCategoria: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/gastos/resumo-categoria`),
  resumoMensal: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/gastos/resumo-mensal`),
  cadastrar: (veiculoId, dados) => apiRequest(`/veiculos/${veiculoId}/gastos`, 'POST', dados),
  excluir: (veiculoId, id) => apiRequest(`/veiculos/${veiculoId}/gastos/${id}`, 'DELETE')
};

// ===== MÓDULO: ALERTAS =====
// Listar alertas (filtro opcional por status) e mudar o status de um alerta
const AlertasAPI = {
  listar: (veiculoId, status = '') => apiRequest(`/veiculos/${veiculoId}/alertas${status ? '?status=' + status : ''}`),
  atualizarStatus: (veiculoId, id, status) => apiRequest(`/veiculos/${veiculoId}/alertas/${id}/status`, 'PATCH', { status })
};

// ===== MÓDULO: DASHBOARD =====
// Busca todos os dados do painel do veículo
const DashboardAPI = {
  resumo: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/dashboard`)
};

// ===== MÓDULO: SAÚDE DO VEÍCULO =====
// Busca a pontuação de saúde do veículo
const SaudeAPI = {
  calcular: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/saude`)
};

// ===== MÓDULO: RELATÓRIOS =====
// baixarCompleto: pede o PDF à API e força o download no navegador
const RelatoriosAPI = {
  baixarCompleto: async (veiculoId) => {
    const blob = await apiRequest(`/veiculos/${veiculoId}/relatorios/completo`);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-veiculo-${veiculoId}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};