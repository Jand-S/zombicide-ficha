import { test } from 'node:test';
import assert from 'node:assert/strict';
import { HABILIDADES } from '../js/dados/habilidades.js';
import { SOBREVIVENTES } from '../js/dados/sobreviventes.js';
import { EQUIPAMENTOS } from '../js/dados/equipamentos.js';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const RAIZ = fileURLToPath(new URL('..', import.meta.url));

const repetidos = (lista) => lista.filter((x, i) => lista.indexOf(x) !== i);

test('toda habilidade tem nome, pt, desc e fonte, e o hid é kebab-case', () => {
  for (const [hid, hab] of Object.entries(HABILIDADES)) {
    assert.match(hid, /^[a-z0-9]+(-[a-z0-9]+)*$/, hid);
    for (const campo of ['nome', 'pt', 'desc', 'fonte']) {
      assert.equal(typeof hab[campo], 'string', `${hid}.${campo}`);
      assert.ok(hab[campo].length > 0, `${hid}.${campo}`);
    }
  }
  assert.ok(HABILIDADES['mais-1-acao']);
  assert.ok(HABILIDADES['mais-1-acao-gratis-movimento']);
  assert.ok(HABILIDADES.sortudo);
});

test('são os 12 sobreviventes da caixa base, com ids únicos', () => {
  const ids = SOBREVIVENTES.map((s) => s.id);
  assert.deepEqual(repetidos(ids), []);
  assert.deepEqual(SOBREVIVENTES.map((s) => s.nome).sort(), [
    'Amy', 'Bunny G', 'Doug', 'Elle', 'Josh', 'Lili', 'Lou', 'Ned', 'Odin', 'Ostara', 'Tiger Sam', 'Wanda',
  ]);
});

test('todo hid usado nas árvores existe em HABILIDADES', () => {
  for (const s of SOBREVIVENTES) {
    for (const [nivel, lista] of Object.entries(s.habilidades)) {
      for (const hid of lista) assert.ok(HABILIDADES[hid], `${s.id}.${nivel}: ${hid}`);
    }
  }
});

test('cada árvore tem 1 azul, 1 amarelo, 2 laranja e 3 vermelho, sem opção repetida no nível', () => {
  for (const s of SOBREVIVENTES) {
    const { azul, amarelo, laranja, vermelho } = s.habilidades;
    assert.equal(azul.length, 1, s.id);
    assert.equal(amarelo.length, 1, s.id);
    assert.equal(laranja.length, 2, s.id);
    assert.equal(vermelho.length, 3, s.id);
    assert.deepEqual(repetidos(laranja), [], s.id);
    assert.deepEqual(repetidos(vermelho), [], s.id);
  }
});

test('sobrevivente: campos do contrato; sem confirmação, tipo e vida ficam null', () => {
  for (const s of SOBREVIVENTES) {
    assert.equal(typeof s.fonte, 'string', s.id);
    assert.equal(typeof s.confirmado, 'boolean', s.id);
    assert.ok([null, 'adulto', 'kid'].includes(s.tipo), s.id);
    assert.ok(s.vida === null || Number.isInteger(s.vida), s.id);
    if (s.confirmado) {
      assert.notEqual(s.tipo, null, s.id);
      assert.notEqual(s.vida, null, s.id);
    }
  }
});

test('os 12 conferidos no ID Card: 6 kids com vida 2 e 6 adultos com vida 3', () => {
  assert.ok(SOBREVIVENTES.every((s) => s.confirmado));
  const kids = SOBREVIVENTES.filter((s) => s.tipo === 'kid');
  const adultos = SOBREVIVENTES.filter((s) => s.tipo === 'adulto');
  assert.deepEqual(kids.map((s) => s.nome).sort(), ['Bunny G', 'Lili', 'Lou', 'Odin', 'Ostara', 'Tiger Sam']);
  assert.deepEqual(adultos.map((s) => s.nome).sort(), ['Amy', 'Doug', 'Elle', 'Josh', 'Ned', 'Wanda']);
  for (const s of kids) assert.equal(s.vida, 2, s.id);
  for (const s of adultos) assert.equal(s.vida, 3, s.id);
});

test('equipamentos: ids únicos e soma de qtd igual a 63', () => {
  assert.deepEqual(repetidos(EQUIPAMENTOS.map((e) => e.id)), []);
  assert.equal(EQUIPAMENTOS.reduce((t, e) => t + e.qtd, 0), 63);
  assert.equal(EQUIPAMENTOS.filter((e) => e.inicial).reduce((t, e) => t + e.qtd, 0), 6);
  // Épicos da lista de componentes (docs/regras-2e.md): nome e quantidade exatos.
  const epicos = EQUIPAMENTOS.filter((e) => e.epico).map((e) => `${e.nome} x${e.qtd}`).sort();
  assert.deepEqual(epicos, [
    'Aaahh! x2', 'Army Sniper Rifle x1', 'Automatic Shotgun x1', 'Evil Twins x1', 'Golden AK-47 x1',
    'Golden Kukri x1', 'Gunblade x1', "Ma's Shotgun x1", 'Nailbat x1', 'Zantetsuken x1',
  ]);
  // A 63ª carta é a de referência do Car (lista de componentes do rulebook).
  assert.equal(EQUIPAMENTOS.find((e) => e.id === 'car-referencia')?.qtd, 1);
  assert.equal(EQUIPAMENTOS.find((e) => e.id === 'carta-nao-identificada'), undefined);
});

test('equipamentos: arma confirmada tem tipo, alcance e barulho; corpo a corpo tem alcance 0-0', () => {
  const armas = EQUIPAMENTOS.filter((e) => e.confirmado && (e.tipo === 'corpo' || e.tipo === 'distancia'));
  assert.equal(armas.length, 23);
  for (const e of armas) {
    assert.ok(Array.isArray(e.alcance), e.id);
    assert.equal(typeof e.dual, 'boolean', e.id);
    assert.equal(typeof e.barulhento, 'boolean', e.id);
    if (e.tipo === 'corpo') assert.deepEqual(e.alcance, [0, 0], e.id);
  }
  const porId = Object.fromEntries(EQUIPAMENTOS.map((e) => [e.id, e]));
  assert.deepEqual([porId.katana.dados, porId.katana.dano, porId.katana.barulhento], [2, 1, false]);
  assert.deepEqual(porId['sniper-rifle'].alcance, [1, 3]);
  assert.deepEqual(porId['sawed-off'].alcance, [0, 1]);
  assert.equal(porId.pistol.dual, true);
  assert.deepEqual([porId['fire-axe'].abrePorta, porId['fire-axe'].barulhento], ['barulhento', false]);
});

test('equipamentos: todos os campos do contrato, com valores válidos ou null', () => {
  const campos = ['id', 'nome', 'tipo', 'dados', 'precisao', 'dano', 'alcance', 'dual', 'abrePorta', 'barulhento',
    'epico', 'inicial', 'qtd', 'fonte', 'confirmado'];
  for (const e of EQUIPAMENTOS) {
    const opcionais = ['imagem', 'perfis'];
    assert.deepEqual(Object.keys(e).filter((k) => !opcionais.includes(k)).sort(), [...campos].sort(), e.id);
    assert.ok(e.imagem === undefined || typeof e.imagem === 'string', `${e.id}.imagem`);
    if (e.perfis !== undefined) {
      assert.ok(Array.isArray(e.perfis) && e.perfis.length === 2 && e.tipo === 'ambos', `${e.id}.perfis`);
      for (const p of e.perfis) {
        assert.ok(['corpo', 'distancia'].includes(p.tipo), `${e.id}.perfis.tipo`);
        for (const n of ['dados', 'precisao', 'dano']) assert.ok(Number.isInteger(p[n]), `${e.id}.perfis.${n}`);
        assert.equal(typeof p.barulhento, 'boolean', `${e.id}.perfis.barulhento`);
      }
    }
    assert.ok(typeof e.nome === 'string' || (e.nome === null && !e.confirmado), e.id);
    assert.ok([null, 'corpo', 'distancia', 'ambos', 'item'].includes(e.tipo), e.id);
    assert.ok([null, 'silencioso', 'barulhento'].includes(e.abrePorta), e.id);
    for (const n of ['dados', 'precisao', 'dano']) assert.ok(e[n] === null || Number.isInteger(e[n]), `${e.id}.${n}`);
    for (const b of ['dual', 'barulhento']) assert.ok(e[b] === null || typeof e[b] === 'boolean', `${e.id}.${b}`);
    assert.ok(e.alcance === null || (e.alcance.length === 2 && e.alcance[0] <= e.alcance[1]), e.id);
    assert.ok(Number.isInteger(e.qtd) && e.qtd > 0, e.id);
    assert.equal(typeof e.fonte, 'string', e.id);
    assert.equal(typeof e.confirmado, 'boolean', e.id);
  }
});

test('imagens oficiais: todo imagem/card é caminho relativo e o arquivo existe', () => {
  const campos = [
    ...SOBREVIVENTES.flatMap((s) => [['imagem', s], ['card', s]]),
    ...EQUIPAMENTOS.map((e) => ['imagem', e]),
  ];
  let usados = 0;
  for (const [campo, x] of campos) {
    if (x[campo] === undefined) continue; // opcional
    usados++;
    const c = x[campo];
    assert.equal(typeof c, 'string', `${x.id}.${campo}`);
    assert.match(c, /^assets\/oficial\/[a-z0-9/-]+\.(jpg|png)$/, `${x.id}.${campo}: relativo, dentro de assets/oficial`);
    assert.ok(existsSync(RAIZ + c), `${x.id}.${campo}: não existe ${c}`);
  }
  // os 12 têm retrato e ID Card
  for (const s of SOBREVIVENTES) assert.ok(s.imagem && s.card, s.id);
  assert.ok(usados >= 24);
});
