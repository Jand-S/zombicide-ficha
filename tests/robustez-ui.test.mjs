// Se desenhar a tela pedida lançar erro, o app cai numa tela mais simples (e avisa), sem ficar em 'carregando'.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { desenharComRecuo } from '../js/ui/logica.js';

test('erro ao desenhar a ficha cai na Mesa e devolve o erro', () => {
  const r = desenharComRecuo('ficha', (t) => {
    if (t === 'ficha') throw new RangeError('Invalid array length');
    return `<${t}>`;
  });
  assert.equal(r.tela, 'mesa');
  assert.equal(r.html, '<mesa>');
  assert.ok(r.erro instanceof RangeError);
});

test('se a Mesa também falhar, segue para Partidas e depois para a escolha', () => {
  const r = desenharComRecuo('ficha', (t) => {
    if (t !== 'escolher') throw new Error(t);
    return 'ok';
  });
  assert.deepEqual([r.tela, r.html, r.erro.message], ['escolher', 'ok', 'ficha']);
});

test('sem erro, desenha a tela pedida e não avisa nada', () => {
  assert.deepEqual(desenharComRecuo('partidas', (t) => t), { tela: 'partidas', html: 'partidas', erro: null });
});

test('o render do app passa pelo recuo', () => {
  const app = readFileSync(new URL('../js/ui/app.js', import.meta.url), 'utf8');
  assert.match(app, /desenharComRecuo\(tela,/);
});
