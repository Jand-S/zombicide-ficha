// Service worker: guarda o site inteiro para funcionar offline.
// Responde do cache na hora e atualiza o cache pela rede em segundo plano (a versão nova vale na
// próxima abertura). Ao mudar a lista ou os arquivos, suba VERSAO para trocar o cache.
// O gate (tools/checar.mjs) confere que ARQUIVOS cobre tudo que o site usa.
const VERSAO = 'v3';
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
  // imagens oficiais (© CMON; ver assets/oficial/LEIA-ME.md)
  'assets/oficial/sobreviventes/amy-card.jpg',
  'assets/oficial/sobreviventes/amy-retrato.jpg',
  'assets/oficial/sobreviventes/bunny-g-card.jpg',
  'assets/oficial/sobreviventes/bunny-g-retrato.jpg',
  'assets/oficial/sobreviventes/doug-card.jpg',
  'assets/oficial/sobreviventes/doug-retrato.jpg',
  'assets/oficial/sobreviventes/elle-card.jpg',
  'assets/oficial/sobreviventes/elle-retrato.jpg',
  'assets/oficial/sobreviventes/josh-card.jpg',
  'assets/oficial/sobreviventes/josh-retrato.jpg',
  'assets/oficial/sobreviventes/lili-card.jpg',
  'assets/oficial/sobreviventes/lili-retrato.jpg',
  'assets/oficial/sobreviventes/lou-card.jpg',
  'assets/oficial/sobreviventes/lou-retrato.jpg',
  'assets/oficial/sobreviventes/ned-card.jpg',
  'assets/oficial/sobreviventes/ned-retrato.jpg',
  'assets/oficial/sobreviventes/odin-card.jpg',
  'assets/oficial/sobreviventes/odin-retrato.jpg',
  'assets/oficial/sobreviventes/ostara-card.jpg',
  'assets/oficial/sobreviventes/ostara-retrato.jpg',
  'assets/oficial/sobreviventes/tiger-sam-card.jpg',
  'assets/oficial/sobreviventes/tiger-sam-retrato.jpg',
  'assets/oficial/sobreviventes/wanda-card.jpg',
  'assets/oficial/sobreviventes/wanda-retrato.jpg',
  'assets/oficial/cartas/aaahh.jpg',
  'assets/oficial/cartas/army-sniper-rifle.jpg',
  'assets/oficial/cartas/automatic-shotgun.jpg',
  'assets/oficial/cartas/bag-of-rice.jpg',
  'assets/oficial/cartas/baseball-bat-inicial.jpg',
  'assets/oficial/cartas/canned-food.jpg',
  'assets/oficial/cartas/chainsaw.jpg',
  'assets/oficial/cartas/crowbar.jpg',
  'assets/oficial/cartas/evil-twins.jpg',
  'assets/oficial/cartas/fire-axe.jpg',
  'assets/oficial/cartas/flashlight.jpg',
  'assets/oficial/cartas/golden-ak-47.jpg',
  'assets/oficial/cartas/golden-kukri.jpg',
  'assets/oficial/cartas/gunblade.jpg',
  'assets/oficial/cartas/katana.jpg',
  'assets/oficial/cartas/kukri.jpg',
  'assets/oficial/cartas/machete.jpg',
  'assets/oficial/cartas/mas-shotgun.jpg',
  'assets/oficial/cartas/molotov.jpg',
  'assets/oficial/cartas/nailbat.jpg',
  'assets/oficial/cartas/pistol.jpg',
  'assets/oficial/cartas/plenty-of-bullets.jpg',
  'assets/oficial/cartas/plenty-of-shells.jpg',
  'assets/oficial/cartas/sawed-off.jpg',
  'assets/oficial/cartas/shotgun.jpg',
  'assets/oficial/cartas/sniper-rifle.jpg',
  'assets/oficial/cartas/sub-mg.jpg',
  'assets/oficial/cartas/water.jpg',
  'assets/oficial/cartas/zantetsuken.jpg',
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
