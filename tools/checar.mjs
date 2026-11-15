// Gate estrutural: todo arquivo local referenciado existe e, se houver sw.js,
// a lista de cache (const ARQUIVOS = [...]) bate com os arquivos que o site usa.
// Uso: node tools/checar.mjs [raiz]   (sai com código 1 se houver erro)
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, normalize, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

export function checar(raiz) {
  const erros = [];
  const usados = new Set();
  const visitados = new Set();
  const externo = (u) => /^(https?:|data:|mailto:|tel:|#|javascript:|blob:)/i.test(u) || u === '';
  const limpar = (u) => u.split('#')[0].split('?')[0];

  function seguir(arq, de) {
    const rel = normalize(relative(raiz, arq));
    if (!existsSync(arq)) { erros.push(`não existe: ${rel} (referenciado em ${de})`); return; }
    usados.add(rel);
    if (visitados.has(rel)) return;
    visitados.add(rel);
    const ext = extname(arq);
    if (!['.html', '.css', '.js', '.mjs', '.webmanifest', '.json'].includes(ext)) return;
    const txt = readFileSync(arq, 'utf8');
    const refs = [];
    if (ext === '.html') {
      for (const m of txt.matchAll(/\s(?:src|href)\s*=\s*["']([^"']+)["']/g)) refs.push(m[1]);
      for (const m of txt.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) refs.push(m[1]);
    } else if (ext === '.css') {
      for (const m of txt.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) refs.push(m[1]);
      for (const m of txt.matchAll(/@import\s+["']([^"']+)["']/g)) refs.push(m[1]);
    } else if (ext === '.js' || ext === '.mjs') {
      for (const m of txt.matchAll(/(?:import|export)\s[^'"`;]*?from\s*["']([^"']+)["']/g)) refs.push(m[1]);
      for (const m of txt.matchAll(/import\s*\(\s*["']([^"']+)["']\s*\)/g)) refs.push(m[1]);
      for (const m of txt.matchAll(/^\s*import\s+["']([^"']+)["']/gm)) refs.push(m[1]);
    } else if (ext === '.webmanifest' || ext === '.json') {
      for (const m of txt.matchAll(/"src"\s*:\s*"([^"]+)"/g)) refs.push(m[1]);
    }
    for (const r of refs) {
      if (externo(r)) continue;
      const c = limpar(r);
      if (!c || c.startsWith('/')) { if (c.startsWith('/')) erros.push(`caminho absoluto quebra no Pages: ${c} (em ${rel})`); continue; }
      if (/^[a-z]+:/i.test(c)) continue;
      const alvo = c.endsWith('/') ? join(dirname(arq), c, 'index.html') : join(dirname(arq), c);
      seguir(alvo, rel);
    }
  }

  const htmls = readdirSync(raiz).filter((f) => f.endsWith('.html'));
  for (const h of htmls) seguir(join(raiz, h), '(raiz)');

  const sw = join(raiz, 'sw.js');
  if (existsSync(sw)) {
    const txt = readFileSync(sw, 'utf8');
    const m = txt.match(/ARQUIVOS\s*=\s*\[([\s\S]*?)\]/);
    if (!m) erros.push('sw.js existe mas não tem const ARQUIVOS = [...]');
    else {
      const lista = new Set([...m[1].matchAll(/["']([^"']+)["']/g)].map((x) => {
        const c = limpar(x[1]).replace(/^\.\//, '');
        return c === '' ? 'index.html' : normalize(c);
      }));
      for (const f of lista) if (!existsSync(join(raiz, f))) erros.push(`sw.js lista arquivo que não existe: ${f}`);
      // tudo que as páginas publicadas usam precisa estar no cache offline
      for (const u of usados) if (!u.startsWith('design') && !u.startsWith('tests') && !lista.has(u) && u !== 'sw.js') {
        erros.push(`usado pelo site mas fora do cache do sw.js: ${u}`);
      }
    }
  }
  return { erros, usados: [...usados].sort() };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const raiz = process.argv[2] || join(dirname(fileURLToPath(import.meta.url)), '..');
  const { erros, usados } = checar(raiz);
  console.log(`arquivos referenciados: ${usados.length}`);
  for (const e of erros) console.log('ERRO: ' + e);
  process.exit(erros.length ? 1 : 0);
}
