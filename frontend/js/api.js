// ===== CONFIGURAÇÃO BASE =====
const API_URL = 'http://localhost:3000/api';

// ===== FUNÇÃO GENÉRICA DE REQUISIÇÃO =====
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
const AuthAPI = {
  cadastrar: (dados) => apiRequest('/auth/cadastro', 'POST', dados),
  login: (dados) => apiRequest('/auth/login', 'POST', dados),
  buscarPerfil: () => apiRequest('/auth/perfil'),
  editarPerfil: (dados) => apiRequest('/auth/perfil', 'PUT', dados),
  alterarSenha: (dados) => apiRequest('/auth/alterar-senha', 'PUT', dados),
  esqueciSenha: (email) => apiRequest('/auth/esqueci-senha', 'POST', { email }),
  redefinirSenha: (dados) => apiRequest('/auth/redefinir-senha', 'POST', dados)
};

// ===== MÓDULO: VEÍCULOS =====
const VeiculosAPI = {
  listar: () => apiRequest('/veiculos'),
  buscarPorId: (id) => apiRequest(`/veiculos/${id}`),
  cadastrar: (dados) => apiRequest('/veiculos', 'POST', dados),
  editar: (id, dados) => apiRequest(`/veiculos/${id}`, 'PUT', dados),
  atualizarQuilometragem: (id, quilometragem_atual) => apiRequest(`/veiculos/${id}/quilometragem`, 'PATCH', { quilometragem_atual }),
  atualizarFoto: (id, formData) => apiRequest(`/veiculos/${id}/foto`, 'POST', formData, true),
  excluir: (id) => apiRequest(`/veiculos/${id}`, 'DELETE')
};

// ===== MÓDULO: MANUTENÇÕES =====
const ManutencoesAPI = {
  listar: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/manutencoes`),
  cadastrar: (veiculoId, dados) => apiRequest(`/veiculos/${veiculoId}/manutencoes`, 'POST', dados),
  editar: (veiculoId, id, dados) => apiRequest(`/veiculos/${veiculoId}/manutencoes/${id}`, 'PUT', dados),
  excluir: (veiculoId, id) => apiRequest(`/veiculos/${veiculoId}/manutencoes/${id}`, 'DELETE')
};

// ===== MÓDULO: ABASTECIMENTOS =====
const AbastecimentosAPI = {
  listar: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/abastecimentos`),
  estatisticas: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/abastecimentos/estatisticas`),
  cadastrar: (veiculoId, dados) => apiRequest(`/veiculos/${veiculoId}/abastecimentos`, 'POST', dados),
  editar: (veiculoId, id, dados) => apiRequest(`/veiculos/${veiculoId}/abastecimentos/${id}`, 'PUT', dados),
  excluir: (veiculoId, id) => apiRequest(`/veiculos/${veiculoId}/abastecimentos/${id}`, 'DELETE')
};

// ===== MÓDULO: PNEUS =====
const PneusAPI = {
  listar: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/pneus`),
  cadastrar: (veiculoId, dados) => apiRequest(`/veiculos/${veiculoId}/pneus`, 'POST', dados),
  editar: (veiculoId, id, dados) => apiRequest(`/veiculos/${veiculoId}/pneus/${id}`, 'PUT', dados),
  excluir: (veiculoId, id) => apiRequest(`/veiculos/${veiculoId}/pneus/${id}`, 'DELETE')
};

// ===== MÓDULO: SEGUROS =====
const SegurosAPI = {
  listar: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/seguros`),
  cadastrar: (veiculoId, dados) => apiRequest(`/veiculos/${veiculoId}/seguros`, 'POST', dados),
  editar: (veiculoId, id, dados) => apiRequest(`/veiculos/${veiculoId}/seguros/${id}`, 'PUT', dados),
  excluir: (veiculoId, id) => apiRequest(`/veiculos/${veiculoId}/seguros/${id}`, 'DELETE')
};

// ===== MÓDULO: DOCUMENTOS =====
const DocumentosAPI = {
  listar: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/documentos`),
  cadastrar: (veiculoId, formData) => apiRequest(`/veiculos/${veiculoId}/documentos`, 'POST', formData, true),
  excluir: (veiculoId, id) => apiRequest(`/veiculos/${veiculoId}/documentos/${id}`, 'DELETE')
};

// ===== MÓDULO: OFICINAS =====
const OficinasAPI = {
  listar: () => apiRequest('/oficinas'),
  cadastrar: (dados) => apiRequest('/oficinas', 'POST', dados),
  editar: (id, dados) => apiRequest(`/oficinas/${id}`, 'PUT', dados),
  excluir: (id, forcar = false) => apiRequest(`/oficinas/${id}${forcar ? '?forcar=true' : ''}`, 'DELETE')
};

// ===== MÓDULO: GASTOS =====
const GastosAPI = {
  listar: (veiculoId, filtros = '') => apiRequest(`/veiculos/${veiculoId}/gastos${filtros}`),
  resumoPorCategoria: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/gastos/resumo-categoria`),
  resumoMensal: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/gastos/resumo-mensal`),
  cadastrar: (veiculoId, dados) => apiRequest(`/veiculos/${veiculoId}/gastos`, 'POST', dados),
  editar: (veiculoId, id, dados) => apiRequest(`/veiculos/${veiculoId}/gastos/${id}`, 'PUT', dados),
  excluir: (veiculoId, id) => apiRequest(`/veiculos/${veiculoId}/gastos/${id}`, 'DELETE')
};

// ===== MÓDULO: ALERTAS =====
const AlertasAPI = {
  listar: (veiculoId, status = '') => apiRequest(`/veiculos/${veiculoId}/alertas${status ? '?status=' + status : ''}`),
  atualizarStatus: (veiculoId, id, status) => apiRequest(`/veiculos/${veiculoId}/alertas/${id}/status`, 'PATCH', { status })
};

// ===== MÓDULO: DASHBOARD =====
const DashboardAPI = {
  resumo: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/dashboard`)
};

// ===== MÓDULO: SAÚDE DO VEÍCULO =====
const SaudeAPI = {
  calcular: (veiculoId) => apiRequest(`/veiculos/${veiculoId}/saude`)
};

// ===== MÓDULO: RELATÓRIOS =====
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