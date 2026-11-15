// Dado ruim (link, storage) não pode gerar milhões de pips nem travar o laço do Ultrared.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { acoesDoTurno, vidaMax, aplicarXp, LIMITE_ACOES, LIMITE_VIDA } from '../js/regras.js';

const ADULTO = { id: 'a', tipo: 'adulto', vida: 3, habilidades: { azul: [], amarelo: [], laranja: [], vermelho: [] } };
const ficha = (escolhas) => ({
  id: 'f', sobreviventeId: 'a', xp: 19, voltas: 0, escolhas, ferimentos: 0,
  acoesGastas: { normais: 0, gratis: {} }, objetivos: 0, ultrared: false,
});

test('um hid "+N ação" com N gigante não gera milhões de pips', () => {
  const r = acoesDoTurno(ficha({ laranja: ['mais-99999999999-acao'], vermelho: [] }), ADULTO);
  assert.ok(r.normais <= LIMITE_ACOES, `normais = ${r.normais}`);
  const g = acoesDoTurno(ficha({ laranja: ['mais-99999999999-acao-gratis-movimento'], vermelho: [] }), ADULTO);
  assert.ok(g.gratis.movimento <= LIMITE_ACOES, `grátis = ${g.gratis.movimento}`);
  // vários hids inventados juntos também ficam no teto
  const muitos = Array.from({ length: 50 }, (_, i) => `mais-${i + 1}-acao`);
  assert.ok(acoesDoTurno(ficha({ laranja: muitos, vermelho: [] }), ADULTO).normais <= LIMITE_ACOES);
  // o caso normal continua igual
  assert.equal(acoesDoTurno(ficha({ laranja: ['mais-1-acao'], vermelho: [] }), ADULTO).normais, 4);
});

test('"começa com N de vida" com N gigante fica no teto', () => {
  assert.ok(vidaMax(ficha({ laranja: ['comeca-com-99999999999-de-vida'], vermelho: [] }), ADULTO) <= LIMITE_VIDA);
  assert.equal(vidaMax(ficha({ laranja: ['comeca-com-4-de-vida'], vermelho: [] }), ADULTO), 4);
});

test('Ultrared com XP enorme termina na hora (sem laço de milhões de voltas)', () => {
  const regras = fileURLToPath(new URL('../js/regras.js', import.meta.url));
  const codigo = `
    const { aplicarXp } = await import(${JSON.stringify(regras)});
    const r = aplicarXp({ xp: 1e300, voltas: 0, ultrared: true, escolhas: { laranja: [], vermelho: [] } }, 1);
    if (!(r.ficha.xp >= 0 && r.ficha.xp < 43)) throw new Error('xp fora da barra: ' + r.ficha.xp);
    const r2 = aplicarXp({ xp: 0, voltas: 1e12, ultrared: true, escolhas: { laranja: [], vermelho: [] } }, -1e15);
    if (r2.ficha.xp !== 0 || r2.ficha.voltas !== 0) throw new Error('volta negativa: ' + JSON.stringify(r2.ficha));`;
  const p = spawnSync(process.execPath, ['--input-type=module', '-e', codigo], { timeout: 3000, encoding: 'utf8' });
  assert.equal(p.error?.code, undefined, 'demorou demais (laço gigante)');
  assert.equal(p.status, 0, p.stderr);
  // o comportamento normal do Ultrared não muda
  const r = aplicarXp({ xp: 40, voltas: 1, ultrared: true, escolhas: { laranja: [], vermelho: [] } }, -45);
  assert.deepEqual([r.ficha.xp, r.ficha.voltas], [38, 0]);
});
