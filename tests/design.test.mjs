// Leg visual (V3): design.html mostra o tema, todos os ícones e todos os componentes.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (p) => readFileSync(join(raiz, p), 'utf8');

const CLASSES = ['btn', 'btn-grande', 'barra-perigo', 'coracao', 'pip', 'slot', 'folha', 'toast', 'chip-nivel',
  'cartao', 'retrato'];
const ICONES = ['i-mao', 'i-mochila', 'i-coracao', 'i-caveira', 'i-dado', 'i-bala', 'i-porta', 'i-barulho', 'i-xp',
  'i-turno', 'i-desfazer', 'i-mesa', 'i-compartilhar', 'i-config', 'i-objetivo', 'i-corpo', 'i-mira', 'i-mais',
  'i-menos', 'i-fechar'];

test('design.html usa o tema, todos os ícones e todos os componentes', () => {
  const html = ler('design.html');
  assert.match(html, /<meta name="viewport" content="[^"]*width=device-width[^"]*viewport-fit=cover/);
  assert.match(html, /href="css\/tema\.css"/);
  for (const id of ICONES) assert.match(html, new RegExp(`assets/icones\\.svg#${id}"`), `design.html não mostra ${id}`);
  for (const c of CLASSES) assert.match(html, new RegExp(`class="([^"]* )?${c}( [^"]*)?"`), `design.html não usa .${c}`);
  for (const n of ['azul', 'amarelo', 'laranja', 'vermelho']) assert.match(html, new RegExp(`data-nivel="${n}"`));
  // 5 slots de inventário (2 mãos + 3 mochila) na ficha completa
  const ficha = html.slice(html.indexOf('id="ficha"'));
  assert.ok((ficha.match(/class="slot[ "]/g) || []).length >= 5, 'a ficha precisa de 5 slots');
});
