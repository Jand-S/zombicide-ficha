// Leg visual (V1): tokens, contraste AA, toques >= 48px, fontes locais e acessibilidade do css/tema.css.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (p) => readFileSync(join(raiz, p), 'utf8');

const TOKENS = ['--azul', '--amarelo', '--laranja', '--vermelho', '--sangue', '--aviso', '--fundo', '--papel',
  '--texto', '--toque'];
const CLASSES = ['btn', 'btn-grande', 'barra-perigo', 'coracao', 'pip', 'slot', 'folha', 'toast', 'chip-nivel',
  'cartao', 'retrato'];
// Pares [texto, fundo] que os componentes usam. Todo texto precisa de contraste AA (>= 4.5:1).
const PARES = [
  ['--texto', '--fundo'], ['--texto', '--papel'], ['--texto', '--papel-2'],
  ['--texto-suave', '--fundo'], ['--texto-suave', '--papel'], ['--texto-suave', '--papel-2'],
  ['--sobre-azul', '--azul'], ['--sobre-amarelo', '--amarelo'], ['--sobre-laranja', '--laranja'],
  ['--sobre-vermelho', '--vermelho'], ['--sobre-sangue', '--sangue'], ['--sobre-aviso', '--aviso'],
  ['--aviso', '--fundo'], ['--aviso', '--papel'], ['--sangue-vivo', '--fundo'], ['--sangue-vivo', '--papel'],
  ['--azul', '--papel'], ['--amarelo', '--papel'], ['--laranja', '--papel'], ['--vermelho-texto', '--papel'],
];

function raizCss(css) {
  const m = css.match(/:root\s*\{([\s\S]*?)\}/);
  assert.ok(m, 'tema.css precisa de um bloco :root');
  const vars = {};
  for (const v of m[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) vars[v[1]] = v[2].trim();
  return vars;
}

function luminancia(hex) {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? [...h].map((c) => c + c).join('') : h;
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(full.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a, b) {
  const [l1, l2] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}

// Acha o bloco de regras cujo seletor é exatamente `sel` (pode estar numa lista separada por vírgula).
function blocos(css, sel) {
  const out = [];
  const semComentario = css.replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of semComentario.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
    const seletores = m[1].split(',').map((s) => s.trim());
    if (seletores.includes(sel)) out.push(m[2]);
  }
  return out;
}

test('contraste: a fórmula bate com valores conhecidos', () => {
  assert.equal(Math.round(contraste('#000000', '#ffffff') * 10) / 10, 21);
  assert.ok(contraste('#777777', '#ffffff') < 4.5);
});

test('tema.css tem todos os tokens do contrato e --toque: 48px', () => {
  const vars = raizCss(ler('css/tema.css'));
  for (const t of TOKENS) assert.ok(t in vars, `falta o token ${t}`);
  assert.equal(vars['--toque'], '48px');
});

test('tema.css: todos os pares de texto/fundo passam no contraste AA (4.5:1)', () => {
  const vars = raizCss(ler('css/tema.css'));
  for (const [t, f] of PARES) {
    assert.match(vars[t] ?? '', /^#[0-9a-f]{3,6}$/i, `${t} precisa ser uma cor hex no :root`);
    assert.match(vars[f] ?? '', /^#[0-9a-f]{3,6}$/i, `${f} precisa ser uma cor hex no :root`);
    const c = contraste(vars[t], vars[f]);
    assert.ok(c >= 4.5, `${t} sobre ${f}: ${c.toFixed(2)} < 4.5`);
  }
});

test('tema.css tem todas as classes do contrato', () => {
  const css = ler('css/tema.css');
  for (const c of CLASSES) assert.match(css, new RegExp(`\\.${c}(?![\\w-])`), `falta a classe .${c}`);
});

test('tema.css: alvos de toque têm no mínimo 48px (var(--toque))', () => {
  const css = ler('css/tema.css');
  for (const sel of ['.btn', '.pip', '.coracao', '.slot', 'button.chip-nivel']) {
    const b = blocos(css, sel).join(';');
    assert.match(b, /min-height\s*:\s*var\(--toque\)/, `${sel} sem min-height: var(--toque)`);
    if (sel !== '.slot' && sel !== '.btn') assert.match(b, /min-width\s*:\s*var\(--toque\)/, `${sel} sem min-width`);
  }
  assert.match(blocos(css, '.btn-grande').join(';'), /min-height\s*:\s*calc\(var\(--toque\)\s*\+/);
});

test('tema.css respeita prefers-reduced-motion e a safe-area do iPhone', () => {
  const css = ler('css/tema.css');
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  for (const lado of ['top', 'bottom', 'left', 'right']) assert.match(css, new RegExp(`env\\(safe-area-inset-${lado}`));
  assert.match(css, /:focus-visible/);
});

test('fontes locais em woff2 com licença OFL', () => {
  const css = ler('css/tema.css');
  const fontes = [...css.matchAll(/url\(["']?(\.\.\/assets\/fontes\/[^"')]+\.woff2)["']?\)/g)].map((m) => m[1]);
  assert.ok(fontes.length >= 2, 'tema.css precisa carregar ao menos 2 woff2 locais');
  for (const f of fontes) assert.ok(existsSync(join(raiz, 'css', f)), `não existe ${f}`);
  assert.doesNotMatch(css, /fonts\.googleapis|fonts\.gstatic|@import\s+url\(["']?https?:/);
  for (const l of ['LICENSE-bebas-neue.txt', 'LICENSE-barlow-condensed.txt']) {
    assert.match(ler(`assets/fontes/${l}`), /SIL OPEN FONT LICENSE/i);
  }
});
