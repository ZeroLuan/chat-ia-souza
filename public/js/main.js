const chat = document.getElementById('chat');
const form = document.getElementById('form');
const input = document.getElementById('mensagem');
const botao = document.getElementById('enviar');
const seletorModelo = document.getElementById('modelo');
const painel = document.getElementById('painel');
const limpar = document.getElementById('limpar');

// Desafio 8: cada aba tem seu próprio sessionId (sessionStorage é por aba)
function novoId() {
  return crypto.randomUUID();
}
let sessionId = sessionStorage.getItem('sessionId') || novoId();
sessionStorage.setItem('sessionId', sessionId);

let custoTotal = 0;
let tokensTotal = 0;

function adicionarMensagem(tipo, texto, html = false) {
  const div = document.createElement('div');
  div.className = `msg ${tipo}`;
  if (html) {
    // Desafio 9: sanitiza o HTML gerado pelo Markdown antes de inserir (anti-XSS)
    div.innerHTML = DOMPurify.sanitize(marked.parse(texto));
  } else {
    div.textContent = texto;
  }
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const texto = input.value.trim();
  if (!texto) return;

  adicionarMensagem('user', texto);
  input.value = '';

  // Desafio 2: bolha "Pensando..." e botão desabilitado
  botao.disabled = true;
  input.disabled = true;
  const pensando = adicionarMensagem('bot pensando', 'Pensando');

  try {
    const resposta = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: texto, sessionId, model: seletorModelo.value }),
    });
    const dados = await resposta.json();
    pensando.remove();

    if (!resposta.ok) {
      adicionarMensagem('bot erro', dados.error || 'Erro desconhecido.');
      return;
    }

    adicionarMensagem('bot', dados.reply, true);

    // Desafio 5: painel de tokens e custo acumulado
    tokensTotal += dados.usage?.total_tokens ?? 0;
    custoTotal += dados.custo ?? 0;
    painel.textContent =
      `Esta mensagem: ${dados.usage?.total_tokens ?? '—'} tokens · ${dados.ms} ms · ${dados.model}` +
      ` | Sessão: ${tokensTotal} tokens · US$ ${custoTotal.toFixed(6)}` +
      ` | 1.000 conversas ≈ US$ ${(custoTotal * 1000).toFixed(2)}`;
  } catch {
    pensando.remove();
    adicionarMensagem('bot erro', 'Não consegui falar com o servidor. Ele está rodando?');
  } finally {
    botao.disabled = false;
    input.disabled = false;
    input.focus();
  }
});

limpar.addEventListener('click', async () => {
  await fetch(`/api/chat/${sessionId}`, { method: 'DELETE' });
  sessionId = novoId();
  sessionStorage.setItem('sessionId', sessionId);
  chat.innerHTML = '';
  custoTotal = 0;
  tokensTotal = 0;
  painel.textContent = 'Tokens: — · Custo da sessão: US$ 0,000000';
});

adicionarMensagem('bot', 'Olá! Sou o **Monitor de Algoritmos**. Pergunte algo sobre programação.', true);
