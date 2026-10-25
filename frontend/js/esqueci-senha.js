const formEsqueciSenha = document.getElementById('formEsqueciSenha');
const formRedefinir = document.getElementById('formRedefinir');

// ===== SOLICITAR TOKEN =====
formEsqueciSenha.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  esconderMensagem('mensagemEsqueci');

  const btn = document.getElementById('btnEnviar');
  btn.disabled = true;
  btn.textContent = 'Enviando...';

  const email = document.getElementById('email').value.trim();

  try {
    const resposta = await AuthAPI.esqueciSenha(email);

    // Esconde o formulário de e-mail, mostra o de redefinição
    formEsqueciSenha.classList.add('oculto');
    formRedefinir.classList.remove('oculto');

    // ⚠️ Em produção, o token viria por e-mail. Por enquanto (fase de desenvolvimento),
    // preenchemos automaticamente com o tokenDev que a API retorna.
    if (resposta.tokenDev) {
      document.getElementById('token').value = resposta.tokenDev;
    }

  } catch (erro) {
    mostrarMensagem('mensagemEsqueci', erro.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Enviar';
  }
});

// ===== REDEFINIR SENHA COM TOKEN =====
formRedefinir.addEventListener('submit', async (evento) => {
  evento.preventDefault();
  esconderMensagem('mensagemRedefinir');

  const btn = document.getElementById('btnRedefinir');
  btn.disabled = true;
  btn.textContent = 'Redefinindo...';

  const token = document.getElementById('token').value.trim();
  const novaSenha = document.getElementById('novaSenha').value;

  try {
    await AuthAPI.redefinirSenha({ token, novaSenha });
    alert('Senha redefinida com sucesso! Faça login com a nova senha.');
    window.location.href = 'login.html';
  } catch (erro) {
    mostrarMensagem('mensagemRedefinir', erro.message, 'erro');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Redefinir senha';
  }
});