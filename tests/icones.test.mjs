// Leg visual (V2): o sprite assets/icones.svg tem todos os ids do contrato.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (p) => readFileSync(join(raiz, p), 'utf8');

const ICONES = ['i-mao', 'i-mochila', 'i-coracao', 'i-caveira', 'i-dado', 'i-bala', 'i-porta', 'i-barulho', 'i-xp',
  'i-turno', 'i-desfazer', 'i-mesa', 'i-compartilhar', 'i-config', 'i-objetivo', 'i-corpo', 'i-mira', 'i-mais',
  'i-menos', 'i-fechar'];

test('icones.svg tem um <symbol> 24x24 para cada id do contrato', () => {
  const svg = ler('assets/icones.svg');
  for (const id of ICONES) {
    const m = svg.match(new RegExp(`<symbol id="${id}"([^>]*)>([\\s\\S]*?)</symbol>`));
    assert.ok(m, `falta o ícone ${id}`);
    assert.match(m[1], /viewBox="0 0 24 24"/, `${id} sem viewBox 24x24`);
    assert.match(m[2], /<(path|circle|rect|g)\b/, `${id} vazio`);
  }
});
