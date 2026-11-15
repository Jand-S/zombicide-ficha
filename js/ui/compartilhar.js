// Link, QR e backup, sem DOM (o app.js baixa o arquivo e põe o SVG na folha).

/** URL completa da ficha: a página atual (sem o hash antigo) + o `#f=...` do estado.exportarLink. */
export function urlDaFicha(href, hash) {
  if (!hash) return null;
  const base = String(href ?? '').split('#')[0];
  return base + (hash.startsWith('#') ? hash : '#' + hash);
}

/**
 * SVG do QR a partir de um objeto da lib qrcode-generator (ou qualquer um com getModuleCount/isDark).
 * Um único <path> com um quadradinho por módulo escuro, e 4 módulos de margem branca.
 */
export function svgDoQr(qr, { margem = 4, rotulo = 'QR code do link da ficha' } = {}) {
  const n = qr.getModuleCount();
  const lado = n + margem * 2;
  let d = '';
  for (let l = 0; l < n; l += 1) {
    for (let c = 0; c < n; c += 1) {
      if (qr.isDark(l, c)) d += `M${c + margem} ${l + margem}h1v1h-1z`;
    }
  }
  return `<svg class="qr" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${lado} ${lado}" role="img" aria-label="${rotulo}"
    shape-rendering="crispEdges"><rect width="${lado}" height="${lado}" fill="#fff"/><path fill="#000" d="${d}"/></svg>`;
}

/**
 * Monta o QR com a lib (fábrica `qrcode(tipo, correcao)`); tipo 0 = menor versão que couber.
 * Devolve o SVG, ou null se a lib não carregou ou o texto não coube.
 */
export function qrDoTexto(fabrica, texto) {
  if (typeof fabrica !== 'function' || !texto) return null;
  try {
    const qr = fabrica(0, 'L');
    qr.addData(texto);
    qr.make();
    return svgDoQr(qr);
  } catch {
    return null;
  }
}

/** Nome do arquivo de backup: zombicide-ficha-AAAA-MM-DD.json (data local). */
export function nomeBackup(data = new Date()) {
  const p = (x) => String(x).padStart(2, '0');
  return `zombicide-ficha-${data.getFullYear()}-${p(data.getMonth() + 1)}-${p(data.getDate())}.json`;
}
