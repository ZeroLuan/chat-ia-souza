import 'dotenv/config';
import express from 'express';
import Groq from 'groq-sdk';

const app = express();
const PORT = process.env.PORT || 3000;

// Lê o corpo JSON das requisições (sem isso, req.body seria undefined)
app.use(express.json({ limit: '100kb' }));
app.use(express.static('public'));

// A chave só existe aqui, no servidor. Nunca vai para o navegador.
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || 'sem-chave' });

// ---------- Desafio 3: assistente especializado (system prompt) ----------
const SYSTEM_PROMPT =
  'Você é o "Monitor de Algoritmos", um tutor de Algoritmos e Estrutura de Dados ' +
  'do curso de ADS do IFBA Campus Irecê. Responda sempre em português do Brasil, ' +
  'de forma didática e curta, com exemplos de código quando ajudar. ' +
  'Se a pergunta não for sobre computação ou programação, recuse educadamente ' +
  'e convide o aluno a perguntar algo da área.';

// ---------- Desafio 4: modelos permitidos + preços (US$ por 1M de tokens) ----------
// Os modelos Llama foram descontinuados na Groq; usamos os equivalentes disponíveis.
// Para voltar ao Llama (se reativado), troque os nomes abaixo.
const MODELOS = {
  'openai/gpt-oss-120b': { entrada: 0.15, saida: 0.6 },
  'openai/gpt-oss-20b': { entrada: 0.075, saida: 0.3 },
};
const MODELO_PADRAO = 'openai/gpt-oss-120b';

// ---------- Desafios 1 e 8: memória por sessão ----------
const MAX_TROCAS = 10; // 10 trocas = 20 mensagens
const sessoes = new Map(); // sessionId -> [{ role, content }]

app.post('/api/chat', async (req, res) => {
  const { message, sessionId, model } = req.body ?? {};

  // Validação de entrada
  if (typeof message !== 'string' || !message.trim()) {
    return res.status(400).json({ error: 'A mensagem não pode ser vazia.' });
  }
  if (message.length > 4000) {
    return res.status(413).json({ error: 'Mensagem muito longa (máx. 4000 caracteres).' });
  }
  const id = typeof sessionId === 'string' && sessionId ? sessionId.slice(0, 64) : 'anonimo';
  const modelo = MODELOS[model] ? model : MODELO_PADRAO;

  const historico = sessoes.get(id) ?? [];
  const mensagens = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...historico,
    { role: 'user', content: message.trim() },
  ];

  try {
    const inicio = Date.now();
    const completion = await groq.chat.completions.create({
      model: modelo,
      messages: mensagens,
    });
    const reply = completion.choices[0]?.message?.content ?? '';

    // Guarda a troca e limita o histórico às últimas MAX_TROCAS
    historico.push({ role: 'user', content: message.trim() }, { role: 'assistant', content: reply });
    sessoes.set(id, historico.slice(-MAX_TROCAS * 2));

    // ---------- Desafio 5: tokens e custo ----------
    const usage = completion.usage ?? {};
    const preco = MODELOS[modelo];
    const custo =
      ((usage.prompt_tokens ?? 0) * preco.entrada + (usage.completion_tokens ?? 0) * preco.saida) /
      1_000_000;

    const ms = Date.now() - inicio;
    console.log(`[${id.slice(0, 8)}] ${modelo} | ${usage.total_tokens ?? '?'} tokens | ${ms}ms`);

    res.json({ reply, model: modelo, ms, usage, custo });
  } catch (err) {
    // ---------- Desafio 6: erros específicos ----------
    console.error('Erro na Groq:', err.status, err.message);
    const mensagensErro = {
      400: 'Requisição inválida enviada à Groq (400). Verifique modelo e mensagem.',
      401: 'Chave de API inválida ou ausente (401). Confira GROQ_API_KEY no .env.',
      413: 'A conversa ficou grande demais para o modelo (413). Reinicie a conversa.',
      429: 'Limite de requisições da Groq atingido (429). Aguarde um instante e tente de novo.',
    };
    const status = mensagensErro[err.status] ? err.status : 500;
    res.status(status).json({
      error: mensagensErro[err.status] ?? 'Erro interno ao falar com o modelo. Tente novamente.',
    });
  }
});

// Limpa a conversa de uma sessão
app.delete('/api/chat/:sessionId', (req, res) => {
  sessoes.delete(req.params.sessionId);
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
  if (!process.env.GROQ_API_KEY) {
    console.warn('AVISO: GROQ_API_KEY não definida no .env');
  }
});
