// Service worker: guarda o site inteiro para funcionar offline.
// Responde do cache na hora e atualiza o cache pela rede em segundo plano (a versão nova vale na
// próxima abertura). Ao mudar a lista ou os arquivos, suba VERSAO para trocar o cache.
// O gate (tools/checar.mjs) confere que ARQUIVOS cobre tudo que o site usa.
const VERSAO = 'v1';
const PREFIXO = 'zombicide-ficha-';
const CACHE = PREFIXO + VERSAO;

const ARQUIVOS = [
  './',
  'index.html',
  'manifest.webmanifest',
  'css/tema.css',
  'css/app.css',
  'js/estado.js',
  'js/regras.js',
  'js/dados/equipamentos.js',
  'js/dados/habilidades.js',
  'js/dados/sobreviventes.js',
  'js/ui/app.js',
  'js/ui/compartilhar.js',
  'js/ui/dom.js',
  'js/ui/inventario.js',
  'js/ui/logica.js',
  'js/ui/prefs.js',
  'js/ui/telas.js',
  'assets/icones.svg',
  'assets/fontes/bebas-neue-400.woff2',
  'assets/fontes/barlow-condensed-400.woff2',
  'assets/fontes/barlow-condensed-600.woff2',
  'assets/fontes/barlow-condensed-700.woff2',
  'assets/app/icone.svg',
  'assets/app/icone-180.png',
  'assets/app/icone-192.png',
  'assets/app/icone-512.png',
  'assets/app/icone-maskable-512.png',
  'vendor/qrcode-generator-1.4.4.min.js',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ARQUIVOS.map((a) => new Request(a, { cache: 'reload' }))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys()
      .then((ks) => Promise.all(ks.filter((k) => k.startsWith(PREFIXO) && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (ev) => {
  const req = ev.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  // a página (com ou sem index.html, com ou sem ?...) sai sempre do mesmo item do cache
  const raiz = req.mode === 'navigate' && (url.pathname.endsWith('/') || url.pathname.endsWith('/index.html'));
  const chave = raiz ? new URL('index.html', self.registration.scope).href : req;
  ev.respondWith(caches.open(CACHE).then(async (cache) => {
    const salvo = await cache.match(chave, { ignoreSearch: true });
    const rede = fetch(req)
      .then((r) => {
        if (r.ok && r.type === 'basic' && !r.redirected) cache.put(chave, r.clone()).catch(() => {});
        return r;
      })
      .catch(() => null);
    if (salvo) {
      ev.waitUntil(rede);
      return salvo;
    }
    return (await rede) ?? Response.error();
  }));
});
