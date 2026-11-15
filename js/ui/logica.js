// Lógica da interface sem DOM: o que cada toque faz na ficha e o que a tela mostra.
// Tudo puro (recebe e devolve objetos novos), para dar para testar com `node --test`.
import {
  NIVEIS, nivelAtual, aplicarXp, escolhaPendente, habilidadesAtivas, acoesDoTurno, vidaMax, temHoard,
} from '../regras.js';

export const XP_OBJETIVO = 5; // cada objetivo vale 5 XP (docs/regras-2e.md)

function copiar(f) {
  return structuredClone(f);
}

function n(v) {
  const x = Math.trunc(Number(v));
  return Number.isFinite(x) && x > 0 ? x : 0;
}

// ---------- tela inicial ----------

/**
 * Para onde o app vai ao abrir: a última ficha, se houver; senão a mesa da partida ativa;
 * senão a lista de partidas; e, sem nada salvo, direto para a escolha do sobrevivente.
 * `api` é o objeto de criarEstado() já carregado.
 */
export function telaInicial(api) {
  const f = api.fichaAtual();
  if (f) return { tela: 'ficha', fichaId: f.id };
  if (api.partidaAtual()) return { tela: 'mesa' };
  if (api.estado.partidas.length) return { tela: 'partidas' };
  return { tela: 'escolher' };
}

/**
 * Desenha `tela`; se lançar erro, tenta Mesa, Partidas e por fim a escolha (que não lê ficha nenhuma),
 * para o app nunca ficar preso em 'carregando'. Devolve { tela, html, erro } (erro: o primeiro, ou null).
 */
export function desenharComRecuo(tela, desenhar) {
  const ordem = [...new Set([tela, 'mesa', 'partidas', 'escolher'])];
  let erro = null;
  for (const t of ordem) {
    try {
      return { tela: t, html: desenhar(t), erro };
    } catch (e) {
      erro ??= e;
    }
  }
  return { tela: 'escolher', html: '', erro };
}

/** Texto do toast depois de uma mudança; se ela não foi gravada (storage cheio), avisa antes. */
export function avisoDeSalvar(msg, pendente) {
  return pendente ? `Não foi possível salvar · ${msg}` : msg;
}

// ---------- vida ----------

export function ferir(ficha, max) {
  const f = copiar(ficha);
  f.ferimentos = Math.min(n(max), n(f.ferimentos) + 1);
  return f;
}

export function curar(ficha) {
  const f = copiar(ficha);
  f.ferimentos = Math.max(0, n(f.ferimentos) - 1);
  return f;
}

// ---------- ações ----------

/** Gasta 1 ação (`tipo` null = normal; senão a grátis daquele tipo), sem passar de `total`. */
export function gastarAcao(ficha, tipo, total) {
  const f = copiar(ficha);
  f.acoesGastas = f.acoesGastas ?? { normais: 0, gratis: {} };
  f.acoesGastas.gratis = f.acoesGastas.gratis ?? {};
  if (tipo == null) f.acoesGastas.normais = Math.min(n(total), n(f.acoesGastas.normais) + 1);
  else f.acoesGastas.gratis[tipo] = Math.min(n(total), n(f.acoesGastas.gratis[tipo]) + 1);
  return f;
}

/** Devolve 1 ação gasta (toque em um pip já gasto). */
export function devolverAcao(ficha, tipo) {
  const f = copiar(ficha);
  f.acoesGastas = f.acoesGastas ?? { normais: 0, gratis: {} };
  f.acoesGastas.gratis = f.acoesGastas.gratis ?? {};
  if (tipo == null) f.acoesGastas.normais = Math.max(0, n(f.acoesGastas.normais) - 1);
  else {
    const v = Math.max(0, n(f.acoesGastas.gratis[tipo]) - 1);
    if (v) f.acoesGastas.gratis[tipo] = v;
    else delete f.acoesGastas.gratis[tipo];
  }
  return f;
}

export function novoTurno(ficha) {
  const f = copiar(ficha);
  f.acoesGastas = { normais: 0, gratis: {} };
  return f;
}

// ---------- XP e escolha de habilidade ----------

/**
 * Soma `delta` ao XP e diz se o seletor de escolha deve abrir: só quando a mudança cria uma escolha nova
 * (subiu para laranja/vermelho, ou deu volta no Ultrared), não a cada +1 com uma escolha já adiada.
 */
export function mudarXp(ficha, delta, sobrevivente, habilidades) {
  const antes = escolhaPendente(ficha, sobrevivente, { habilidades });
  const r = aplicarXp(ficha, delta, { sobrevivente, habilidades });
  const subiu = r.niveisNovos.some((x) => x === 'laranja' || x === 'vermelho');
  const volta = n(r.ficha.voltas) > n(ficha.voltas);
  const nova = r.escolhaPendente && (!antes || antes.nivel !== r.escolhaPendente.nivel || subiu || volta);
  return { ficha: r.ficha, niveisNovos: r.niveisNovos, escolha: nova ? r.escolhaPendente : null };
}

/** Pegar (+1) ou devolver (−1) um objetivo: mexe no contador e no XP (5 cada). */
export function mudarObjetivo(ficha, delta, sobrevivente, habilidades) {
  if (delta < 0 && n(ficha.objetivos) === 0) return { ficha: copiar(ficha), niveisNovos: [], escolha: null };
  const r = mudarXp(ficha, delta * XP_OBJETIVO, sobrevivente, habilidades);
  r.ficha.objetivos = Math.max(0, n(ficha.objetivos) + delta);
  return r;
}

// ---------- o que a ficha mostra ----------

/** Dados prontos para desenhar a ficha (`habilidades` = lista geral, para a escolha do Ultrared). */
export function resumo(ficha, sobrevivente, habilidades) {
  const nivel = nivelAtual(ficha);
  const max = vidaMax(ficha, sobrevivente);
  const ferimentos = Math.min(max, n(ficha.ferimentos));
  const turno = acoesDoTurno(ficha, sobrevivente);
  const gastas = ficha.acoesGastas ?? { normais: 0, gratis: {} };
  const ativas = new Set(habilidadesAtivas(ficha, sobrevivente));
  const idx = NIVEIS.findIndex((x) => x.id === nivel);
  const xp = n(ficha.xp);
  const voltas = n(ficha.voltas);
  const proximo = voltas > 0 ? null : (NIVEIS.find((x) => x.min > xp)?.min ?? null);

  const arvore = {};
  for (const { id } of NIVEIS) {
    const lista = Array.isArray(sobrevivente?.habilidades?.[id]) ? sobrevivente.habilidades[id] : [];
    const escolhidas = ficha.escolhas?.[id] ?? [];
    // escolhas do Ultrared que não estão na árvore também aparecem
    const extras = escolhidas.filter((h) => !lista.includes(h));
    arvore[id] = [...lista, ...extras].map((hid) => ({
      hid,
      ativa: ativas.has(hid),
      escolhida: escolhidas.includes(hid),
    }));
  }

  return {
    nivel,
    xp,
    voltas,
    proximo,
    vidaMax: max,
    vida: max - ferimentos,
    ferimentos,
    eliminado: ferimentos >= max,
    acoes: {
      normais: turno.normais,
      gastas: Math.min(turno.normais, n(gastas.normais)),
      gratis: Object.entries(turno.gratis).map(([tipo, total]) => ({
        tipo, total, gastas: Math.min(total, n(gastas.gratis?.[tipo])),
      })),
    },
    alcancados: NIVEIS.slice(0, idx + 1).map((x) => x.id),
    arvore,
    escolhaPendente: escolhaPendente(ficha, sobrevivente, { habilidades }),
    hoard: temHoard(ficha, sobrevivente),
    conferir: sobrevivente?.confirmado === false,
  };
}

/** Iniciais para o retrato genérico ("Tiger Sam" → "TS", "Odin" → "OD"). */
export function iniciais(nome) {
  const partes = String(nome ?? '').trim().split(/\s+/).filter(Boolean);
  if (!partes.length) return '?';
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}
