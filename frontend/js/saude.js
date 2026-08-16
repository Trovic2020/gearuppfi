exigirLogin();
renderizarMenuLateral('saude.html');

const usuario = usuarioLogado();
if (usuario) {
  document.getElementById('nomeUsuarioTopo').textContent = `Olá, ${usuario.nome.split(' ')[0]}`;
}
document.getElementById('btnSair').addEventListener('click', logout);

const veiculo = veiculoSelecionado();

function corPorPontuacao(pontuacao) {
  if (pontuacao >= 90) return '#2E9E5B'; // verde
  if (pontuacao >= 60) return '#E0A32A'; // amarelo
  return '#D64545'; // vermelho
}

function classePorPontuacao(pontuacao) {
  if (pontuacao >= 90) return 'excelente';
  if (pontuacao >= 60) return 'atencao';
  return 'necessita';
}

async function carregarSaude() {
  try {
    const dados = await SaudeAPI.calcular(veiculo.id);
    const cor = corPorPontuacao(dados.pontuacao);
    const classe = classePorPontuacao(dados.pontuacao);

    // ===== CARD PRINCIPAL COM O MEDIDOR CIRCULAR =====
    document.getElementById('cardSaudePrincipal').innerHTML = `
      <div class="medidor-saude" style="background: conic-gradient(${cor} ${dados.pontuacao}%, var(--cinza-claro) ${dados.pontuacao}%);">
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
          <div class="barra-progresso-preenchida" style="width: ${(c.pontos / c.max) * 100}%; background-color: ${c.pontos === c.max ? '#2E9E5B' : '#D64545'};"></div>
        </div>
        <div class="card-criterio-detalhe">${c.detalhe}</div>
      </div>
    `).join('');

  } catch (erro) {
    alert('Erro ao carregar saúde do veículo: ' + erro.message);
  }
}

carregarSaude();