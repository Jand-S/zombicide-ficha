import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  criarEstado, storageEmMemoria, migrar, fichaVazia, linkDaFicha, fichaDoLink,
  CHAVE, CHAVE_CORROMPIDO, VERSAO, MAX_DESFAZER, LIMITE_LINK,
} from '../js/estado.js';

// Sobreviventes de mentira (js/dados ainda não existe): só os ids importam aqui.
const S1 = 'teste-adulto';
const S2 = 'teste-kid';

function storageCheio() {
  const base = storageEmMemoria();
  return {
    ...base,
    cheio: false,
    setItem(k, v) {
      if (this.cheio) throw new DOMException('cheio', 'QuotaExceededError');
      base.setItem(k, v);
    },
  };
}

test('salvar e recarregar com o mesmo storage', () => {
  const storage = storageEmMemoria();
  const a = criarEstado(storage);
  a.carregar();
  const p = a.novaPartida('Noite de sexta');
  const f = a.adicionarFicha(S1);
  a.alterarFicha(f.id, (x) => { x.xp = 12; x.inventario.maos[0] = { equipId: 'pistola' }; x.inventario.mochila[1] = { texto: 'Chave do carro' }; });

  const b = criarEstado(storage);
  const est = b.carregar();
  assert.equal(est.versao, VERSAO);
  assert.equal(est.partidaAtiva, p.id);
  assert.equal(est.fichaAtiva, f.id);
  const g = b.fichaAtual();
  assert.equal(g.xp, 12);
  assert.deepEqual(g.inventario.maos, [{ equipId: 'pistola' }, null]);
  assert.deepEqual(g.inventario.mochila, [null, { texto: 'Chave do carro' }, null]);
  assert.equal(b.partidaAtual().nome, 'Noite de sexta');
  assert.ok(storage.getItem(CHAVE).length > 0);
});

test('duas fichas na mesma partida não se misturam', () => {
  const e = criarEstado(storageEmMemoria());
  e.carregar();
  e.novaPartida('Mesa');
  const f1 = e.adicionarFicha(S1);
  const f2 = e.adicionarFicha(S2);
  assert.notEqual(f1.id, f2.id);
  e.alterarFicha(f1.id, (x) => { x.xp = 20; x.escolhas.laranja.push('lar-a'); x.inventario.maos[0] = { equipId: 'faca' }; });
  e.alterarFicha(f2.id, (x) => ({ ...x, ferimentos: 1 }));
  const [a, b] = e.partidaAtual().fichas;
  assert.equal(a.xp, 20);
  assert.equal(a.ferimentos, 0);
  assert.deepEqual(b.escolhas.laranja, []);
  assert.equal(b.xp, 0);
  assert.equal(b.ferimentos, 1);
  assert.deepEqual(b.inventario.maos, [null, null]);
  assert.equal(e.estado.fichaAtiva, f2.id);
});

test('desfazer volta alterações e remoção, e guarda no máximo 30 passos', () => {
  const e = criarEstado(storageEmMemoria());
  e.carregar();
  const f = e.adicionarFicha(S1);
  e.alterarFicha(f.id, (x) => { x.xp = 1; });
  e.alterarFicha(f.id, (x) => { x.xp = 2; });
  assert.equal(e.desfazer().xp, 1);
  assert.equal(e.fichaAtual().xp, 1);

  assert.equal(e.removerFicha(f.id), true);
  assert.equal(e.partidaAtual().fichas.length, 0);
  assert.equal(e.estado.fichaAtiva, null);
  e.desfazer();
  assert.equal(e.partidaAtual().fichas.length, 1);
  assert.equal(e.estado.fichaAtiva, f.id);
  assert.equal(e.desfazer().xp, 0);
  assert.equal(e.desfazer(), null);

  for (let i = 1; i <= 40; i++) e.alterarFicha(f.id, (x) => { x.xp = i; });
  let n = 0;
  while (e.desfazer()) n++;
  assert.equal(n, MAX_DESFAZER);
  assert.equal(e.fichaAtual().xp, 40 - MAX_DESFAZER);
});

test('desfazer sobrevive a recarregar (o estado salvo é o desfeito)', () => {
  const storage = storageEmMemoria();
  const e = criarEstado(storage);
  e.carregar();
  const f = e.adicionarFicha(S1);
  e.alterarFicha(f.id, (x) => { x.xp = 9; });
  e.desfazer();
  const b = criarEstado(storage);
  b.carregar();
  assert.equal(b.fichaAtual().xp, 0);
});

test('link: ida e volta e cabe em um QR', () => {
  const e = criarEstado(storageEmMemoria());
  e.carregar();
  const f = e.adicionarFicha(S1);
  e.alterarFicha(f.id, (x) => {
    Object.assign(x, { xp: 31, voltas: 2, ferimentos: 1, objetivos: 3, ultrared: true });
    x.escolhas = { laranja: ['lar-a', 'lar-b', 'sortudo'], vermelho: ['ver-a', 'ver-b'] };
    x.acoesGastas = { normais: 2, gratis: { movimento: 1 } };
    x.inventario.maos = [{ equipId: 'espingarda-serrada' }, { texto: 'Lanterna da vovó, com pilha' }];
    x.inventario.mochila = [{ equipId: 'muita-municao' }, null, { equipId: 'agua' }];
    x.inventario.extra = [{ texto: 'Mapa' }, null];
  });
  const original = e.fichaAtual();
  const link = e.exportarLink(f.id);
  assert.match(link, /^#f=[A-Za-z0-9_-]+$/);
  assert.ok(link.length < LIMITE_LINK, `link com ${link.length} caracteres`);

  const outro = criarEstado(storageEmMemoria());
  outro.carregar();
  const g = outro.importarLink(link);
  assert.ok(g);
  const { id: _a, ...semIdA } = original;
  const { id: _b, ...semIdB } = g;
  assert.deepEqual(semIdB, semIdA);
  assert.equal(outro.fichaAtual().id, g.id);
  // também aceita sem o '#'
  assert.equal(fichaDoLink(link.slice(1)).xp, 31);
});

test('link: textos enormes são encurtados para caber no QR e o resto se mantém', () => {
  const f = fichaVazia(S1, 'x');
  const longo = 'ação ç '.repeat(200);
  f.inventario.maos = [{ texto: longo }, { texto: longo }];
  f.inventario.mochila = [{ texto: longo }, { texto: longo }, { texto: longo }];
  f.inventario.extra = [{ equipId: 'katana' }, { texto: 'curto' }];
  f.xp = 17;
  const link = linkDaFicha(f);
  assert.ok(link.length < LIMITE_LINK, `link com ${link.length} caracteres`);
  const g = fichaDoLink(link);
  assert.equal(g.xp, 17);
  assert.deepEqual(g.inventario.extra, [{ equipId: 'katana' }, { texto: 'curto' }]);
  assert.ok(g.inventario.maos[0].texto.length > 0);
  assert.ok(longo.startsWith(g.inventario.maos[0].texto));
});

test('link inválido não quebra e não muda nada', () => {
  const e = criarEstado(storageEmMemoria());
  e.carregar();
  for (const lixo of ['', '#', '#f=', '#f=%%%%', '#f=bm9wZQ', '#outra=1', null, 42, '#f=' + btoa('[2,"x"]')]) {
    assert.equal(e.importarLink(lixo), null, String(lixo));
  }
  assert.equal(e.estado.partidas.length, 0);
});

test('JSON: ida e volta do backup', () => {
  const e = criarEstado(storageEmMemoria());
  e.carregar();
  e.novaPartida('A');
  const f = e.adicionarFicha(S1);
  e.alterarFicha(f.id, (x) => { x.xp = 44; x.inventario.extra[1] = { texto: 'Rádio' }; });
  e.novaPartida('B');
  e.adicionarFicha(S2);
  const txt = e.exportarJSON();

  const storage = storageEmMemoria();
  const outro = criarEstado(storage);
  outro.carregar();
  assert.equal(outro.importarJSON(txt), true);
  assert.deepEqual(outro.estado, e.estado);
  const recarregado = criarEstado(storage);
  assert.deepEqual(recarregado.carregar(), e.estado);
});

test('JSON inválido no import não quebra e mantém o estado', () => {
  const e = criarEstado(storageEmMemoria());
  e.carregar();
  e.adicionarFicha(S1);
  const antes = structuredClone(e.estado);
  for (const lixo of ['{', 'null', '[]', '"texto"', '{"partidas": 3}', undefined]) {
    assert.equal(e.importarJSON(lixo), false, String(lixo));
  }
  assert.deepEqual(e.estado, antes);
});

test('migração de uma versão sem `voltas`', () => {
  const antigo = {
    partidas: [{
      id: 'p1', nome: 'Velha', atualizadaEm: 1,
      fichas: [{ id: 'f1', sobreviventeId: S1, xp: 25, escolhas: { laranja: ['lar-a'] }, ferimentos: 1, inventario: { maos: [{ equipId: 'pistola' }], mochila: [] } }],
    }],
    partidaAtiva: 'p1', fichaAtiva: 'f1',
  };
  const m = migrar(antigo);
  assert.equal(m.versao, VERSAO);
  const f = m.partidas[0].fichas[0];
  assert.equal(f.voltas, 0);
  assert.equal(f.xp, 25);
  assert.equal(f.ultrared, false);
  assert.deepEqual(f.escolhas, { laranja: ['lar-a'], vermelho: [] });
  assert.deepEqual(f.acoesGastas, { normais: 0, gratis: {} });
  assert.deepEqual(f.inventario, { maos: [{ equipId: 'pistola' }, null], mochila: [null, null, null], extra: [null, null] });
  assert.equal(m.fichaAtiva, 'f1');

  // pelo storage também
  const storage = storageEmMemoria();
  storage.setItem(CHAVE, JSON.stringify(antigo));
  const e = criarEstado(storage);
  e.carregar();
  assert.equal(e.fichaAtual().voltas, 0);
});

test('migrar aceita lixo sem quebrar', () => {
  for (const lixo of [null, 3, 'x', [], { partidas: 'não' }, { partidas: [null, { fichas: [null, { xp: 3 }] }] }]) {
    const m = migrar(lixo);
    assert.equal(m.versao, VERSAO);
    assert.ok(Array.isArray(m.partidas));
  }
});

test('JSON corrompido no storage vira estado vazio, sem crash, e guarda o original', () => {
  const storage = storageEmMemoria();
  storage.setItem(CHAVE, '{"versao":1,"partidas":[{');
  const e = criarEstado(storage);
  const est = e.carregar();
  assert.deepEqual(est, { versao: VERSAO, partidas: [], partidaAtiva: null, fichaAtiva: null });
  assert.equal(storage.getItem(CHAVE_CORROMPIDO), '{"versao":1,"partidas":[{');
  assert.ok(e.adicionarFicha(S1));
});

test('storage cheio (QuotaExceededError) não quebra e o estado em memória continua', () => {
  const storage = storageCheio();
  const e = criarEstado(storage);
  e.carregar();
  const f = e.adicionarFicha(S1);
  storage.cheio = true;
  assert.doesNotThrow(() => e.alterarFicha(f.id, (x) => { x.xp = 5; }));
  assert.equal(e.fichaAtual().xp, 5);
  assert.equal(e.salvar(), false);
  assert.equal(e.ultimoErro.name, 'QuotaExceededError');
  assert.doesNotThrow(() => e.novaPartida('outra'));
  storage.cheio = false;
  assert.equal(e.salvar(), true);
  assert.equal(e.ultimoErro, null);
});

test('storage que lança ao ler (bloqueado) não quebra', () => {
  const e = criarEstado({ getItem() { throw new Error('SecurityError'); }, setItem() { throw new Error('SecurityError'); } });
  assert.deepEqual(e.carregar().partidas, []);
  assert.ok(e.adicionarFicha(S1));
});

test('abrir partida troca a ficha ativa', () => {
  const e = criarEstado(storageEmMemoria());
  e.carregar();
  const a = e.novaPartida('A');
  const fa = e.adicionarFicha(S1);
  e.novaPartida('B');
  e.adicionarFicha(S2);
  assert.equal(e.abrirPartida(a.id).id, a.id);
  assert.equal(e.estado.fichaAtiva, fa.id);
  assert.equal(e.abrirPartida('nao-existe'), null);
});
