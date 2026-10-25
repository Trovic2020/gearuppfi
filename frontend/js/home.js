// Anima o número central do medidor de 0 até 94, sincronizado com o desenho do círculo
(function () {
  const elemento = document.getElementById('medidorNumero');
  if (!elemento) return;

  const valorFinal = 94;
  const duracao = 1800; // ms — mesmo tempo da animação CSS do círculo
  const inicio = performance.now();

  // Atualiza o número a cada quadro da animação, até chegar no valor final
  function passo(agora) {
    const progresso = Math.min((agora - inicio) / duracao, 1);
    // easing suave no final, parecido com o do círculo (cubic-bezier aproximado)
    const suavizado = 1 - Math.pow(1 - progresso, 3);
    elemento.textContent = Math.round(suavizado * valorFinal);

    if (progresso < 1) {
      requestAnimationFrame(passo);
    }
  }

  // pequeno atraso pra sincronizar com o delay da animação CSS (0.3s)
  setTimeout(() => requestAnimationFrame(passo), 300);
})();