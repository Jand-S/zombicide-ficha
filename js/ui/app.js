// Ponto de entrada da página: liga estado, regras, dados e telas, e trata os toques.
import { SOBREVIVENTES } from '../dados/sobreviventes.js';
import { HABILIDADES } from '../dados/habilidades.js';
import { EQUIPAMENTOS } from '../dados/equipamentos.js';
import { criarEstado } from '../estado.js';
import { escolher } from '../regras.js';
import {
  telaInicial, ferir, curar, gastarAcao, devolverAcao, novoTurno, mudarXp, mudarObjetivo, resumo,
} from './logica.js';
import {
  telaFicha, telaMesa, telaPartidas, telaEscolher, folhaEscolha, folhaConfig, folhaCartas, listaCartas,
} from './telas.js';
import { toqueSlot, moverSlot, porNoSlot, lerSlot, nomeNoSlot, nomeDoSlot } from './inventario.js';
import { criarPrefs } from './prefs.js';
import { icone, esc, NOME_NIVEL } from './dom.js';

const SOB = Object.fromEntries(SOBREVIVENTES.map((s) => [s.id, s]));
const EQ = Object.fromEntries(EQUIPAMENTOS.map((e) => [e.id, e]));
const TEMPO_DESFAZER = 5000;
const TEMPO_SEGURAR = 500;

let storage = null;
try { storage = globalThis.localStorage ?? null; } catch { /* bloqueado */ }

const api = criarEstado(storage ?? undefined);
const prefs = criarPrefs(storage);
const app = document.getElementById('app');
const folha = document.getElementById('folha');
const fundo = document.getElementById('folha-fundo');
const toastEl = document.getElementById('toast');

let tela = 'escolher';
let folhaAtual = null; // 'escolha' | 'config' | 'cartas' | null
let sel = null; // slot selecionado para mover: { area, i, fichaId }
let alvoCartas = null; // slot que a folha de cartas vai preencher
let termoCartas = '';

// ---------- início ----------

api.carregar();
if (location.hash.includes('f=')) {
  const f = api.importarLink(location.hash);
  history.replaceState(null, '', location.pathname + location.search);
  if (f) setTimeout(() => toast(`Ficha de ${SOB[f.sobreviventeId]?.nome ?? 'sobrevivente'} recebida`, { desfazer: false }), 0);
}
tela = telaInicial(api).tela;
render();
try { navigator.storage?.persist?.().catch(() => {}); } catch { /* sem suporte */ }

// ---------- desenho ----------

function chaveDoFoco() {
  const a = document.activeElement;
  if (!a || !app.contains(a) || !a.dataset?.acao) return null;
  return [...app.querySelectorAll('[data-acao]')].indexOf(a);
}

function render() {
  const foco = chaveDoFoco();
  let f = api.fichaAtual();
  const p = api.partidaAtual();
  if (tela === 'ficha' && !f) tela = p ? 'mesa' : (api.estado.partidas.length ? 'partidas' : 'escolher');
  if (tela === 'mesa' && !p) tela = api.estado.partidas.length ? 'partidas' : 'escolher';

  let html = '';
  if (sel && (tela !== 'ficha' || sel.fichaId !== f?.id)) sel = null;
  if (tela === 'ficha') {
    prefs.lembrarFicha(p.id, f.id);
    html = telaFicha({
      ficha: f, sobrevivente: SOB[f.sobreviventeId], habilidades: HABILIDADES,
      fichasDaMesa: p.fichas, sobreviventes: SOB, equipamentos: EQ, selecionado: sel,
    });
  } else if (tela === 'mesa') {
    html = telaMesa({ partida: p, sobreviventes: SOB, fichaAtiva: api.estado.fichaAtiva });
  } else if (tela === 'partidas') {
    html = telaPartidas({ partidas: api.estado.partidas, partidaAtiva: api.estado.partidaAtiva });
  } else {
    html = telaEscolher({ sobreviventes: SOBREVIVENTES, habilidades: HABILIDADES, temPartida: Boolean(p) });
  }
  document.body.dataset.tela = tela;
  app.innerHTML = html;
  if (foco != null && foco >= 0) app.querySelectorAll('[data-acao]')[foco]?.focus({ preventScroll: true });
  if (folhaAtual === 'config' && f) folha.innerHTML = conteudoConfig();
}

function ir(nova) {
  tela = nova;
  fecharFolha();
  render();
  window.scrollTo(0, 0);
}

// ---------- folha de baixo ----------

function abrirFolha(tipo, html) {
  folhaAtual = tipo;
  folha.innerHTML = html;
  folha.classList.add('aberta');
  fundo.classList.add('aberta');
  document.body.classList.add('com-folha');
  folha.setAttribute('aria-hidden', 'false');
  folha.querySelector('button, input')?.focus({ preventScroll: true });
}

function fecharFolha() {
  if (!folhaAtual) return;
  folhaAtual = null;
  folha.classList.remove('aberta');
  fundo.classList.remove('aberta');
  document.body.classList.remove('com-folha');
  folha.setAttribute('aria-hidden', 'true');
}

function abrirEscolha(escolha) {
  const f = api.fichaAtual();
  if (!f || !escolha) return;
  abrirFolha('escolha', folhaEscolha({ escolha, habilidades: HABILIDADES, nomeSobrevivente: SOB[f.sobreviventeId]?.nome ?? '' }));
}

const wakeLockSuportado = 'wakeLock' in navigator;
function conteudoConfig() {
  const f = api.fichaAtual();
  return folhaConfig({ ficha: f, sobrevivente: SOB[f.sobreviventeId], wakeLock: prefs.wakeLock, wakeLockSuportado });
}

// ---------- toast com desfazer ----------

let timerToast = null;
function toast(msg, { desfazer = true, sangue = false, iconeId = 'i-xp' } = {}) {
  clearTimeout(timerToast);
  const [titulo, ...resto] = String(msg).split(' · ');
  toastEl.className = 'toast visivel' + (sangue ? ' toast--sangue' : '');
  toastEl.innerHTML = `${icone(iconeId)}<span class="toast__texto"><b>${esc(titulo)}</b>${esc(resto.join(' · '))}</span>`
    + (desfazer ? `<button class="btn btn-fantasma" type="button" data-acao="desfazer">${icone('i-desfazer')}Desfazer</button>` : '');
  timerToast = setTimeout(() => { toastEl.classList.remove('visivel'); }, desfazer ? TEMPO_DESFAZER : 2000);
}

function vibrar() {
  try { navigator.vibrate?.(12); } catch { /* sem suporte */ }
}

// ---------- mudanças na ficha ----------

/**
 * Aplica fn (ficha → ficha nova) na ficha aberta, redesenha e mostra o toast com Desfazer.
 * O estado salva sozinho a cada alterarFicha. `msg` pode ser texto ou função (ficha nova) → texto.
 */
function mudar(fn, msg, opcoesToast) {
  const f = api.fichaAtual();
  if (!f) return null;
  const nova = api.alterarFicha(f.id, fn);
  if (!nova) return null;
  vibrar();
  render();
  toast(typeof msg === 'function' ? msg(nova) : msg, opcoesToast);
  return nova;
}

function sobAtual() {
  const f = api.fichaAtual();
  return f ? SOB[f.sobreviventeId] : null;
}

function textoXp(delta, r) {
  const base = `${delta > 0 ? '+' : '−'}${Math.abs(delta)} XP`;
  const novo = r.niveisNovos.at(-1);
  return novo ? `${base} · nível ${NOME_NIVEL[novo].toLowerCase()}!` : `${base} · ${r.ficha.xp} na barra`;
}

function mudarXpUi(delta) {
  const s = sobAtual();
  let r = null;
  mudar((f) => (r = mudarXp(f, delta, s, HABILIDADES)).ficha, () => textoXp(delta, r));
  if (r?.escolha) abrirEscolha(r.escolha);
}

function objetivoUi(delta) {
  const s = sobAtual();
  let r = null;
  mudar((f) => (r = mudarObjetivo(f, delta, s, HABILIDADES)).ficha,
    () => `${delta > 0 ? 'Objetivo' : 'Objetivo devolvido'} · ${delta > 0 ? '+' : '−'}5 XP (${r.ficha.xp} na barra)`,
    { iconeId: 'i-objetivo' });
  if (r?.escolha) abrirEscolha(r.escolha);
}

function ferirUi() {
  const f = api.fichaAtual();
  const max = resumo(f, sobAtual()).vidaMax;
  if (f.ferimentos >= max) {
    toast('Eliminado · segure um coração para curar', { desfazer: false, sangue: true, iconeId: 'i-caveira' });
    return;
  }
  mudar((x) => ferir(x, max), (nova) => {
    const v = max - nova.ferimentos;
    return v > 0 ? `Ferido · resta ${v} de vida` : 'Eliminado · use Desfazer se foi engano';
  }, { sangue: true, iconeId: 'i-caveira' });
}

function curarUi() {
  const f = api.fichaAtual();
  if (!f) return;
  if (!f.ferimentos) { toast('Vida cheia', { desfazer: false, iconeId: 'i-coracao' }); return; }
  const max = resumo(f, sobAtual()).vidaMax;
  mudar(curar, (nova) => `Curado · ${max - nova.ferimentos} de ${max} de vida`, { iconeId: 'i-coracao' });
}

function pipUi(btn) {
  const s = sobAtual();
  const f = api.fichaAtual();
  const tipo = btn.dataset.tipo || null;
  if (btn.dataset.gasta === '1') {
    mudar((x) => devolverAcao(x, tipo), 'Ação devolvida', { iconeId: 'i-turno' });
    return;
  }
  const r = resumo(f, s);
  const total = tipo ? (r.acoes.gratis.find((g) => g.tipo === tipo)?.total ?? 0) : r.acoes.normais;
  mudar((x) => gastarAcao(x, tipo, total), tipo ? 'Ação grátis gasta' : 'Ação gasta', { iconeId: 'i-turno' });
}

// ---------- inventário ----------

function refDe(btn) {
  return { area: btn.dataset.area, i: Number(btn.dataset.i) };
}

function abrirCartas(alvo) {
  const f = api.fichaAtual();
  if (!f) return;
  alvoCartas = { area: alvo.area, i: alvo.i };
  termoCartas = '';
  abrirFolha('cartas', folhaCartas({ alvo: alvoCartas, slotAtual: lerSlot(f, alvoCartas), cartas: EQUIPAMENTOS, termo: '' }));
}

function textoMover(antes, de, para) {
  const a = nomeNoSlot(lerSlot(antes, de), EQ);
  const b = nomeNoSlot(lerSlot(antes, para), EQ);
  const onde = `${nomeDoSlot(de).toLowerCase()} → ${nomeDoSlot(para).toLowerCase()}`;
  return b ? `${a} ⇄ ${b} · ${onde}` : `${a} · ${onde}`;
}

function slotUi(btn) {
  const f = api.fichaAtual();
  if (!f) return;
  const r = toqueSlot(sel, f, refDe(btn));
  sel = r.sel ? { ...r.sel, fichaId: f.id } : null;
  if (r.efeito?.tipo === 'cartas') { abrirCartas(r.efeito.alvo); return; }
  if (r.efeito?.tipo === 'mover') {
    const { de, para } = r.efeito;
    mudar((x) => moverSlot(x, de, para), textoMover(f, de, para), { iconeId: 'i-mochila' });
    return;
  }
  if (r.sel) vibrar();
  render();
}

function porUi(conteudo) {
  const f = api.fichaAtual();
  if (!f || !alvoCartas) return;
  const alvo = alvoCartas;
  const antes = nomeNoSlot(lerSlot(f, alvo), EQ);
  fecharFolha();
  sel = null;
  mudar((x) => porNoSlot(x, alvo, conteudo), (nova) => {
    const agora = nomeNoSlot(lerSlot(nova, alvo), EQ);
    if (!agora) return `${antes ?? 'Carta'} descartada · ${nomeDoSlot(alvo).toLowerCase()} vazia`;
    return `${agora} · em ${nomeDoSlot(alvo).toLowerCase()}`;
  }, { iconeId: 'i-mochila' });
}

// ---------- toques ----------

let segurou = false;
let timerSegurar = null;

app.addEventListener('pointerdown', (ev) => {
  const c = ev.target.closest('[data-acao="coracao"]');
  if (!c) return;
  segurou = false;
  clearTimeout(timerSegurar);
  timerSegurar = setTimeout(() => { segurou = true; curarUi(); }, TEMPO_SEGURAR);
});
for (const tipo of ['pointerup', 'pointercancel', 'pointerleave']) {
  app.addEventListener(tipo, () => clearTimeout(timerSegurar), true);
}
app.addEventListener('contextmenu', (ev) => {
  if (ev.target.closest('[data-acao="coracao"]')) ev.preventDefault();
});

function tratarClique(ev) {
  const btn = ev.target.closest('[data-acao]');
  if (!btn || btn.disabled) return;
  const acao = btn.dataset.acao;
  if (btn.tagName === 'INPUT') return; // checkboxes: ver 'change'
  switch (acao) {
    case 'coracao':
      if (segurou) { segurou = false; return; }
      ferirUi();
      break;
    case 'pip': pipUi(btn); break;
    case 'slot': slotUi(btn); break;
    case 'slot-cancelar': sel = null; render(); break;
    case 'slot-cartas': if (sel) { const a = sel; sel = null; render(); abrirCartas(a); } break;
    case 'slot-descartar': if (sel) { alvoCartas = { area: sel.area, i: sel.i }; porUi(null); } break;
    case 'slot-esvaziar': porUi(null); break;
    case 'por-carta': porUi({ equipId: btn.dataset.equip }); break;
    case 'novo-turno':
      mudar(novoTurno, 'Novo turno · ações de volta', { iconeId: 'i-turno' });
      break;
    case 'xp': mudarXpUi(Number(btn.dataset.delta)); break;
    case 'objetivo': objetivoUi(Number(btn.dataset.delta)); break;
    case 'abrir-escolha': {
      const f = api.fichaAtual();
      abrirEscolha(resumo(f, SOB[f.sobreviventeId], HABILIDADES).escolhaPendente);
      break;
    }
    case 'escolher': {
      const nivel = btn.dataset.nivelEscolha;
      const hid = btn.dataset.hid;
      fecharFolha();
      mudar((f) => escolher(f, nivel, hid), `${HABILIDADES[hid]?.pt ?? hid} · habilidade ${NOME_NIVEL[nivel].toLowerCase()}`);
      // pode haver outra escolha na fila (ex.: subiu dois níveis de uma vez)
      const f = api.fichaAtual();
      const prox = resumo(f, SOB[f.sobreviventeId], HABILIDADES).escolhaPendente;
      if (prox) abrirEscolha(prox);
      break;
    }
    case 'abrir-config': abrirFolha('config', conteudoConfig()); break;
    case 'fechar-folha': fecharFolha(); break;
    case 'remover-ficha': {
      const f = api.fichaAtual();
      const nome = SOB[f.sobreviventeId]?.nome ?? 'ficha';
      api.removerFicha(f.id);
      fecharFolha();
      tela = api.fichaAtual() ? 'ficha' : 'mesa';
      render();
      toast(`${nome} saiu da mesa`, { iconeId: 'i-mesa' });
      break;
    }
    case 'desfazer': {
      sel = null;
      const f = api.desfazer();
      clearTimeout(timerToast);
      if (f && tela !== 'ficha' && api.fichaAtual()) tela = 'ficha';
      fecharFolha();
      render();
      toast(f ? 'Desfeito' : 'Nada para desfazer', { desfazer: false, iconeId: 'i-desfazer' });
      break;
    }
    case 'ir':
      ir(btn.dataset.tela);
      break;
    case 'abrir-ficha':
      if (api.abrirFicha(btn.dataset.id)) { vibrar(); ir('ficha'); }
      break;
    case 'retomar': {
      const p = api.abrirPartida(btn.dataset.id);
      if (!p) break;
      const ultima = prefs.ultimaFicha(p.id);
      if (ultima && p.fichas.some((x) => x.id === ultima)) api.abrirFicha(ultima);
      ir(api.fichaAtual() ? 'ficha' : 'mesa');
      break;
    }
    case 'adicionar': {
      const f = api.adicionarFicha(btn.dataset.id);
      if (!f) break;
      vibrar();
      ir('ficha');
      toast(`${SOB[f.sobreviventeId]?.nome ?? 'Sobrevivente'} · entrou na mesa`, { desfazer: false, iconeId: 'i-mesa' });
      break;
    }
    default: break;
  }
}

app.addEventListener('click', tratarClique);
folha.addEventListener('click', tratarClique);
toastEl.addEventListener('click', tratarClique);
fundo.addEventListener('click', fecharFolha);
document.addEventListener('keydown', (ev) => {
  if (ev.key !== 'Escape') return;
  if (folhaAtual) fecharFolha();
  else if (sel) { sel = null; render(); }
});

folha.addEventListener('input', (ev) => {
  const el = ev.target;
  if (el.dataset?.busca !== 'cartas') return;
  termoCartas = el.value;
  const lista = folha.querySelector('#lista-cartas');
  if (lista) lista.innerHTML = listaCartas({ cartas: EQUIPAMENTOS, termo: termoCartas });
});

folha.addEventListener('submit', (ev) => {
  const form = ev.target.closest('[data-form="texto-livre"]');
  if (!form) return;
  ev.preventDefault();
  const texto = String(new FormData(form).get('texto') ?? '');
  porUi(texto.trim() ? { texto } : null);
});

folha.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.dataset.acao === 'ultrared') {
    mudar((f) => { f.ultrared = el.checked; return f; }, `Ultrared · ${el.checked ? 'ligado' : 'desligado'}`);
  } else if (el.dataset.acao === 'wake-lock') {
    prefs.wakeLock = el.checked;
    aplicarWakeLock();
  }
});

app.addEventListener('submit', (ev) => {
  const form = ev.target.closest('[data-form="nova-partida"]');
  if (!form) return;
  ev.preventDefault();
  api.novaPartida(new FormData(form).get('nome'));
  ir('escolher');
});

// ---------- tela acesa (opcional) e salvar ao sair ----------

let sentinela = null;
async function aplicarWakeLock() {
  const quer = prefs.wakeLock && document.visibilityState === 'visible';
  if (quer && !sentinela && wakeLockSuportado) {
    try {
      sentinela = await navigator.wakeLock.request('screen');
      sentinela.addEventListener('release', () => { sentinela = null; });
    } catch { sentinela = null; }
  } else if (!quer && sentinela) {
    const s = sentinela;
    sentinela = null;
    s.release().catch(() => {});
  }
}
aplicarWakeLock();

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') api.salvar();
  aplicarWakeLock();
});
window.addEventListener('pagehide', () => api.salvar());
