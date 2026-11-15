// Estado do app: partidas, fichas, desfazer, link e backup.
// O armazenamento é injetado (criarEstado(storage)): no navegador é o localStorage,
// nos testes um objeto em memória com getItem/setItem/removeItem.
// Nada aqui pode derrubar o app: JSON corrompido, storage cheio ou ausente viram estado vazio ou `false`.
// Catálogo opcional (criarEstado(storage, { habilidades, sobreviventes })): com ele, escolhas com hid que não
// existe são descartadas e fichas de sobrevivente que não existe são recusadas (link, backup ou storage).
import { vidaMax, LIMITE_VIDA, LIMITE_ACOES } from './regras.js';

export const CHAVE = 'zombicide-ficha:v1';
export const CHAVE_CORROMPIDO = 'zombicide-ficha:v1:corrompido';
export const VERSAO = 1;
export const MAX_DESFAZER = 30;
export const LIMITE_LINK = 1500; // caracteres; precisa caber em um QR
const PREFIXO_LINK = '#f=';
const VERSAO_LINK = 1;

const TAM = { maos: 2, mochila: 3, extra: 2 };
// Faixas sãs para os números da ficha (dado ruim não vira milhões de pips).
export const LIMITES = Object.freeze({ xp: 999, voltas: 50, objetivos: 99, acoes: LIMITE_ACOES, ferimentos: LIMITE_VIDA });

function gerarId() {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function inteiro(n, min = 0) {
  const v = Math.trunc(Number(n));
  return Number.isFinite(v) ? Math.max(min, v) : min;
}

function faixa(n, max) {
  return Math.min(max, inteiro(n));
}

/** `colecao` é um objeto { [id]: ... } ou uma lista de ids / de { id }. */
function temId(colecao, id) {
  if (Array.isArray(colecao)) return colecao.some((x) => x === id || x?.id === id);
  return Object.hasOwn(colecao, id);
}

function sobreviventeDe(catalogo, id) {
  const c = catalogo?.sobreviventes;
  if (!c) return undefined;
  return Array.isArray(c) ? c.find((x) => x?.id === id) : (Object.hasOwn(c, id) ? c[id] : undefined);
}

function ehObjeto(x) {
  return x !== null && typeof x === 'object' && !Array.isArray(x);
}

function listaDeTexto(x) {
  return Array.isArray(x) ? x.filter((h) => typeof h === 'string') : [];
}

function normalizarSlot(s) {
  if (ehObjeto(s)) {
    if (typeof s.equipId === 'string' && s.equipId) return { equipId: s.equipId };
    if (typeof s.texto === 'string') return { texto: s.texto };
  }
  return null;
}

function normalizarSlots(lista, n) {
  const arr = Array.isArray(lista) ? lista : [];
  return Array.from({ length: n }, (_, i) => normalizarSlot(arr[i]));
}

/** Ficha nova, zerada, para um sobrevivente. */
export function fichaVazia(sobreviventeId, id = gerarId()) {
  return {
    id,
    sobreviventeId,
    xp: 0,
    voltas: 0,
    escolhas: { laranja: [], vermelho: [] },
    ferimentos: 0,
    acoesGastas: { normais: 0, gratis: {} },
    inventario: { maos: [null, null], mochila: [null, null, null], extra: [null, null] },
    objetivos: 0,
    ultrared: false,
  };
}

/**
 * Preenche o que faltar, corrige tipos e põe os números em faixas sãs; devolve null se não der para salvar a
 * ficha. Com `catalogo` ({ habilidades, sobreviventes }), descarta escolhas desconhecidas e recusa sobrevivente
 * que não existe.
 */
export function normalizarFicha(f, catalogo) {
  if (!ehObjeto(f) || typeof f.sobreviventeId !== 'string' || !f.sobreviventeId) return null;
  if (catalogo?.sobreviventes && !temId(catalogo.sobreviventes, f.sobreviventeId)) return null;
  const conhecida = (h) => !catalogo?.habilidades || temId(catalogo.habilidades, h);
  const escolhas = (lista) => listaDeTexto(lista).filter(conhecida);
  const gratis = {};
  if (ehObjeto(f.acoesGastas?.gratis)) {
    for (const [k, v] of Object.entries(f.acoesGastas.gratis)) gratis[k] = faixa(v, LIMITES.acoes);
  }
  const inv = ehObjeto(f.inventario) ? f.inventario : {};
  const nova = {
    id: typeof f.id === 'string' && f.id ? f.id : gerarId(),
    sobreviventeId: f.sobreviventeId,
    xp: faixa(f.xp, LIMITES.xp),
    voltas: faixa(f.voltas, LIMITES.voltas),
    escolhas: { laranja: escolhas(f.escolhas?.laranja), vermelho: escolhas(f.escolhas?.vermelho) },
    ferimentos: faixa(f.ferimentos, LIMITES.ferimentos),
    acoesGastas: { normais: faixa(f.acoesGastas?.normais, LIMITES.acoes), gratis },
    inventario: {
      maos: normalizarSlots(inv.maos, TAM.maos),
      mochila: normalizarSlots(inv.mochila, TAM.mochila),
      extra: normalizarSlots(inv.extra, TAM.extra),
    },
    objetivos: faixa(f.objetivos, LIMITES.objetivos),
    ultrared: Boolean(f.ultrared),
  };
  const sob = sobreviventeDe(catalogo, nova.sobreviventeId);
  if (sob) nova.ferimentos = Math.min(nova.ferimentos, vidaMax(nova, sob));
  return nova;
}

function estadoVazio() {
  return { versao: VERSAO, partidas: [], partidaAtiva: null, fichaAtiva: null };
}

/**
 * Leva um estado de qualquer versão anterior (ou lixo) para a versão atual.
 * v0 (sem `versao`): fichas sem `voltas` e outros campos faltando ganham os valores padrão.
 */
export function migrar(estadoAntigo, catalogo) {
  if (!ehObjeto(estadoAntigo)) return estadoVazio();
  const partidas = [];
  const idsFicha = new Set();
  for (const p of Array.isArray(estadoAntigo.partidas) ? estadoAntigo.partidas : []) {
    if (!ehObjeto(p)) continue;
    const fichas = [];
    for (const f of Array.isArray(p.fichas) ? p.fichas : []) {
      const n = normalizarFicha(f, catalogo);
      if (!n) continue;
      if (idsFicha.has(n.id)) n.id = gerarId();
      idsFicha.add(n.id);
      fichas.push(n);
    }
    partidas.push({
      id: typeof p.id === 'string' && p.id ? p.id : gerarId(),
      nome: typeof p.nome === 'string' ? p.nome : 'Partida',
      fichas,
      atualizadaEm: Number.isFinite(p.atualizadaEm) ? p.atualizadaEm : Date.now(),
    });
  }
  const ativa = partidas.find((p) => p.id === estadoAntigo.partidaAtiva) ?? partidas[0] ?? null;
  const fichaAtiva = ativa?.fichas.find((f) => f.id === estadoAntigo.fichaAtiva) ?? ativa?.fichas[0] ?? null;
  return { versao: VERSAO, partidas, partidaAtiva: ativa?.id ?? null, fichaAtiva: fichaAtiva?.id ?? null };
}

// ---------- link compacto (#f=base64url) ----------

function paraBase64url(txt) {
  const bytes = new TextEncoder().encode(txt);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function deBase64url(s) {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const bin = atob(b64 + '='.repeat((4 - (b64.length % 4)) % 4));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

// slot: null → 0, { equipId } → "id", { texto } → ["texto"]
function compactarSlot(s) {
  if (!s) return 0;
  if (s.equipId) return s.equipId;
  return [s.texto];
}

function expandirSlot(x) {
  if (typeof x === 'string' && x) return { equipId: x };
  if (Array.isArray(x) && typeof x[0] === 'string') return { texto: x[0] };
  return null;
}

function compactar(f) {
  const inv = f.inventario;
  const gratis = Object.keys(f.acoesGastas.gratis).length ? f.acoesGastas.gratis : 0;
  return [
    VERSAO_LINK, f.sobreviventeId, f.xp, f.voltas, f.escolhas.laranja, f.escolhas.vermelho,
    f.ferimentos, f.acoesGastas.normais, gratis,
    [...inv.maos, ...inv.mochila, ...inv.extra].map(compactarSlot),
    f.objetivos, f.ultrared ? 1 : 0,
  ];
}

function expandir(a, catalogo) {
  if (!Array.isArray(a) || a[0] !== VERSAO_LINK) return null;
  const [, sobreviventeId, xp, voltas, laranja, vermelho, ferimentos, normais, gratis, slots, objetivos, ultrared] = a;
  const s = Array.isArray(slots) ? slots.map(expandirSlot) : [];
  return normalizarFicha({
    sobreviventeId, xp, voltas, escolhas: { laranja, vermelho }, ferimentos,
    acoesGastas: { normais, gratis: ehObjeto(gratis) ? gratis : {} },
    inventario: { maos: s.slice(0, 2), mochila: s.slice(2, 5), extra: s.slice(5, 7) },
    objetivos, ultrared: ultrared === 1,
  }, catalogo);
}

/** Link de uma ficha. Se passar do limite do QR, encurta os textos livres mais longos. */
export function linkDaFicha(ficha) {
  const f = normalizarFicha(ficha);
  if (!f) return null;
  const montar = () => PREFIXO_LINK + paraBase64url(JSON.stringify(compactar(f)));
  let link = montar();
  const textos = () => Object.values(f.inventario).flat().filter((s) => s && 'texto' in s);
  while (link.length >= LIMITE_LINK) {
    const maior = textos().sort((a, b) => b.texto.length - a.texto.length)[0];
    if (!maior || maior.texto.length === 0) break;
    maior.texto = maior.texto.slice(0, Math.floor(maior.texto.length * 0.8));
    link = montar();
  }
  return link;
}

/** Ficha de um link (`#f=...`, com ou sem `#`), ou null se o link não for válido. */
export function fichaDoLink(hash, catalogo) {
  if (typeof hash !== 'string') return null;
  const i = hash.indexOf('f=');
  if (i < 0) return null;
  try {
    return expandir(JSON.parse(deBase64url(hash.slice(i + 2).trim())), catalogo);
  } catch {
    return null;
  }
}

// ---------- armazenamento em memória (fallback) ----------

export function storageEmMemoria() {
  const dados = new Map();
  return {
    getItem: (k) => (dados.has(k) ? dados.get(k) : null),
    setItem: (k, v) => { dados.set(k, String(v)); },
    removeItem: (k) => { dados.delete(k); },
  };
}

function storagePadrao() {
  try {
    if (globalThis.localStorage) return globalThis.localStorage;
  } catch { /* acesso bloqueado */ }
  return storageEmMemoria();
}

// ---------- estado ----------

export function criarEstado(storage = storagePadrao(), catalogo = null) {
  let estado = estadoVazio();
  let pilha = []; // desfazer: { tipo: 'alterar' | 'remover', partidaId, ficha, indice }
  // Mudanças desta aba ainda não gravadas. Ao salvar, elas vão por cima do que está no storage
  // (que outra aba pode ter mudado), ficha a ficha.
  let sujo = false;
  let tudo = false; // importarJSON: o estado inteiro vem desta aba
  const mexidas = new Set(); // ids de ficha criada, alterada ou removida aqui
  const partidasNovas = new Set();

  function marcar(fichaId) {
    sujo = true;
    if (fichaId) mexidas.add(fichaId);
  }

  function limparPendencias() {
    sujo = false;
    tudo = false;
    mexidas.clear();
    partidasNovas.clear();
  }

  /** O que está gravado agora (talvez por outra aba), ou null se não der para ler. */
  function lerGravado() {
    try {
      const bruto = storage.getItem(CHAVE);
      return bruto == null ? estadoVazio() : migrar(JSON.parse(bruto), catalogo);
    } catch {
      return null;
    }
  }

  /** `base` (gravado) com as mudanças pendentes desta aba por cima; a ficha aberta continua a desta aba. */
  function mesclar(base) {
    if (!base || tudo) return estado;
    for (const id of partidasNovas) {
      const lp = estado.partidas.find((p) => p.id === id);
      if (lp && !base.partidas.some((p) => p.id === id)) base.partidas.push(lp);
    }
    for (const fid of mexidas) {
      let lp = null;
      let idxLocal = -1;
      for (const p of estado.partidas) {
        idxLocal = p.fichas.findIndex((f) => f.id === fid);
        if (idxLocal >= 0) { lp = p; break; }
      }
      const ficha = lp?.fichas[idxLocal] ?? null;
      let deBase = null;
      let posBase = -1;
      for (const bp of base.partidas) {
        posBase = bp.fichas.findIndex((f) => f.id === fid);
        if (posBase >= 0) { deBase = bp; bp.fichas.splice(posBase, 1); break; }
      }
      if (!ficha) continue; // removida nesta aba
      let bp = base.partidas.find((p) => p.id === lp.id);
      if (!bp) {
        bp = { id: lp.id, nome: lp.nome, fichas: [], atualizadaEm: lp.atualizadaEm };
        base.partidas.push(bp);
      }
      bp.fichas.splice(bp === deBase ? posBase : Math.min(idxLocal, bp.fichas.length), 0, ficha);
      bp.atualizadaEm = Math.max(bp.atualizadaEm, lp.atualizadaEm);
    }
    const pa = base.partidas.find((p) => p.id === estado.partidaAtiva);
    if (pa) {
      base.partidaAtiva = pa.id;
      base.fichaAtiva = pa.fichas.some((f) => f.id === estado.fichaAtiva) ? estado.fichaAtiva : (pa.fichas[0]?.id ?? null);
    }
    return base;
  }

  const api = {
    ultimoErro: null,

    get estado() { return estado; },

    carregar() {
      let bruto = null;
      try {
        bruto = storage.getItem(CHAVE);
      } catch (e) {
        api.ultimoErro = e;
      }
      if (bruto == null) {
        estado = estadoVazio();
      } else {
        try {
          estado = migrar(JSON.parse(bruto), catalogo);
        } catch (e) {
          api.ultimoErro = e;
          try { storage.setItem(CHAVE_CORROMPIDO, bruto); } catch { /* sem espaço: segue */ }
          estado = estadoVazio();
        }
      }
      pilha = [];
      limparPendencias();
      return estado;
    },

    /** Há mudança desta aba ainda não gravada (ex.: o storage estava cheio). */
    get pendente() { return sujo; },

    /**
     * Grava as mudanças pendentes (sem mudança, não grava nada). Relê o storage e põe por cima, ficha a ficha,
     * o que esta aba mudou, para não apagar o que outra aba gravou. Devolve false (sem lançar) se o storage
     * estiver cheio ou bloqueado; aí a mudança segue pendente.
     */
    salvar() {
      if (!sujo) return true;
      estado = mesclar(tudo ? null : lerGravado());
      try {
        storage.setItem(CHAVE, JSON.stringify(estado));
        api.ultimoErro = null;
        limparPendencias();
        return true;
      } catch (e) {
        api.ultimoErro = e;
        return false;
      }
    },

    /** Relê o storage (outra aba gravou), mantendo as mudanças pendentes e a ficha aberta nesta aba. */
    recarregar() {
      estado = mesclar(lerGravado());
      return estado;
    },

    partidaAtual() {
      return estado.partidas.find((p) => p.id === estado.partidaAtiva) ?? null;
    },

    fichaAtual() {
      return api.partidaAtual()?.fichas.find((f) => f.id === estado.fichaAtiva) ?? null;
    },

    novaPartida(nome) {
      const p = {
        id: gerarId(),
        nome: typeof nome === 'string' && nome.trim() ? nome.trim() : `Partida ${estado.partidas.length + 1}`,
        fichas: [],
        atualizadaEm: Date.now(),
      };
      estado.partidas.push(p);
      estado.partidaAtiva = p.id;
      estado.fichaAtiva = null;
      partidasNovas.add(p.id);
      marcar();
      api.salvar();
      return p;
    },

    abrirPartida(id) {
      const p = estado.partidas.find((x) => x.id === id);
      if (!p) return null;
      estado.partidaAtiva = p.id;
      estado.fichaAtiva = p.fichas[0]?.id ?? null;
      marcar();
      api.salvar();
      return api.partidaAtual() ?? p; // a versão já mesclada com o storage
    },

    /** Deixa ativa a ficha `id` (e a partida dela). Devolve a ficha, ou null se não existir. */
    abrirFicha(id) {
      for (const p of estado.partidas) {
        const f = p.fichas.find((x) => x.id === id);
        if (!f) continue;
        estado.partidaAtiva = p.id;
        estado.fichaAtiva = f.id;
        marcar();
        api.salvar();
        return api.fichaAtual() ?? f; // a versão já mesclada com o storage
      }
      return null;
    },

    /** Põe uma ficha nova na partida ativa (cria uma partida se não houver) e a deixa ativa. */
    adicionarFicha(sobreviventeId) {
      if (typeof sobreviventeId !== 'string' || !sobreviventeId) return null;
      const p = api.partidaAtual() ?? api.novaPartida();
      const f = fichaVazia(sobreviventeId);
      p.fichas.push(f);
      p.atualizadaEm = Date.now();
      estado.fichaAtiva = f.id;
      marcar(f.id);
      api.salvar();
      return f;
    },

    removerFicha(id) {
      for (const p of estado.partidas) {
        const i = p.fichas.findIndex((f) => f.id === id);
        if (i < 0) continue;
        const [f] = p.fichas.splice(i, 1);
        empilhar({ tipo: 'remover', partidaId: p.id, indice: i, ficha: f });
        p.atualizadaEm = Date.now();
        if (estado.fichaAtiva === id) estado.fichaAtiva = p.fichas[0]?.id ?? null;
        marcar(id);
        api.salvar();
        return true;
      }
      return false;
    },

    /** Aplica fn a uma cópia da ficha (fn pode alterar a cópia ou devolver outra) e empilha o desfazer. */
    alterarFicha(id, fn) {
      for (const p of estado.partidas) {
        const i = p.fichas.findIndex((f) => f.id === id);
        if (i < 0) continue;
        const antes = p.fichas[i];
        const copia = structuredClone(antes);
        const r = fn(copia);
        const nova = normalizarFicha(ehObjeto(r) ? r : copia, catalogo);
        if (!nova) return null;
        nova.id = antes.id;
        p.fichas[i] = nova;
        p.atualizadaEm = Date.now();
        empilhar({ tipo: 'alterar', partidaId: p.id, ficha: antes });
        marcar(id);
        api.salvar();
        return nova;
      }
      return null;
    },

    /** Volta a última alteração ou remoção. Devolve a ficha restaurada, ou null se não houver o que desfazer. */
    desfazer() {
      while (pilha.length) {
        const passo = pilha.pop();
        const p = estado.partidas.find((x) => x.id === passo.partidaId);
        if (!p) continue;
        if (passo.tipo === 'alterar') {
          const i = p.fichas.findIndex((f) => f.id === passo.ficha.id);
          if (i < 0) continue;
          p.fichas[i] = passo.ficha;
        } else {
          p.fichas.splice(Math.min(passo.indice, p.fichas.length), 0, passo.ficha);
          estado.fichaAtiva = passo.ficha.id;
          estado.partidaAtiva = p.id;
        }
        p.atualizadaEm = Date.now();
        marcar(passo.ficha.id);
        api.salvar();
        return passo.ficha;
      }
      return null;
    },

    podeDesfazer() {
      return pilha.length > 0;
    },

    exportarLink(fichaId) {
      for (const p of estado.partidas) {
        const f = p.fichas.find((x) => x.id === fichaId);
        if (f) return linkDaFicha(f);
      }
      return null;
    },

    /** Lê um `#f=` e põe a ficha (com id novo) na partida ativa. Devolve a ficha ou null. */
    importarLink(hash) {
      const f = fichaDoLink(hash, catalogo);
      if (!f) return null;
      f.id = gerarId();
      const p = api.partidaAtual() ?? api.novaPartida();
      p.fichas.push(f);
      p.atualizadaEm = Date.now();
      estado.fichaAtiva = f.id;
      marcar(f.id);
      api.salvar();
      return f;
    },

    exportarJSON() {
      return JSON.stringify(estado);
    },

    /** Troca o estado pelo backup. Devolve true, ou false (sem mexer em nada) se o texto não for um backup. */
    importarJSON(txt) {
      let dados;
      try {
        dados = JSON.parse(txt);
      } catch (e) {
        api.ultimoErro = e;
        return false;
      }
      if (!ehObjeto(dados) || !Array.isArray(dados.partidas)) return false;
      estado = migrar(dados, catalogo);
      pilha = [];
      limparPendencias();
      tudo = true;
      marcar();
      api.salvar();
      return true;
    },

    migrar: (estadoAntigo) => migrar(estadoAntigo, catalogo),
  };

  function empilhar(passo) {
    pilha.push(passo);
    if (pilha.length > MAX_DESFAZER) pilha.splice(0, pilha.length - MAX_DESFAZER);
  }

  return api;
}
