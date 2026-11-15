import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  NIVEIS, nivelPorXp, nivelAtual, aplicarXp, habilidadesAtivas, escolhaPendente, escolher,
  acoesDoTurno, vidaMax, temHoard,
} from '../js/regras.js';

// Sobreviventes de mentira (js/dados ainda não existe).
const ADULTO = {
  id: 'teste-adulto', nome: 'Adulto de Teste', tipo: 'adulto', vida: 3,
  habilidades: {
    azul: ['mais-1-acao-gratis-movimento'],
    amarelo: ['mais-1-acao'],
    laranja: ['lar-a', 'lar-b'],
    vermelho: ['ver-a', 'ver-b', 'ver-c'],
  },
  fonte: 'teste', confirmado: false,
};
const KID = {
  id: 'teste-kid', nome: 'Kid de Teste', tipo: 'kid', vida: 2,
  habilidades: { azul: ['escorregadio'], amarelo: ['mais-1-acao'], laranja: ['hoard', 'lar-k'], vermelho: ['ver-x', 'ver-y', 'comeca-com-4-de-vida'] },
  fonte: 'teste', confirmado: false,
};

function ficha(extra = {}) {
  return {
    id: 'f1', sobreviventeId: 'teste-adulto', xp: 0, voltas: 0,
    escolhas: { laranja: [], vermelho: [] }, ferimentos: 0,
    acoesGastas: { normais: 0, gratis: {} },
    inventario: { maos: [null, null], mochila: [null, null, null], extra: [null, null] },
    objetivos: 0, ultrared: false, ...extra,
  };
}

test('NIVEIS segue o contrato', () => {
  assert.deepEqual(NIVEIS.map((n) => [n.id, n.min]), [['azul', 0], ['amarelo', 7], ['laranja', 19], ['vermelho', 43]]);
});

test('limites 6/7, 18/19 e 42/43', () => {
  assert.equal(nivelPorXp(0), 'azul');
  assert.equal(nivelPorXp(6), 'azul');
  assert.equal(nivelPorXp(7), 'amarelo');
  assert.equal(nivelPorXp(18), 'amarelo');
  assert.equal(nivelPorXp(19), 'laranja');
  assert.equal(nivelPorXp(42), 'laranja');
  assert.equal(nivelPorXp(43), 'vermelho');
  assert.equal(nivelPorXp(99), 'vermelho');
  assert.equal(nivelPorXp(-3), 'azul');
});

test('aplicarXp sobe um nível por vez nos limites', () => {
  let r = aplicarXp(ficha({ xp: 6 }), 1, { sobrevivente: ADULTO });
  assert.deepEqual(r.niveisNovos, ['amarelo']);
  assert.equal(r.escolhaPendente, null);

  r = aplicarXp(ficha({ xp: 18 }), 1, { sobrevivente: ADULTO });
  assert.deepEqual(r.niveisNovos, ['laranja']);
  assert.deepEqual(r.escolhaPendente, { nivel: 'laranja', opcoes: ['lar-a', 'lar-b'] });

  r = aplicarXp(ficha({ xp: 42, escolhas: { laranja: ['lar-a'], vermelho: [] } }), 1, { sobrevivente: ADULTO });
  assert.equal(r.ficha.xp, 43);
  assert.deepEqual(r.niveisNovos, ['vermelho']);
  assert.deepEqual(r.escolhaPendente, { nivel: 'vermelho', opcoes: ['ver-a', 'ver-b', 'ver-c'] });

  r = aplicarXp(ficha({ xp: 5 }), 1);
  assert.deepEqual(r.niveisNovos, []);
});

test('aplicarXp não altera a ficha recebida', () => {
  const f = ficha({ xp: 18 });
  const copia = structuredClone(f);
  aplicarXp(f, 30, { sobrevivente: ADULTO });
  assert.deepEqual(f, copia);
});

test('salto múltiplo de 5 para 45 lista os 3 níveis e pede laranja e depois vermelho', () => {
  const r = aplicarXp(ficha({ xp: 5 }), 40, { sobrevivente: ADULTO });
  assert.equal(r.ficha.xp, 45);
  assert.deepEqual(r.niveisNovos, ['amarelo', 'laranja', 'vermelho']);
  assert.deepEqual(r.escolhaPendente, { nivel: 'laranja', opcoes: ['lar-a', 'lar-b'] });
  const f2 = escolher(r.ficha, 'laranja', 'lar-b');
  assert.deepEqual(escolhaPendente(f2, ADULTO), { nivel: 'vermelho', opcoes: ['ver-a', 'ver-b', 'ver-c'] });
  const f3 = escolher(f2, 'vermelho', 'ver-c');
  assert.equal(escolhaPendente(f3, ADULTO), null);
  assert.deepEqual(habilidadesAtivas(f3, ADULTO), ['mais-1-acao-gratis-movimento', 'mais-1-acao', 'lar-b', 'ver-c']);
});

test('sem Ultrared o XP passa de 43 sem dar volta e não fica negativo', () => {
  let r = aplicarXp(ficha({ xp: 40, escolhas: { laranja: ['lar-a'], vermelho: [] } }), 10);
  assert.equal(r.ficha.xp, 50);
  assert.equal(r.ficha.voltas, 0);
  r = aplicarXp(ficha({ xp: 2 }), -5);
  assert.equal(r.ficha.xp, 0);
});

test('correção com −1 baixa o nível mas guarda a escolha e não pede de novo', () => {
  const f = ficha({ xp: 19, escolhas: { laranja: ['lar-a'], vermelho: [] } });
  const r1 = aplicarXp(f, -1, { sobrevivente: ADULTO });
  assert.equal(nivelAtual(r1.ficha), 'amarelo');
  assert.deepEqual(r1.ficha.escolhas.laranja, ['lar-a']);
  assert.ok(!habilidadesAtivas(r1.ficha, ADULTO).includes('lar-a'));
  const r2 = aplicarXp(r1.ficha, 1, { sobrevivente: ADULTO });
  assert.equal(r2.escolhaPendente, null);
  assert.ok(habilidadesAtivas(r2.ficha, ADULTO).includes('lar-a'));
});

test('Ultrared: de 40 para 50 volta para 7, conta a volta e continua no Vermelho', () => {
  const f = ficha({ xp: 40, ultrared: true, escolhas: { laranja: ['lar-a'], vermelho: [] } });
  const r = aplicarXp(f, 10, { sobrevivente: ADULTO });
  assert.equal(r.ficha.xp, 7);
  assert.equal(r.ficha.voltas, 1);
  assert.equal(nivelAtual(r.ficha), 'vermelho');
  assert.deepEqual(r.niveisNovos, ['vermelho']);
  assert.deepEqual(r.escolhaPendente, { nivel: 'vermelho', opcoes: ['ver-a', 'ver-b', 'ver-c'] });
});

test('Ultrared: na volta seguinte de 40 para 50 pede vermelho não repetido', () => {
  const f = ficha({ xp: 40, voltas: 1, ultrared: true, escolhas: { laranja: ['lar-a', 'lar-b'], vermelho: ['ver-b'] } });
  const r = aplicarXp(f, 10, { sobrevivente: ADULTO });
  assert.equal(r.ficha.xp, 7);
  assert.equal(r.ficha.voltas, 2);
  assert.deepEqual(r.niveisNovos, []);
  assert.deepEqual(r.escolhaPendente, { nivel: 'vermelho', opcoes: ['ver-a', 'ver-c'] });
  // mantém todas as habilidades
  const ativas = habilidadesAtivas(r.ficha, ADULTO);
  for (const h of ['mais-1-acao', 'lar-a', 'lar-b', 'ver-b']) assert.ok(ativas.includes(h), h);
});

test('Ultrared: ao passar de novo por 19 pede o laranja que ainda não pegou', () => {
  const f = ficha({ xp: 15, voltas: 1, ultrared: true, escolhas: { laranja: ['lar-a'], vermelho: ['ver-a'] } });
  const r = aplicarXp(f, 5, { sobrevivente: ADULTO });
  assert.deepEqual(r.escolhaPendente, { nivel: 'laranja', opcoes: ['lar-b'] });
});

test('Ultrared: sem opções na árvore, a escolha vem da lista geral sem repetir', () => {
  const f = ficha({ xp: 15, voltas: 2, ultrared: true, escolhas: { laranja: ['lar-a', 'lar-b'], vermelho: ['ver-a', 'ver-b'] } });
  const geral = { 'lar-a': {}, 'ver-a': {}, sortudo: {}, 'mais-1-acao': {}, medico: {} };
  const r = aplicarXp(f, 5, { sobrevivente: ADULTO, habilidades: geral });
  assert.deepEqual(r.escolhaPendente, { nivel: 'laranja', opcoes: ['sortudo', 'medico'] });
});

test('Ultrared: a opção da ficha vale quando não vem nas opções, e o −XP desfaz a volta', () => {
  const f = ficha({ xp: 40, ultrared: true, escolhas: { laranja: ['lar-a'], vermelho: [] } });
  const ida = aplicarXp(f, 10);
  assert.equal(ida.ficha.voltas, 1);
  const volta = aplicarXp(ida.ficha, -10);
  assert.equal(volta.ficha.xp, 40);
  assert.equal(volta.ficha.voltas, 0);
  // opção explícita desliga mesmo com a ficha marcada
  assert.equal(aplicarXp(f, 10, { ultrared: false }).ficha.xp, 50);
});

test('Ultrared: um salto grande dá várias voltas', () => {
  const r = aplicarXp(ficha({ xp: 0, ultrared: true }), 90, { sobrevivente: ADULTO });
  assert.equal(r.ficha.voltas, 2);
  assert.equal(r.ficha.xp, 4);
  assert.deepEqual(r.niveisNovos, ['amarelo', 'laranja', 'vermelho']);
});

test('vida: adulto 3, Kid 2, sem `vida` usa o tipo e "Starts with X Health" troca a inicial', () => {
  assert.equal(vidaMax(ficha(), ADULTO), 3);
  assert.equal(vidaMax(ficha({ sobreviventeId: 'teste-kid' }), KID), 2);
  assert.equal(vidaMax(ficha(), { ...KID, vida: undefined }), 2);
  assert.equal(vidaMax(ficha(), { ...ADULTO, vida: undefined }), 3);
  const kidVermelho = ficha({ xp: 43, escolhas: { laranja: ['lar-k'], vermelho: ['comeca-com-4-de-vida'] } });
  assert.equal(vidaMax(kidVermelho, KID), 4);
});

test('Hoard só vale quando a habilidade está ativa', () => {
  assert.equal(temHoard(ficha({ xp: 10, escolhas: { laranja: ['hoard'], vermelho: [] } }), KID), false);
  assert.equal(temHoard(ficha({ xp: 19, escolhas: { laranja: ['hoard'], vermelho: [] } }), KID), true);
  assert.equal(temHoard(ficha({ xp: 19, escolhas: { laranja: ['lar-k'], vermelho: [] } }), KID), false);
});

test('ações do turno: 3 normais, +1 no amarelo e grátis por tipo à parte', () => {
  assert.deepEqual(acoesDoTurno(ficha(), ADULTO), { normais: 3, gratis: { movimento: 1 } });
  assert.deepEqual(acoesDoTurno(ficha({ xp: 7 }), ADULTO), { normais: 4, gratis: { movimento: 1 } });
  const s = { ...ADULTO, habilidades: { ...ADULTO.habilidades, vermelho: ['mais-1-acao-gratis-combate', 'mais-1-acao-gratis-movimento', 'ver-c'] } };
  const f = ficha({ xp: 43, escolhas: { laranja: ['lar-a'], vermelho: ['mais-1-acao-gratis-movimento'] } });
  assert.deepEqual(acoesDoTurno(f, s), { normais: 4, gratis: { movimento: 1 } });
  const f2 = ficha({ xp: 43, escolhas: { laranja: ['mais-1-acao'], vermelho: ['mais-1-acao-gratis-combate'] } });
  assert.deepEqual(acoesDoTurno(f2, s), { normais: 4, gratis: { movimento: 1, combate: 1 } });
});

test('escolher rejeita nível sem escolha e não duplica', () => {
  assert.throws(() => escolher(ficha(), 'amarelo', 'x'));
  const f = escolher(escolher(ficha(), 'laranja', 'lar-a'), 'laranja', 'lar-a');
  assert.deepEqual(f.escolhas.laranja, ['lar-a']);
});
