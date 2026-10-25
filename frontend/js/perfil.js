exigirLogin();

document.getElementById('btnSair').addEventListener('click', logout);

// ===== CARREGAR DADOS ATUAIS =====
// Preenche o formulário com os dados do usuário vindos da API
async function carregarPerfil() {
  try {
    const dados = await AuthAPI.buscarPerfil();

    document.getElementById('nome').value = dados.nome;
    document.getElementById('email').value = dados.email;
    document.getElementById('telefone').value = dados.telefone || '';

  } catch (erro) {
    alert('Erro ao carregar perfil: ' + erro.message);
  }
}

// ===== SALVAR DADOS PESSOAIS =====
// Salva nome e telefone e atualiza o nome guardado no localStorage
document.getElementById('formPerfil').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  esconderMensagem('mensagemPerfil');

  const btn = document.getElementById('btnSalvarPerfil');
  btn.disabled = true;
  btn.textContent = 'Salvando...';

  const dados = {
    nome: document.getElementById('nome').value.trim(),
    telefone: document.getElementById('telefone').value.trim()
  };

  try {
    await AuthAPI.editarPerfil(dados);

    // Atualiza também o localStorage, pra refletir o nome novo no topo das outras telas
    const usuarioAtual = usuarioLogado();
    usuarioAtual.nome = dados.nome;
    usuarioAtual.telefone = dados.telefone;
    localStorage.setItem('gearup_usuario', JSON.stringify(usuarioAtual));

    mostrarMensagem('mensagemPerfil', 'Perfil atualizado com sucesso!', 'sucesso');
  } catch (erro) {
    mostrarMensagem('mensagemPerfil', erro.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Salvar alterações';
  }
});

// ===== ALTERAR SENHA =====
// Confere se as novas senhas coincidem e envia a troca de senha
document.getElementById('formSenha').addEventListener('submit', async (evento) => {
  evento.preventDefault();
  esconderMensagem('mensagemSenha');

  const novaSenha = document.getElementById('novaSenha').value;
  const confirmarNovaSenha = document.getElementById('confirmarNovaSenha').value;

  if (novaSenha !== confirmarNovaSenha) {
    mostrarMensagem('mensagemSenha', 'As senhas não coincidem.', 'erro');
    return;
  }

  const btn = document.getElementById('btnSalvarSenha');
  btn.disabled = true;
  btn.textContent = 'Alterando...';

  try {
    await AuthAPI.alterarSenha({
      senhaAtual: document.getElementById('senhaAtual').value,
      novaSenha: novaSenha
    });

    mostrarMensagem('mensagemSenha', 'Senha alterada com sucesso!', 'sucesso');
    document.getElementById('formSenha').reset();
  } catch (erro) {
    mostrarMensagem('mensagemSenha', erro.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Alterar senha';
  }
});

carregarPerfil();