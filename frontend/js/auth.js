// ===== LOGIN =====
const formLogin = document.getElementById('formLogin');
if (formLogin) {
  formLogin.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    esconderMensagem('mensagemLogin');

    const btn = document.getElementById('btnLogin');
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    btn.disabled = true;
    btn.textContent = 'Entrando...';

    try {
      const resposta = await AuthAPI.login({ email, senha });

      localStorage.setItem('gearup_token', resposta.token);
      localStorage.setItem('gearup_usuario', JSON.stringify(resposta.usuario));

      window.location.href = 'veiculos.html';
    } catch (erro) {
      mostrarMensagem('mensagemLogin', erro.message, 'erro');
      btn.disabled = false;
      btn.textContent = 'Entrar';
    }
  });
}

// ===== CADASTRO =====
const formCadastro = document.getElementById('formCadastro');
if (formCadastro) {
  formCadastro.addEventListener('submit', async (evento) => {
    evento.preventDefault();
    esconderMensagem('mensagemCadastro');

    const btn = document.getElementById('btnCadastro');
    const nome = document.getElementById('nome').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefone = document.getElementById('telefone').value.trim();
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;

    if (senha !== confirmarSenha) {
      mostrarMensagem('mensagemCadastro', 'As senhas não coincidem.', 'erro');
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Criando conta...';

    try {
      const resposta = await AuthAPI.cadastrar({ nome, email, telefone, senha });

      localStorage.setItem('gearup_token', resposta.token);
      localStorage.setItem('gearup_usuario', JSON.stringify(resposta.usuario));

      window.location.href = 'veiculos.html';
    } catch (erro) {
      mostrarMensagem('mensagemCadastro', erro.message, 'erro');
      btn.disabled = false;
      btn.textContent = 'Criar conta';
    }
  });
}

// ===== SE JÁ ESTIVER LOGADO, PULA DIRETO PRA TELA DE VEÍCULOS =====
if (formLogin || formCadastro) {
  const token = localStorage.getItem('gearup_token');
  if (token) {
    window.location.href = 'veiculos.html';
  }
}