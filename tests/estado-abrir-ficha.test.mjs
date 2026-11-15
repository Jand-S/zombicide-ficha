import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarEstado, storageEmMemoria } from '../js/estado.js';

test('abrirFicha troca a ficha e a partida ativas e salva na hora', () => {
  const storage = storageEmMemoria();
  const e = criarEstado(storage);
  e.carregar();
  const p1 = e.novaPartida('A');
  const a = e.adicionarFicha('ostara');
  const b = e.adicionarFicha('lili');
  const p2 = e.novaPartida('B');
  const c = e.adicionarFicha('odin');
  assert.equal(e.estado.fichaAtiva, c.id);

  assert.equal(e.abrirFicha(a.id).id, a.id);
  assert.equal(e.estado.partidaAtiva, p1.id);
  assert.equal(e.estado.fichaAtiva, a.id);

  const outro = criarEstado(storage);
  outro.carregar();
  assert.equal(outro.fichaAtual().id, a.id);

  assert.equal(e.abrirFicha(b.id).sobreviventeId, 'lili');
  assert.equal(e.abrirFicha(c.id).id, c.id);
  assert.equal(e.estado.partidaAtiva, p2.id);
});

test('abrirFicha com id que não existe não muda nada', () => {
  const e = criarEstado(storageEmMemoria());
  e.carregar();
  const f = e.adicionarFicha('ostara');
  assert.equal(e.abrirFicha('nao-existe'), null);
  assert.equal(e.estado.fichaAtiva, f.id);
});
