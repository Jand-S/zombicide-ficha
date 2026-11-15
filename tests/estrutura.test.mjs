import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { checar } from '../tools/checar.mjs';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

test('todo arquivo local referenciado existe e o cache do sw.js está completo', () => {
  const { erros } = checar(raiz);
  assert.deepEqual(erros, []);
});
