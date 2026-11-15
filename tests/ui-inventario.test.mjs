import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fichaVazia } from '../js/estado.js';
import { EQUIPAMENTOS } from '../js/dados/equipamentos.js';
import { HABILIDADES } from '../js/dados/habilidades.js';
import {
  toqueSlot, moverSlot, porNoSlot, lerSlot, slotsDaFicha, buscarCartas, atributosCarta, nomeDoSlot, MAX_TEXTO,
} from '../js/ui/inventario.js';
import { telaFicha, folhaCartas, listaCartas } from '../js/ui/telas.js';

const EQ = Object.fromEntries(EQUIPAMENTOS.map((e) => [e.id, e]));
const MAO1 = { area: 'maos', i: 0 };
const MOCH2 = { area: 'mochila', i: 1 };

function comPistola() {
  const f = fichaVazia('t', 'f1');
  f.inventario.maos[0] = { equipId: 'pistol-inicial' };
  return f;
}

function contar(html, re) {
  return (html.match(re) ?? []).length;
}

test('mão → mochila leva 2 toques (seleciona, toca no destino)', () => {
  const f = comPistola();
  const t1 = toqueSlot(null, f, MAO1);
  assert.deepEqual(t1, { sel: MAO1, efeito: null }); // 1º toque só seleciona
  const t2 = toqueSlot(t1.sel, f, MOCH2);
  assert.equal(t2.sel, null);
  assert.deepEqual(t2.efeito, { tipo: 'mover', de: MAO1, para: MOCH2 }); // 2º toque move
  const nova = moverSlot(f, t2.efeito.de, t2.efeito.para);
  assert.equal(lerSlot(nova, MAO1), null);
  assert.deepEqual(lerSlot(nova, MOCH2), { equipId: 'pistol-inicial' });
  assert.deepEqual(f.inventario.maos[0], { equipId: 'pistol-inicial' }, 'não muda a ficha original');
});

test('mover para slot ocupado troca as duas cartas', () => {
  const f = comPistola();
  f.inventario.mochila[1] = { texto: 'Chave' };
  const nova = moverSlot(f, MAO1, MOCH2);
  assert.deepEqual(lerSlot(nova, MAO1), { texto: 'Chave' });
  assert.deepEqual(lerSlot(nova, MOCH2), { equipId: 'pistol-inicial' });
});

test('toque em slot vazio sem seleção abre a folha de cartas; tocar de novo no selecionado cancela', () => {
  const f = comPistola();
  assert.deepEqual(toqueSlot(null, f, MOCH2), { sel: null, efeito: { tipo: 'cartas', alvo: MOCH2 } });
  assert.deepEqual(toqueSlot(MAO1, f, MAO1), { sel: null, efeito: null });
  assert.deepEqual(toqueSlot(null, f, { area: 'cinto', i: 0 }), { sel: null, efeito: null });
  assert.deepEqual(moverSlot(f, MAO1, { area: 'mochila', i: 9 }), f, 'destino inválido não muda nada');
});

test('porNoSlot põe carta, texto livre (aparado e limitado) ou esvazia', () => {
  let f = fichaVazia('t', 'f1');
  f = porNoSlot(f, MOCH2, { equipId: 'katana' });
  assert.deepEqual(lerSlot(f, MOCH2), { equipId: 'katana' });
  f = porNoSlot(f, MOCH2, { texto: '   chave   do carro  ' });
  assert.deepEqual(lerSlot(f, MOCH2), { texto: 'chave do carro' });
  f = porNoSlot(f, MOCH2, { texto: 'x'.repeat(100) });
  assert.equal(lerSlot(f, MOCH2).texto.length, MAX_TEXTO);
  f = porNoSlot(f, MOCH2, { texto: '   ' });
  assert.equal(lerSlot(f, MOCH2), null);
  f = porNoSlot(porNoSlot(f, MAO1, { equipId: 'katana' }), MAO1, null);
  assert.equal(lerSlot(f, MAO1), null);
});

test('slots extras só aparecem com Hoard (ou se ainda guardam carta)', () => {
  const f = fichaVazia('t', 'f1');
  assert.equal(slotsDaFicha(f, false).extra, null);
  assert.equal(slotsDaFicha(f, true).extra.length, 2);
  f.inventario.extra[1] = { equipId: 'water' };
  assert.equal(slotsDaFicha(f, false).extra.length, 2);
  assert.equal(nomeDoSlot({ area: 'extra', i: 1 }), 'Hoard 2');
});

test('busca de cartas ignora caixa e acento e pula a carta sem nome', () => {
  const todas = buscarCartas(EQUIPAMENTOS, '');
  assert.equal(todas.length, EQUIPAMENTOS.filter((e) => e.nome).length);
  assert.ok(todas.every((e) => e.nome));
  assert.deepEqual(buscarCartas(EQUIPAMENTOS, 'KATÁ').map((e) => e.id), ['katana']);
  assert.deepEqual(buscarCartas(EQUIPAMENTOS, 'sniper army').map((e) => e.id), ['army-sniper-rifle']);
  const pistolas = buscarCartas(EQUIPAMENTOS, 'pistol').map((e) => e.id);
  assert.deepEqual(pistolas, ['pistol-inicial', 'pistol']);
  assert.equal(buscarCartas(EQUIPAMENTOS, 'zzz').length, 0);
});

test('atributos sem dado aparecem como "—", nunca chutados', () => {
  const a = Object.fromEntries(atributosCarta(EQ.katana).map((x) => [x.id, x.valor]));
  assert.equal(a.dano, '1');
  assert.equal(a.barulho, 'não');
  assert.equal(a.dados, '—');
  assert.equal(a.precisao, '—');
  const s = Object.fromEntries(atributosCarta(EQ['sawed-off']).map((x) => [x.id, x.valor]));
  assert.equal(s.alcance, '0–1');
  const p = Object.fromEntries(atributosCarta(EQ['fire-axe']).map((x) => [x.id, x.valor]));
  assert.equal(p.porta, 'barulhenta');
});

test('ficha mostra 2 mãos + 3 mochila, e +2 com Hoard', () => {
  const sem = { id: 't', nome: 'T', tipo: 'adulto', vida: 3, confirmado: true,
    habilidades: { azul: [], amarelo: [], laranja: [], vermelho: [] } };
  const com = { ...sem, habilidades: { ...sem.habilidades, azul: ['hoard'] } };
  const f = comPistola();
  const h1 = telaFicha({ ficha: f, sobrevivente: sem, habilidades: HABILIDADES, equipamentos: EQ });
  assert.equal(contar(h1, /data-acao="slot"/g), 5);
  assert.equal(contar(h1, /data-area="maos"/g), 2);
  assert.match(h1, /Pistol/);
  const h2 = telaFicha({ ficha: f, sobrevivente: com, habilidades: HABILIDADES, equipamentos: EQ });
  assert.equal(contar(h2, /data-acao="slot"/g), 7);
  assert.equal(contar(h2, /data-area="extra"/g), 2);
});

test('slot selecionado aparece marcado, com Trocar carta e Descartar', () => {
  const s = { id: 't', nome: 'T', tipo: 'adulto', vida: 3, confirmado: true, habilidades: {} };
  const html = telaFicha({ ficha: comPistola(), sobrevivente: s, habilidades: HABILIDADES, equipamentos: EQ, selecionado: MAO1 });
  assert.equal(contar(html, /slot--selecionado/g), 1);
  assert.match(html, /data-acao="slot-cartas"/);
  assert.match(html, /data-acao="slot-descartar"/);
  assert.match(html, /aria-label="Mochila 2: vazio|Mover para mochila 2/);
});

test('folha de cartas tem busca, atributos, texto livre e esvaziar', () => {
  const html = folhaCartas({ alvo: MAO1, slotAtual: { texto: 'a "b"' }, cartas: EQUIPAMENTOS });
  assert.match(html, /data-busca="cartas"/);
  assert.match(html, /data-form="texto-livre"/);
  assert.match(html, /value="a &quot;b&quot;"/);
  assert.match(html, /data-acao="slot-esvaziar"/);
  assert.equal(contar(html, /data-acao="por-carta"/g), EQUIPAMENTOS.filter((e) => e.nome).length);
  assert.match(html, /Precisão —/);
  const so = listaCartas({ cartas: EQUIPAMENTOS, termo: 'machete' });
  assert.equal(contar(so, /data-acao="por-carta"/g), 1);
  assert.doesNotMatch(folhaCartas({ alvo: MAO1, slotAtual: null, cartas: EQUIPAMENTOS }), /slot-esvaziar/);
});
