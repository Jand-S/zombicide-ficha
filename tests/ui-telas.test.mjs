import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fichaVazia } from '../js/estado.js';
import { SOBREVIVENTES } from '../js/dados/sobreviventes.js';
import { HABILIDADES } from '../js/dados/habilidades.js';
import { telaFicha, telaMesa, telaPartidas, telaEscolher, folhaEscolha } from '../js/ui/telas.js';

const SOB = Object.fromEntries(SOBREVIVENTES.map((s) => [s.id, s]));
const conferir = SOBREVIVENTES.find((s) => s.confirmado === false);
const confirmado = SOBREVIVENTES.find((s) => s.confirmado === true);

function contar(html, re) {
  return (html.match(re) ?? []).length;
}

test('ficha: cada ação frequente é um botão de 1 toque', () => {
  // Sobrevivente de mentira com 1 ação grátis de movimento na azul.
  const s = { id: 't', nome: 'Teste', tipo: 'adulto', vida: 3, confirmado: true,
    habilidades: { azul: ['mais-1-acao-gratis-movimento'], amarelo: ['mais-1-acao'], laranja: [], vermelho: [] } };
  const f = fichaVazia('t', 'f1');
  const html = telaFicha({ ficha: f, sobrevivente: s, habilidades: HABILIDADES, fichasDaMesa: [f], sobreviventes: { t: s } });
  for (const d of ['-1', '1', '5']) assert.match(html, new RegExp(`data-acao="xp" data-delta="${d}"`));
  assert.equal(contar(html, /data-acao="coracao"/g), 3);
  assert.equal(contar(html, /data-acao="pip"/g), 3 + 1); // 3 normais + 1 grátis de movimento
  assert.equal(contar(html, /data-acao="pip" data-tipo="movimento"/g), 1);
  assert.match(html, /data-acao="novo-turno"/);
  assert.match(html, /data-acao="objetivo" data-delta="1"/);
  assert.match(html, /class="topo topo-ficha"/);
  assert.match(html, /class="barra-perigo/);
});

test('selo "habilidades a conferir" só aparece com confirmado:false', () => {
  const a = telaFicha({ ficha: fichaVazia(conferir.id, 'a'), sobrevivente: conferir, habilidades: HABILIDADES });
  const b = telaFicha({ ficha: fichaVazia(confirmado.id, 'b'), sobrevivente: confirmado, habilidades: HABILIDADES });
  assert.match(a, /habilidades a conferir/);
  assert.doesNotMatch(b, /habilidades a conferir/);
  const lista = telaEscolher({ sobreviventes: SOBREVIVENTES, habilidades: HABILIDADES });
  assert.equal(contar(lista, /habilidades a conferir/g), SOBREVIVENTES.filter((s) => !s.confirmado).length);
  assert.equal(contar(lista, /data-acao="adicionar"/g), SOBREVIVENTES.length);
});

test('mesa troca de ficha em 1 toque e escapa nomes de partida', () => {
  const f1 = fichaVazia('ostara', 'f1');
  const f2 = fichaVazia('lili', 'f2');
  const partida = { id: 'p', nome: '<b>x</b>', fichas: [f1, f2], atualizadaEm: 0 };
  const mesa = telaMesa({ partida, sobreviventes: SOB, fichaAtiva: 'f1' });
  assert.match(mesa, /data-acao="abrir-ficha" data-id="f2"/);
  assert.match(mesa, /&lt;b&gt;x&lt;\/b&gt;/);
  const ficha = telaFicha({ ficha: f1, sobrevivente: SOB.ostara, habilidades: HABILIDADES, fichasDaMesa: [f1, f2], sobreviventes: SOB });
  assert.match(ficha, /data-acao="abrir-ficha" data-id="f2"/);
  const partidas = telaPartidas({ partidas: [partida], partidaAtiva: null });
  assert.match(partidas, /data-acao="retomar" data-id="p"/);
  assert.doesNotMatch(partidas, /<b>x<\/b>/);
});

test('ficha com escolha pendente mostra o botão e a folha lista as opções', () => {
  const s = SOB.ostara;
  const f = { ...fichaVazia(s.id, 'f'), xp: 19 };
  const html = telaFicha({ ficha: f, sobrevivente: s, habilidades: HABILIDADES });
  assert.match(html, /data-acao="abrir-escolha"/);
  const folha = folhaEscolha({ escolha: { nivel: 'laranja', opcoes: s.habilidades.laranja }, habilidades: HABILIDADES, nomeSobrevivente: s.nome });
  assert.equal(contar(folha, /data-acao="escolher"/g), 2);
  assert.match(folha, new RegExp(HABILIDADES[s.habilidades.laranja[0]].pt.replace(/[+]/g, '\\+')));
});
