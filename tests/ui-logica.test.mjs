import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarEstado, storageEmMemoria, fichaVazia } from '../js/estado.js';
import {
  telaInicial, ferir, curar, gastarAcao, devolverAcao, novoTurno, mudarXp, mudarObjetivo, resumo, iniciais,
} from '../js/ui/logica.js';
import { criarPrefs, CHAVE_PREFS } from '../js/ui/prefs.js';

// Sobrevivente de mentira: só a forma importa.
const SOB = {
  id: 'teste', nome: 'Teste', tipo: 'adulto', vida: 3, confirmado: false,
  habilidades: {
    azul: ['mais-1-acao-gratis-movimento'], amarelo: ['mais-1-acao'],
    laranja: ['acumulador', 'sortudo'], vermelho: ['medico', 'salto', 'mais-1-acao-gratis-combate'],
  },
};
const HAB = { 'mais-1-acao': {}, acumulador: {}, sortudo: {}, medico: {}, salto: {}, extra: {} };

test('abrir o site leva direto à última ficha', () => {
  const storage = storageEmMemoria();
  const a = criarEstado(storage);
  a.carregar();
  assert.deepEqual(telaInicial(a), { tela: 'escolher' });
  a.novaPartida('Sexta');
  a.adicionarFicha('ostara');
  const f2 = a.adicionarFicha('lili');
  a.alterarFicha(f2.id, (x) => { x.xp = 9; });

  const b = criarEstado(storage);
  b.carregar();
  assert.deepEqual(telaInicial(b), { tela: 'ficha', fichaId: f2.id });
  assert.equal(b.fichaAtual().xp, 9);
});

test('tela inicial sem ficha ativa: mesa da partida ou lista de partidas', () => {
  const a = criarEstado(storageEmMemoria());
  a.carregar();
  a.novaPartida('Vazia');
  assert.deepEqual(telaInicial(a), { tela: 'mesa' });
  a.estado.partidaAtiva = null;
  assert.deepEqual(telaInicial(a), { tela: 'partidas' });
});

test('ferir para na vida máxima e curar para no zero, sem mexer na original', () => {
  const f = fichaVazia('teste', 'x');
  let g = ferir(ferir(ferir(ferir(f, 3), 3), 3), 3);
  assert.equal(g.ferimentos, 3);
  assert.equal(f.ferimentos, 0);
  assert.equal(resumo(g, SOB).eliminado, true);
  g = curar(curar(curar(curar(g))));
  assert.equal(g.ferimentos, 0);
});

test('pips: gastar até o total, devolver e novo turno zera tudo', () => {
  let f = fichaVazia('teste', 'x');
  for (let i = 0; i < 5; i++) f = gastarAcao(f, null, 3);
  assert.equal(f.acoesGastas.normais, 3);
  f = gastarAcao(gastarAcao(f, 'movimento', 1), 'movimento', 1);
  assert.equal(f.acoesGastas.gratis.movimento, 1);
  f = devolverAcao(f, null);
  assert.equal(f.acoesGastas.normais, 2);
  f = devolverAcao(f, 'movimento');
  assert.deepEqual(f.acoesGastas.gratis, {});
  f = novoTurno(gastarAcao(f, 'movimento', 1));
  assert.deepEqual(f.acoesGastas, { normais: 0, gratis: {} });
});

test('subir para laranja abre o seletor; +1 com a escolha adiada não reabre', () => {
  const f = { ...fichaVazia('teste', 'x'), xp: 17 };
  const r1 = mudarXp(f, 1, SOB, HAB);
  assert.equal(r1.escolha, null);
  const r2 = mudarXp(r1.ficha, 1, SOB, HAB);
  assert.deepEqual(r2.niveisNovos, ['laranja']);
  assert.deepEqual(r2.escolha, { nivel: 'laranja', opcoes: ['acumulador', 'sortudo'] });
  const r3 = mudarXp(r2.ficha, 1, SOB, HAB);
  assert.equal(r3.escolha, null); // adiada: fica o botão "escolher" na ficha
  const r4 = mudarXp({ ...r3.ficha, xp: 42, escolhas: { laranja: ['sortudo'], vermelho: [] } }, 1, SOB, HAB);
  assert.equal(r4.escolha.nivel, 'vermelho');
  assert.equal(r4.escolha.opcoes.length, 3);
});

test('Ultrared: dar a volta e passar de novo por 19 reabre o seletor', () => {
  const f = { ...fichaVazia('teste', 'x'), xp: 42, ultrared: true, escolhas: { laranja: ['sortudo'], vermelho: ['medico'] } };
  const volta = mudarXp(f, 1, SOB, HAB);
  assert.equal(volta.ficha.voltas, 1);
  assert.equal(volta.ficha.xp, 0);
  assert.equal(volta.escolha, null); // a volta em si não pede escolha
  const de19 = mudarXp({ ...volta.ficha, xp: 18 }, 1, SOB, HAB);
  assert.deepEqual(de19.niveisNovos, []); // continua no vermelho
  assert.equal(de19.escolha.nivel, 'laranja');
  assert.deepEqual(de19.escolha.opcoes, ['acumulador']);
});

test('objetivo dá 5 XP e devolver tira 5; sem objetivo não faz nada', () => {
  const f = fichaVazia('teste', 'x');
  const r = mudarObjetivo(f, 1, SOB, HAB);
  assert.equal(r.ficha.objetivos, 1);
  assert.equal(r.ficha.xp, 5);
  const s = mudarObjetivo(r.ficha, -1, SOB, HAB);
  assert.equal(s.ficha.objetivos, 0);
  assert.equal(s.ficha.xp, 0);
  assert.equal(mudarObjetivo(f, -1, SOB, HAB).ficha.xp, 0);
});

test('resumo: ações do nível, próximo limite, árvore, Hoard e selo a conferir', () => {
  const f = { ...fichaVazia('teste', 'x'), xp: 20, escolhas: { laranja: ['acumulador'], vermelho: [] },
    acoesGastas: { normais: 9, gratis: { movimento: 1 } } };
  const r = resumo(f, SOB);
  assert.equal(r.nivel, 'laranja');
  assert.equal(r.proximo, 43);
  assert.deepEqual(r.acoes, { normais: 4, gastas: 4, gratis: [{ tipo: 'movimento', total: 1, gastas: 1 }] });
  assert.deepEqual(r.alcancados, ['azul', 'amarelo', 'laranja']);
  assert.deepEqual(r.arvore.laranja, [
    { hid: 'acumulador', ativa: true, escolhida: true }, { hid: 'sortudo', ativa: false, escolhida: false }]);
  assert.equal(r.escolhaPendente, null);
  assert.deepEqual(resumo({ ...f, escolhas: { laranja: [], vermelho: [] } }, SOB, HAB).escolhaPendente,
    { nivel: 'laranja', opcoes: ['acumulador', 'sortudo'] });
  assert.equal(r.hoard, true);
  assert.equal(r.conferir, true);
  assert.equal(resumo(f, { ...SOB, confirmado: true }).conferir, false);
  assert.equal(resumo({ ...f, xp: 2, voltas: 1 }, SOB).proximo, null);
});

test('iniciais do retrato', () => {
  assert.equal(iniciais('Tiger Sam'), 'TS');
  assert.equal(iniciais('Odin'), 'OD');
  assert.equal(iniciais(''), '?');
});

test('prefs: lembra a última ficha por partida e o Wake Lock, e aguenta lixo', () => {
  const storage = storageEmMemoria();
  const p = criarPrefs(storage);
  assert.equal(p.wakeLock, false);
  p.wakeLock = true;
  p.lembrarFicha('p1', 'f9');
  const q = criarPrefs(storage);
  assert.equal(q.wakeLock, true);
  assert.equal(q.ultimaFicha('p1'), 'f9');
  assert.equal(q.ultimaFicha('p2'), null);
  storage.setItem(CHAVE_PREFS, '{lixo');
  assert.equal(criarPrefs(storage).wakeLock, false);
  const quebrado = { getItem() { throw new Error('bloqueado'); }, setItem() { throw new Error('cheio'); } };
  const r = criarPrefs(quebrado);
  r.wakeLock = true; // não lança
  assert.equal(r.wakeLock, true);
});
