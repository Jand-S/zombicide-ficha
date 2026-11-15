// Duas abas do app = dois criarEstado() sobre o mesmo storage. Uma não pode apagar o que a outra gravou.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarEstado, storageEmMemoria, CHAVE } from '../js/estado.js';
import { aplicarXp } from '../js/regras.js';

function aberto(storage) {
  const e = criarEstado(storage);
  e.carregar();
  return e;
}
const fichaNoStorage = (storage, id) =>
  JSON.parse(storage.getItem(CHAVE)).partidas.flatMap((p) => p.fichas).find((f) => f.id === id);

test('+5 XP numa aba não é desfeito pela outra ao ferir outra ficha', () => {
  const ls = storageEmMemoria();
  const base = aberto(ls);
  const ostara = base.adicionarFicha('ostara');
  const lou = base.adicionarFicha('lou');
  const aba1 = aberto(ls); aba1.abrirFicha(ostara.id);
  const aba2 = aberto(ls); aba2.abrirFicha(lou.id);
  aba1.alterarFicha(ostara.id, (f) => aplicarXp(f, 5).ficha);
  aba2.alterarFicha(lou.id, (f) => { f.ferimentos = 1; return f; });
  assert.equal(fichaNoStorage(ls, ostara.id).xp, 5);
  assert.equal(fichaNoStorage(ls, lou.id).ferimentos, 1);
  // a aba que salvou por último também passa a ver a mudança da outra
  assert.equal(aba2.estado.partidas[0].fichas.find((f) => f.id === ostara.id).xp, 5);
  // e a mesma ficha mexida nas duas: vale a última gravação
  aba1.alterarFicha(lou.id, (f) => { f.xp = 2; return f; });
  assert.deepEqual([fichaNoStorage(ls, lou.id).xp, fichaNoStorage(ls, lou.id).ferimentos], [2, 0]);
});

test('ficha recebida por link numa aba nova sobrevive à outra aba ficar oculta', () => {
  const ls = storageEmMemoria();
  const t1 = aberto(ls);
  t1.adicionarFicha('odin');
  const link = t1.exportarLink(t1.fichaAtual().id);
  const t2 = aberto(ls);
  const recebida = t2.importarLink(link);
  t1.salvar(); // visibilitychange 'hidden' / pagehide na aba 1, sem mudança nenhuma
  const reaberto = aberto(ls);
  assert.ok(reaberto.estado.partidas.some((p) => p.fichas.some((f) => f.id === recebida.id)));
  assert.equal(reaberto.estado.partidas[0].fichas.length, 2);
});

test('salvar sem mudança não grava; com mudança não gravada (storage cheio) segue pendente', () => {
  const ls = storageEmMemoria();
  let gravacoes = 0;
  let cheio = false;
  const contado = { ...ls, setItem(k, v) { if (cheio) throw new DOMException('cheio', 'QuotaExceededError'); gravacoes += 1; ls.setItem(k, v); } };
  const e = aberto(contado);
  const f = e.adicionarFicha('odin');
  assert.equal(e.pendente, false);
  const antes = gravacoes;
  assert.equal(e.salvar(), true);
  assert.equal(gravacoes, antes);
  cheio = true;
  e.alterarFicha(f.id, (x) => { x.xp = 3; });
  assert.equal(e.pendente, true);
  cheio = false;
  assert.equal(e.salvar(), true);
  assert.equal(e.pendente, false);
  assert.equal(fichaNoStorage(ls, f.id).xp, 3);
});

test('recarregar() traz o que a outra aba gravou e mantém a ficha aberta nesta aba', () => {
  const ls = storageEmMemoria();
  const base = aberto(ls);
  const ostara = base.adicionarFicha('ostara');
  const lou = base.adicionarFicha('lou');
  const aba1 = aberto(ls); aba1.abrirFicha(ostara.id);
  const aba2 = aberto(ls); aba2.abrirFicha(lou.id);
  aba2.alterarFicha(lou.id, (f) => { f.ferimentos = 2; return f; });
  const novo = aba2.adicionarFicha('wanda');
  aba1.recarregar(); // o que o app faz no evento 'storage'
  assert.equal(aba1.fichaAtual().id, ostara.id);
  const fichas = aba1.partidaAtual().fichas;
  assert.equal(fichas.find((f) => f.id === lou.id).ferimentos, 2);
  assert.ok(fichas.some((f) => f.id === novo.id));
});

test('o app escuta o evento storage e só salva ao sair se houver mudança pendente', () => {
  const app = readFileSync(new URL('../js/ui/app.js', import.meta.url), 'utf8');
  assert.match(app, /addEventListener\('storage'/);
  assert.match(app, /api\.recarregar\(\)/);
  assert.match(app, /'hidden' && api\.pendente/);
  assert.match(app, /pagehide', \(\) => \{ if \(api\.pendente\)/);
});
