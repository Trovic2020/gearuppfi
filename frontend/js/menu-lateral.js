function renderizarMenuLateral(paginaAtiva) {
  const veiculo = exigirVeiculoSelecionado();
  if (!veiculo) return;

  const itens = [
    { pagina: 'dashboard.html', label: '📊 Dashboard' },
    { pagina: 'manutencoes.html', label: '🔧 Manutenções' },
    { pagina: 'abastecimentos.html', label: '⛽ Abastecimentos' },
    { pagina: 'pneus.html', label: '🛞 Pneus' },
    { pagina: 'seguros.html', label: '🛡️ Seguro' },
    { pagina: 'documentos.html', label: '📄 Documentos' },
    { pagina: 'financeiro.html', label: '💰 Financeiro' },
    { pagina: 'alertas.html', label: '🔔 Alertas' },
    { pagina: 'saude.html', label: '❤️ Saúde do Veículo' },
    { pagina: 'oficinas.html', label: '🏭 Oficinas' }
  ];

  const html = `
    <div class="menu-lateral-veiculo">
      <h4>${veiculo.marca} ${veiculo.modelo}</h4>
      <p>${veiculo.placa}</p>
      <a href="veiculos.html">← Trocar veículo</a>
    </div>
    <nav>
      ${itens.map(item => `
        <a href="${item.pagina}" class="${item.pagina === paginaAtiva ? 'ativo' : ''}">${item.label}</a>
      `).join('')}
    </nav>
  `;

  document.getElementById('menuLateral').innerHTML = html;
}