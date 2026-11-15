// Link, backup ou storage com dado inventado: a ficha entra saneada (ou não entra) e o app não trava.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarEstado, storageEmMemoria, normalizarFicha, migrar, fichaDoLink, CHAVE } from '../js/estado.js';
import { SOBREVIVENTES } from '../js/dados/sobreviventes.js';
import { HABILIDADES } from '../js/dados/habilidades.js';
import { telaFicha } from '../js/ui/telas.js';
import { vidaMax } from '../js/regras.js';

const SOB = Object.fromEntries(SOBREVIVENTES.map((s) => [s.id, s]));
const CATALOGO = { habilidades: HABILIDADES, sobreviventes: SOB };
const BOA = 'mais-1-acao';

function link(compacto) {
  return '#f=' + Buffer.from(JSON.stringify(compacto)).toString('base64url');
}
// [versão, sobrevivente, xp, voltas, laranja, vermelho, ferimentos, normais, grátis, slots, objetivos, ultrared]
const linkRuim = (sob = 'ostara', laranja = ['mais-99999999999-acao']) =>
  link([1, sob, 19, 0, laranja, ['comeca-com-99999999999-de-vida'], 0, 0, 0, [0, 0, 0, 0, 0, 0, 0], 0, 0]);

function desenhar(api) {
  const f = api.fichaAtual();
  return telaFicha({ ficha: f, sobrevivente: SOB[f.sobreviventeId], habilidades: HABILIDADES, fichasDaMesa: api.partidaAtual().fichas, sobreviventes: SOB });
}

test('link com escolha inventada: entra sem a escolha, desenha e reabre', () => {
  const storage = storageEmMemoria();
  const api = criarEstado(storage, CATALOGO);
  api.carregar();
  const f = api.importarLink(linkRuim('ostara', ['mais-99999999999-acao', BOA]));
  assert.ok(f);
  assert.deepEqual(f.escolhas, { laranja: [BOA], vermelho: [] });
  assert.doesNotThrow(() => desenhar(api));
  const salvo = JSON.parse(storage.getItem(CHAVE)).partidas[0].fichas[0];
  assert.deepEqual(salvo.escolhas, { laranja: [BOA], vermelho: [] });
});

test('link de sobrevivente que não existe é recusado', () => {
  const api = criarEstado(storageEmMemoria(), CATALOGO);
  api.carregar();
  assert.equal(api.importarLink(linkRuim('nao-existe-999')), null);
  assert.equal(api.estado.partidas.length, 0);
  assert.equal(fichaDoLink(linkRuim('nao-existe-999'), CATALOGO), null);
});

test('storage com escolha e sobrevivente inventados é saneado ao carregar', () => {
  const storage = storageEmMemoria();
  storage.setItem(CHAVE, JSON.stringify({
    versao: 1, partidaAtiva: 'p', fichaAtiva: 'f1',
    partidas: [{ id: 'p', nome: 'P', atualizadaEm: 1, fichas: [
      { id: 'f1', sobreviventeId: 'ostara', xp: 19, escolhas: { laranja: ['comeca-com-99999999999-de-vida'], vermelho: ['xyz'] } },
      { id: 'f2', sobreviventeId: 'fantasma', xp: 3 },
    ] }],
  }));
  const api = criarEstado(storage, CATALOGO);
  api.carregar();
  const fichas = api.estado.partidas[0].fichas;
  assert.deepEqual(fichas.map((x) => x.id), ['f1']);
  assert.deepEqual(fichas[0].escolhas, { laranja: [], vermelho: [] });
  assert.doesNotThrow(() => desenhar(api));
  // backup JSON passa pelo mesmo filtro
  assert.equal(api.importarJSON(storage.getItem(CHAVE)), true);
  assert.deepEqual(api.estado.partidas[0].fichas.map((x) => x.id), ['f1']);
  assert.deepEqual(migrar(JSON.parse(storage.getItem(CHAVE)), CATALOGO).partidas[0].fichas.length, 1);
});

test('números ficam em faixas sãs', () => {
  const bruta = {
    sobreviventeId: 'ostara', xp: 1e12, voltas: 1e9, ferimentos: 1e6, objetivos: 1e7,
    acoesGastas: { normais: 1e8, gratis: { movimento: 1e8 } },
  };
  const f = normalizarFicha(bruta, CATALOGO);
  assert.equal(f.xp, 999);
  assert.equal(f.voltas, 50);
  assert.equal(f.objetivos, 99);
  assert.equal(f.acoesGastas.normais, 20);
  assert.equal(f.acoesGastas.gratis.movimento, 20);
  assert.equal(f.ferimentos, vidaMax(f, SOB.ostara));
  // sem catálogo, os tetos fixos valem do mesmo jeito
  const g = normalizarFicha(bruta);
  assert.deepEqual([g.xp, g.voltas, g.objetivos, g.acoesGastas.normais], [999, 50, 99, 20]);
  assert.ok(g.ferimentos <= 20);
  // valores normais não mudam
  const ok = normalizarFicha({ sobreviventeId: 'ostara', xp: 42, voltas: 2, ferimentos: 1, objetivos: 3 }, CATALOGO);
  assert.deepEqual([ok.xp, ok.voltas, ok.ferimentos, ok.objetivos], [42, 2, 1, 3]);
});
