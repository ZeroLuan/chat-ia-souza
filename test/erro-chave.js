// Desafio 6 — prova: sobe o servidor com chave propositalmente errada e confirma o 401.
// A chave abaixo é FALSA, só para o teste.
import { spawn } from 'node:child_process';

const porta = '3999';
const srv = spawn('node', ['index.js'], {
  env: { ...process.env, PORT: porta, GROQ_API_KEY: 'chave_errada_de_teste' },
  stdio: 'ignore',
});

await new Promise((r) => setTimeout(r, 1500));
try {
  const r = await fetch(`http://localhost:${porta}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'oi', sessionId: 'teste' }),
  });
  console.log('Status:', r.status, '(esperado 401)');
  console.log(await r.json());
  const v = await fetch(`http://localhost:${porta}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: '   ' }),
  });
  console.log('Mensagem vazia:', v.status, '(esperado 400)');
} finally {
  srv.kill();
}
