// Ponto de entrada da página: liga estado, regras, dados e telas, e trata os toques.
import { SOBREVIVENTES } from '../dados/sobreviventes.js';
import { HABILIDADES } from '../dados/habilidades.js';
import { EQUIPAMENTOS } from '../dados/equipamentos.js';
import { criarEstado, CHAVE } from '../estado.js';
import { escolher } from '../regras.js';
import {
  telaInicial, desenharComRecuo, avisoDeSalvar, ferir, curar, gastarAcao, devolverAcao, novoTurno, mudarXp, mudarObjetivo, resumo,
} from './logica.js';
import {
  telaFicha, telaMesa, telaPartidas, telaEscolher, folhaEscolha, folhaConfig, folhaCartas, listaCartas, folhaIdCard,
  folhaCompartilhar,
} from './telas.js';
import { urlDaFicha, qrDoTexto, nomeBackup } from './compartilhar.js';
import { toqueSlot, moverSlot, porNoSlot, lerSlot, nomeNoSlot, nomeDoSlot } from './inventario.js';
import { criarPrefs } from './prefs.js';
import { icone, esc, NOME_NIVEL } from './dom.js';

const SOB = Object.fromEntries(SOBREVIVENTES.map((s) => [s.id, s]));
const EQ = Object.fromEntries(EQUIPAMENTOS.map((e) => [e.id, e]));
const TEMPO_DESFAZER = 5000;
const TEMPO_SEGURAR = 500;

let storage = null;
try { storage = globalThis.localStorage ?? null; } catch { /* bloqueado */ }

const api = criarEstado(storage ?? undefined, { habilidades: HABILIDADES, sobreviventes: SOB });
const prefs = criarPrefs(storage);
const app = document.getElementById('app');
const folha = document.getElementById('folha');
const fundo = document.getElementById('folha-fundo');
const toastEl = document.getElementById('toast');

let tela = 'escolher';
let folhaAtual = null; // 'escolha' | 'config' | 'cartas' | 'compartilhar' | 'card' | null
let sel = null; // slot selecionado para mover: { area, i, fichaId }
let alvoCartas = null; // slot que a folha de cartas vai preencher
let termoCartas = '';

// ---------- início ----------

api.carregar();
const recebida = receberLink();
tela = telaInicial(api).tela;
render();
if (recebida) setTimeout(() => avisarRecebida(recebida), 0);
try { navigator.storage?.persist?.().catch(() => {}); } catch { /* sem suporte */ }
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('sw.js').catch(() => { /* sem offline, segue */ });
}

/** Se a URL trouxer `#f=...`, põe a ficha na partida ativa e limpa o hash. Devolve a ficha ou null. */
function receberLink() {
  if (!location.hash.includes('f=')) return null;
  const f = api.importarLink(location.hash);
  history.replaceState(null, '', location.pathname + location.search);
  return f;
}

function avisarRecebida(f) {
  toast(`Ficha de ${SOB[f.sobreviventeId]?.nome ?? 'sobrevivente'} recebida · está na mesa`, { desfazer: false, iconeId: 'i-compartilhar' });
}

// link aberto com o app já aberto (mesma aba)
window.addEventListener('hashchange', () => {
  const f = receberLink();
  if (!f) return;
  sel = null;
  fecharFolha();
  tela = 'ficha';
  render();
  avisarRecebida(f);
});

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

  if (sel && (tela !== 'ficha' || sel.fichaId !== f?.id)) sel = null;
  const r = desenharComRecuo(tela, (t) => htmlDaTela(t, f, p));
  tela = r.tela;
  if (r.erro) {
    console.error(r.erro);
    sel = null;
    // no primeiro render o toast ainda não existe (let mais abaixo): avisa no próximo tique
    setTimeout(() => toast(`Erro ao abrir a tela · ${tela === 'mesa' ? 'voltei para a mesa' : 'voltei ao início'}`,
      { desfazer: false, sangue: true, iconeId: 'i-caveira' }), 0);
  }
  document.body.dataset.tela = tela;
  app.innerHTML = r.html;
  if (foco != null && foco >= 0) app.querySelectorAll('[data-acao]')[foco]?.focus({ preventScroll: true });
  if (folhaAtual === 'config' && f) folha.innerHTML = conteudoConfig();
}

function htmlDaTela(t, f, p) {
  if (t === 'ficha') {
    const html = telaFicha({
      ficha: f, sobrevivente: SOB[f.sobreviventeId], habilidades: HABILIDADES,
      fichasDaMesa: p.fichas, sobreviventes: SOB, equipamentos: EQ, selecionado: sel,
    });
    prefs.lembrarFicha(p.id, f.id);
    return html;
  }
  if (t === 'mesa') return telaMesa({ partida: p, sobreviventes: SOB, fichaAtiva: api.estado.fichaAtiva });
  if (t === 'partidas') return telaPartidas({ partidas: api.estado.partidas, partidaAtiva: api.estado.partidaAtiva });
  return telaEscolher({ sobreviventes: SOBREVIVENTES, habilidades: HABILIDADES, temPartida: Boolean(p) });
}

function ir(nova) {
  fecharToast();
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
let desfazerExtra = null; // desfazer que não passa pela pilha do estado (ex.: restaurar backup)
function toast(msg, { desfazer = true, sangue = false, iconeId = 'i-xp', aoDesfazer = null } = {}) {
  clearTimeout(timerToast);
  desfazerExtra = desfazer ? aoDesfazer : null;
  const [titulo, ...resto] = String(msg).split(' · ');
  toastEl.className = 'toast visivel' + (sangue ? ' toast--sangue' : '');
  toastEl.innerHTML = `${icone(iconeId)}<span class="toast__texto"><b>${esc(titulo)}</b>${esc(resto.join(' · '))}</span>`
    + (desfazer ? `<button class="btn btn-fantasma" type="button" data-acao="desfazer">${icone('i-desfazer')}Desfazer</button>` : '');
  timerToast = setTimeout(() => { toastEl.classList.remove('visivel'); }, desfazer ? TEMPO_DESFAZER : 2000);
}

/** Fecha o toast (e o Desfazer dele): trocar de ficha ou de tela não pode desfazer a ficha errada. */
function fecharToast() {
  clearTimeout(timerToast);
  desfazerExtra = null;
  toastEl.classList.remove('visivel');
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
  if (nova === f) return nova; // não mudou nada: sem toast nem Desfazer
  vibrar();
  render();
  const texto = typeof msg === 'function' ? msg(nova) : msg;
  toast(avisoDeSalvar(texto, api.pendente), api.pendente ? { ...opcoesToast, sangue: true } : opcoesToast);
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

// ---------- passar ficha (link/QR) e backup ----------

let linkAtual = null;

function abrirCompartilhar() {
  const f = api.fichaAtual();
  if (!f) return;
  linkAtual = urlDaFicha(location.href, api.exportarLink(f.id));
  if (!linkAtual) { toast('Não deu para gerar o link', { desfazer: false }); return; }
  abrirFolha('compartilhar', folhaCompartilhar({
    nome: SOB[f.sobreviventeId]?.nome ?? 'ficha',
    url: linkAtual,
    svgQr: qrDoTexto(globalThis.qrcode, linkAtual),
    podeCompartilhar: typeof navigator.share === 'function',
  }));
}

async function copiarLink() {
  if (!linkAtual) return;
  try {
    await navigator.clipboard.writeText(linkAtual);
    toast('Link copiado', { desfazer: false, iconeId: 'i-compartilhar' });
  } catch {
    const campo = folha.querySelector('[data-link="ficha"]');
    campo?.focus();
    campo?.select();
    toast('Selecione e copie o link', { desfazer: false, iconeId: 'i-compartilhar' });
  }
}

function enviarLink() {
  if (!linkAtual) return;
  navigator.share?.({ title: 'Ficha do Zombicide', url: linkAtual }).catch(() => {});
}

function baixarBackup() {
  try {
    const blob = new Blob([api.exportarJSON()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nomeBackup();
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 10000);
    toast('Backup salvo · ' + a.download, { desfazer: false, iconeId: 'i-compartilhar' });
  } catch {
    toast('Não deu para salvar o arquivo', { desfazer: false });
  }
}

async function restaurarBackup(arquivo) {
  if (!arquivo) return;
  let txt = '';
  try { txt = await arquivo.text(); } catch { /* ilegível */ }
  const antes = api.exportarJSON();
  if (!api.importarJSON(txt)) {
    toast('Arquivo inválido · não é um backup da ficha', { desfazer: false, sangue: true });
    return;
  }
  sel = null;
  tela = telaInicial(api).tela;
  render();
  const n = api.estado.partidas.length;
  toast(`Backup aberto · ${n} partida${n === 1 ? '' : 's'}`, {
    iconeId: 'i-desfazer',
    aoDesfazer: () => {
      api.importarJSON(antes);
      tela = telaInicial(api).tela;
      render();
      toast('Desfeito · voltou ao que era antes do backup', { desfazer: false, iconeId: 'i-desfazer' });
    },
  });
}

app.addEventListener('change', (ev) => {
  const el = ev.target;
  if (el.dataset?.acao !== 'importar-json') return;
  const arq = el.files?.[0];
  el.value = '';
  restaurarBackup(arq);
});

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
    case 'ver-card': abrirFolha('card', folhaIdCard({ sobrevivente: sobAtual() })); break;
    case 'abrir-compartilhar': abrirCompartilhar(); break;
    case 'copiar-link': copiarLink(); break;
    case 'enviar-link': enviarLink(); break;
    case 'exportar-json': baixarBackup(); break;
    case 'fechar-folha': fecharFolha(); break;
    case 'remover-ficha': {
      const f = api.fichaAtual();
      const nome = SOB[f.sobreviventeId]?.nome ?? 'ficha';
      api.removerFicha(f.id);
      fecharFolha();
      tela = api.fichaAtual() ? 'ficha' : 'mesa';
      render();
      toast(avisoDeSalvar(`${nome} saiu da mesa`, api.pendente), { iconeId: 'i-mesa', sangue: api.pendente });
      break;
    }
    case 'desfazer': {
      sel = null;
      if (desfazerExtra) {
        const fn = desfazerExtra;
        desfazerExtra = null;
        fn();
        break;
      }
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
      toast(avisoDeSalvar(`${SOB[f.sobreviventeId]?.nome ?? 'Sobrevivente'} · entrou na mesa`, api.pendente),
        { desfazer: false, iconeId: 'i-mesa', sangue: api.pendente });
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

// Só grava ao sair se houver mudança pendente: gravar o estado inteiro apagava o que outra aba salvou.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden' && api.pendente) api.salvar();
  aplicarWakeLock();
});
window.addEventListener('pagehide', () => { if (api.pendente) api.salvar(); });

// Outra aba gravou: relê e redesenha (a ficha aberta aqui continua a mesma).
window.addEventListener('storage', (ev) => {
  if (ev.key !== CHAVE && ev.key !== null) return;
  api.recarregar();
  if (sel && !api.fichaAtual()) sel = null;
  render();
});
