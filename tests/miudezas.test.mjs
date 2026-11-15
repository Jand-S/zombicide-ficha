// Itens menores da auditoria: aviso de storage cheio, Desfazer da ficha certa, mudança vazia e vida a conferir.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { criarEstado, storageEmMemoria, fichaVazia } from '../js/estado.js';
import { avisoDeSalvar, mudarXp } from '../js/ui/logica.js';
import { telaMesa } from '../js/ui/telas.js';

const app = readFileSync(new URL('../js/ui/app.js', import.meta.url), 'utf8');

test('storage cheio: o toast avisa que não foi possível salvar', () => {
  assert.equal(avisoDeSalvar('+1 XP · 3 na barra', false), '+1 XP · 3 na barra');
  assert.equal(avisoDeSalvar('+1 XP · 3 na barra', true), 'Não foi possível salvar · +1 XP · 3 na barra');
  assert.match(app, /avisoDeSalvar\([^)]*api\.pendente\)/);
});

test('trocar de ficha ou de tela fecha o toast de Desfazer', () => {
  const ir = app.slice(app.indexOf('function ir('), app.indexOf('}', app.indexOf('function ir(')));
  assert.match(ir, /fecharToast\(\)/);
  assert.match(app, /function fecharToast\(\)[^}]*desfazerExtra = null/);
});

test('mudança que não muda nada não empilha Desfazer nem grava', () => {
  const ls = storageEmMemoria();
  let gravacoes = 0;
  const e = criarEstado({ ...ls, setItem(k, v) { gravacoes += 1; ls.setItem(k, v); } });
  e.carregar();
  const f = e.adicionarFicha('odin');
  const antes = gravacoes;
  const r = e.alterarFicha(f.id, (x) => mudarXp(x, -1, null, null).ficha); // −1 XP com XP 0
  assert.equal(r, e.fichaAtual()); // devolve a mesma ficha
  assert.equal(e.podeDesfazer(), false);
  assert.equal(gravacoes, antes);
  assert.match(app, /if \(nova === f\) return nova;/);
});

test('Mesa: vida de sobrevivente sem tipo aparece "a conferir"', () => {
  const semTipo = { id: 's', nome: 'Sem Tipo', tipo: null, vida: null, confirmado: false, habilidades: {} };
  const adulto = { id: 'a', nome: 'Adulto', tipo: 'adulto', vida: 3, confirmado: true, habilidades: {} };
  const partida = { id: 'p', nome: 'P', fichas: [fichaVazia('s', 'f1')] };
  assert.match(telaMesa({ partida, sobreviventes: { s: semTipo }, fichaAtiva: 'f1' }), /3\/3[^<]*<small[^>]*>a conferir/);
  const p2 = { id: 'p', nome: 'P', fichas: [fichaVazia('a', 'f1')] };
  assert.doesNotMatch(telaMesa({ partida: p2, sobreviventes: { a: adulto }, fichaAtiva: 'f1' }), /a conferir/);
});
