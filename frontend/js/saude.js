exigirLogin();
renderizarMenuLateral('saude.html');

const usuario = usuarioLogado();
if (usuario) {
  document.getElementById('nomeUsuarioTopo').textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
}
document.getElementById('btnSair').addEventListener('click', logout);

const veiculo = veiculoSelecionado();

// Cor do medidor conforme a pontuação: verde (90+), amarelo (60+) ou vermelho
function corPorPontuacao(pontuacao) {
  if (pontuacao >= 90) return '#16A34A'; // verde
  if (pontuacao >= 60) return '#D97706'; // amarelo
  return '#DC2626'; // vermelho
}

// Classe CSS da classificação conforme a pontuação (mesmas faixas da cor)
function classePorPontuacao(pontuacao) {
  if (pontuacao >= 90) return 'excelente';
  if (pontuacao >= 60) return 'atencao';
  return 'necessita';
}

// Busca a pontuação na API e monta o medidor circular e os cards de cada critério
async function carregarSaude() {
  try {
    const dados = await SaudeAPI.calcular(veiculo.id);
    const cor = corPorPontuacao(dados.pontuacao);
    const classe = classePorPontuacao(dados.pontuacao);

    // ===== CARD PRINCIPAL COM O MEDIDOR CIRCULAR =====
    document.getElementById('cardSaudePrincipal').innerHTML = `
      <div class="medidor-saude" style="background: conic-gradient(${cor} ${dados.pontuacao}%, var(--bg-painel-2) ${dados.pontuacao}%);">
        <div class="medidor-saude-interno">
          <span class="medidor-saude-numero">${dados.pontuacao}</span>
          <span class="medidor-saude-legenda">de 100</span>
        </div>
      </div>
      <div class="saude-info">
        <div class="saude-classificacao ${classe}">${dados.classificacao}</div>
        <p>Baseado em 5 critérios: manutenções, documentação, seguro, troca de óleo e pneus.</p>
      </div>
    `;

    // ===== CARDS DE CADA CRITÉRIO =====
    document.getElementById('gridCriterios').innerHTML = dados.criterios.map(c => `
      <div class="card-criterio">
        <div class="card-criterio-topo">
          <span class="card-criterio-nome">${c.criterio}</span>
          <span class="card-criterio-pontos ${c.pontos === c.max ? 'total' : 'parcial'}">${c.pontos}/${c.max} pts</span>
        </div>
        <div class="barra-progresso-fundo">
          <div class="barra-progresso-preenchida" style="width: ${(c.pontos / c.max) * 100}%; background-color: ${c.pontos === c.max ? '#16A34A' : '#DC2626'};"></div>
        </div>
        <div class="card-criterio-detalhe">${c.detalhe}</div>
      </div>
    `).join('');

  } catch (erro) {
    alert('Erro ao carregar saúde do veículo: ' + erro.message);
  }
}

carregarSaude();