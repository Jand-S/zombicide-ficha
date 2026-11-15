import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { criarEstado, storageEmMemoria, LIMITE_LINK } from '../js/estado.js';
import { urlDaFicha, qrDoTexto, svgDoQr, nomeBackup } from '../js/ui/compartilhar.js';
import { folhaCompartilhar, folhaConfig, telaPartidas } from '../js/ui/telas.js';

const RAIZ = join(dirname(fileURLToPath(import.meta.url)), '..');
const ler = (p) => readFileSync(join(RAIZ, p), 'utf8');

function arquivos(dir) {
  const fora = [];
  for (const nome of readdirSync(join(RAIZ, dir))) {
    const rel = `${dir}/${nome}`;
    if (statSync(join(RAIZ, rel)).isDirectory()) fora.push(...arquivos(rel));
    else fora.push(rel);
  }
  return fora;
}

function listaDoSw() {
  const m = ler('sw.js').match(/ARQUIVOS\s*=\s*\[([\s\S]*?)\]/);
  assert.ok(m, 'sw.js tem const ARQUIVOS = [...]');
  return [...m[1].matchAll(/'([^']+)'/g)].map((x) => x[1]);
}

/** Carrega a lib vendorizada (UMD) sem navegador. */
function libQr() {
  const codigo = ler('vendor/qrcode-generator-1.4.4.min.js');
  const module = { exports: {} };
  // eslint-disable-next-line no-new-func
  new Function('module', 'exports', codigo)(module, module.exports);
  return module.exports;
}

test('sw.js guarda todo arquivo do site (offline) e nada que não existe', () => {
  const lista = listaDoSw();
  for (const a of lista) if (a !== './') assert.ok(existsSync(join(RAIZ, a)), `existe: ${a}`);
  const precisa = [
    'index.html', 'manifest.webmanifest', './',
    ...['css', 'js', 'assets', 'vendor'].flatMap(arquivos).filter((a) => !/\.(txt|md)$/i.test(a) && !a.includes('/.')),
  ];
  for (const a of precisa) assert.ok(lista.includes(a), `fora do cache do sw.js: ${a}`);
});

test('manifest: caminhos relativos, ícones próprios que existem (192, 512 e maskable)', () => {
  const m = JSON.parse(ler('manifest.webmanifest'));
  assert.equal(m.start_url, './');
  assert.equal(m.scope, './');
  assert.equal(m.display, 'standalone');
  for (const i of m.icons) {
    assert.ok(!i.src.startsWith('/'), 'relativo (o Pages serve em /zombicide-ficha/)');
    assert.ok(existsSync(join(RAIZ, i.src)), i.src);
  }
  const png = (src) => {
    const b = readFileSync(join(RAIZ, src));
    return `${b.readUInt32BE(16)}x${b.readUInt32BE(20)}`;
  };
  const pngs = m.icons.filter((i) => i.type === 'image/png');
  for (const i of pngs) assert.equal(png(i.src), i.sizes, `tamanho real de ${i.src}`);
  assert.ok(pngs.some((i) => i.sizes === '192x192'));
  assert.ok(pngs.some((i) => i.sizes === '512x512' && i.purpose === 'maskable'));
});

test('index.html liga manifest, ícone, lib do QR, e o app registra sw.js com caminho relativo', () => {
  const html = ler('index.html');
  assert.match(html, /<link rel="manifest" href="manifest\.webmanifest">/);
  assert.match(html, /rel="apple-touch-icon" href="assets\/app\/icone-180\.png"/);
  assert.match(html, /src="vendor\/qrcode-generator-1\.4\.4\.min\.js"/);
  assert.match(html, /ficha de fã, não oficial/);
  assert.match(ler('js/ui/app.js'), /serviceWorker\.register\('sw\.js'\)/);
});

test('o link da ficha restaura a ficha em outro aparelho', () => {
  const a = criarEstado(storageEmMemoria());
  a.novaPartida('Sexta');
  const f = a.adicionarFicha('wanda');
  a.alterarFicha(f.id, (x) => {
    x.xp = 21; x.ferimentos = 1; x.objetivos = 2; x.ultrared = true;
    x.escolhas.laranja = ['mais-1-acao'];
    x.inventario.maos[0] = { equipId: 'katana' };
    x.inventario.mochila[2] = { texto: 'Chave do carro' };
    return x;
  });
  const url = urlDaFicha('https://exemplo.github.io/zombicide-ficha/?x=1#antigo', a.exportarLink(f.id));
  assert.match(url, /^https:\/\/exemplo\.github\.io\/zombicide-ficha\/\?x=1#f=/);

  const b = criarEstado(storageEmMemoria());
  b.carregar();
  const g = b.importarLink(new URL(url).hash);
  assert.ok(g, 'link válido');
  const original = a.fichaAtual();
  const { id: _1, ...semIdA } = original;
  const { id: _2, ...semIdB } = b.fichaAtual();
  assert.deepEqual(semIdB, semIdA);
  assert.equal(urlDaFicha('https://x/', null), null);
});

test('QR: a lib vendorizada desenha o link (até o limite) num SVG', () => {
  const qrcode = libQr();
  assert.equal(typeof qrcode, 'function');
  const url = 'https://exemplo.github.io/zombicide-ficha/#f=' + 'A'.repeat(LIMITE_LINK);
  const svg = qrDoTexto(qrcode, url);
  assert.ok(svg, 'o maior link cabe no QR');
  assert.match(svg, /^<svg class="qr"/);
  assert.match(svg, /<path fill="#000" d="M/);
  assert.equal(qrDoTexto(undefined, url), null, 'sem a lib, sem QR (a folha mostra só o link)');
  // svgDoQr com um QR de mentira 2x2 (diagonal escura)
  const falso = { getModuleCount: () => 2, isDark: (l, c) => l === c };
  const s = svgDoQr(falso, { margem: 1 });
  assert.match(s, /viewBox="0 0 4 4"/);
  assert.match(s, /d="M1 1h1v1h-1zM2 2h1v1h-1z"/);
});

test('backup: nome do arquivo com a data, e botões de salvar/abrir na tela Partidas', () => {
  assert.equal(nomeBackup(new Date(2026, 10, 4)), 'zombicide-ficha-2026-11-04.json');
  const html = telaPartidas({ partidas: [], partidaAtiva: null });
  assert.match(html, /data-acao="exportar-json"/);
  assert.match(html, /type="file"[^>]*data-acao="importar-json"/);
});

test('folha de passar ficha: QR, link, copiar; Opções leva até ela', () => {
  const html = folhaCompartilhar({ nome: 'Wanda', url: 'https://x/#f=abc', svgQr: '<svg class="qr"></svg>', podeCompartilhar: false });
  assert.match(html, /class="qr-caixa"/);
  assert.match(html, /value="https:\/\/x\/#f=abc"/);
  assert.match(html, /data-acao="copiar-link"/);
  assert.doesNotMatch(html, /enviar-link/);
  assert.match(folhaCompartilhar({ nome: 'W', url: 'u', svgQr: null, podeCompartilhar: true }), /data-acao="enviar-link"/);
  const cfg = folhaConfig({ ficha: { ultrared: false }, sobrevivente: null, wakeLock: false, wakeLockSuportado: false });
  assert.match(cfg, /data-acao="abrir-compartilhar"/);
});
