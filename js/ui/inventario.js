// Inventário sem DOM: slots da ficha, mover/trocar carta, pôr carta ou texto, busca nas cartas.
// Um slot é endereçado por { area: 'maos' | 'mochila' | 'extra', i }. Cada slot guarda null,
// { equipId } ou { texto } (formato do contrato). Tudo puro: devolve fichas novas.

export const AREAS = Object.freeze(['maos', 'mochila', 'extra']);
export const TAMANHO = Object.freeze({ maos: 2, mochila: 3, extra: 2 });
export const NOME_AREA = Object.freeze({ maos: 'Mão', mochila: 'Mochila', extra: 'Hoard' });
export const MAX_TEXTO = 40;

function copiar(f) {
  return structuredClone(f);
}

function refValida(ref) {
  return Boolean(ref) && AREAS.includes(ref.area) && Number.isInteger(ref.i) && ref.i >= 0 && ref.i < TAMANHO[ref.area];
}

function garantirInventario(f) {
  const inv = f.inventario && typeof f.inventario === 'object' ? f.inventario : {};
  f.inventario = inv;
  for (const a of AREAS) {
    const lista = Array.isArray(inv[a]) ? inv[a] : [];
    inv[a] = Array.from({ length: TAMANHO[a] }, (_, i) => lista[i] ?? null);
  }
  return inv;
}

export function mesmoSlot(a, b) {
  return Boolean(a && b) && a.area === b.area && a.i === b.i;
}

/** "Mão 1", "Mochila 3", "Hoard 2". */
export function nomeDoSlot(ref) {
  return `${NOME_AREA[ref?.area] ?? '?'} ${(ref?.i ?? 0) + 1}`;
}

export function lerSlot(ficha, ref) {
  if (!refValida(ref)) return null;
  return ficha?.inventario?.[ref.area]?.[ref.i] ?? null;
}

/**
 * Slots que a ficha mostra. Os 2 extras só aparecem com Hoard ativo, ou se ainda tiverem carta
 * (para nada sumir da ficha quando o Hoard deixa de valer).
 */
export function slotsDaFicha(ficha, hoard) {
  const inv = ficha?.inventario ?? {};
  const pegar = (a) => Array.from({ length: TAMANHO[a] }, (_, i) => inv[a]?.[i] ?? null);
  const extra = pegar('extra');
  return {
    maos: pegar('maos'),
    mochila: pegar('mochila'),
    extra: hoard || extra.some(Boolean) ? extra : null,
  };
}

/** Troca o conteúdo de dois slots (se o destino estiver vazio, é só mover). */
export function moverSlot(ficha, de, para) {
  const f = copiar(ficha);
  if (!refValida(de) || !refValida(para) || mesmoSlot(de, para)) return f;
  const inv = garantirInventario(f);
  const a = inv[de.area][de.i];
  inv[de.area][de.i] = inv[para.area][para.i];
  inv[para.area][para.i] = a;
  return f;
}

/** Põe uma carta ({ equipId }), um texto livre ({ texto }) ou nada (null = descartar) no slot. */
export function porNoSlot(ficha, ref, conteudo) {
  const f = copiar(ficha);
  if (!refValida(ref)) return f;
  const inv = garantirInventario(f);
  let slot = null;
  if (conteudo && typeof conteudo.equipId === 'string' && conteudo.equipId) slot = { equipId: conteudo.equipId };
  else if (conteudo && typeof conteudo.texto === 'string') {
    const t = conteudo.texto.replace(/\s+/g, ' ').trim().slice(0, MAX_TEXTO);
    slot = t ? { texto: t } : null;
  }
  inv[ref.area][ref.i] = slot;
  return f;
}

/**
 * O que um toque num slot faz, dado o slot já selecionado (`sel`).
 * - nada selecionado + slot com carta: seleciona (1º toque);
 * - nada selecionado + slot vazio: abre a folha de cartas;
 * - tocar de novo no selecionado: cancela;
 * - outro slot: move/troca (2º toque).
 */
export function toqueSlot(sel, ficha, ref) {
  if (!refValida(ref)) return { sel, efeito: null };
  if (!sel) {
    return lerSlot(ficha, ref)
      ? { sel: { area: ref.area, i: ref.i }, efeito: null }
      : { sel: null, efeito: { tipo: 'cartas', alvo: ref } };
  }
  if (mesmoSlot(sel, ref)) return { sel: null, efeito: null };
  return { sel: null, efeito: { tipo: 'mover', de: sel, para: ref } };
}

// ---------- cartas ----------

function normal(s) {
  return String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

/** Cartas com nome que batem com a busca (sem acento e sem caixa), em ordem alfabética. */
export function buscarCartas(equipamentos, termo) {
  const t = normal(termo);
  const palavras = t ? t.split(' ') : [];
  return (equipamentos ?? [])
    .filter((e) => e && typeof e.nome === 'string' && e.nome)
    .filter((e) => {
      const alvo = normal(`${e.nome} ${e.id}`);
      return palavras.every((p) => alvo.includes(p));
    })
    .sort((a, b) => a.nome.localeCompare(b.nome, 'en') || Number(b.inicial) - Number(a.inicial));
}

const SEM = '—';
const NOME_PORTA = { silencioso: 'silenciosa', barulhento: 'barulhenta' };

function simNao(v) {
  if (v === true) return 'sim';
  if (v === false) return 'não';
  return SEM;
}

/** Atributos de uma carta para mostrar. O que os dados não têm aparece como "—" (nunca chutado). */
export function atributosCarta(e) {
  const num = (v) => (Number.isFinite(v) ? String(v) : SEM);
  const alcance = Array.isArray(e?.alcance) && e.alcance.length === 2 ? `${e.alcance[0]}–${e.alcance[1]}` : SEM;
  return [
    { id: 'dados', icone: 'i-dado', rotulo: 'Dados', valor: num(e?.dados) },
    { id: 'precisao', icone: 'i-mira', rotulo: 'Precisão', valor: Number.isFinite(e?.precisao) ? `${e.precisao}+` : SEM },
    { id: 'dano', icone: 'i-caveira', rotulo: 'Dano', valor: num(e?.dano) },
    { id: 'alcance', icone: 'i-bala', rotulo: 'Alcance', valor: alcance },
    { id: 'dual', icone: 'i-mao', rotulo: 'Dual', valor: simNao(e?.dual) },
    { id: 'porta', icone: 'i-porta', rotulo: 'Porta', valor: e?.abrePorta ? NOME_PORTA[e.abrePorta] ?? e.abrePorta : SEM },
    { id: 'barulho', icone: 'i-barulho', rotulo: 'Barulho', valor: simNao(e?.barulhento) },
  ];
}

/** Perfis de ataque da carta: um só (rotulo null) ou um por modo, para cartas como a Gunblade. */
export function perfisDaCarta(e) {
  if (Array.isArray(e?.perfis) && e.perfis.length) {
    return e.perfis.map((p) => ({ rotulo: NOME_TIPO_CARTA[p.tipo] ?? p.tipo, carta: { ...e, ...p } }));
  }
  return [{ rotulo: null, carta: e }];
}

export const NOME_TIPO_CARTA = { corpo: 'Corpo a corpo', distancia: 'Distância', ambos: 'Corpo e distância', item: 'Item' };

/** Nome que o slot mostra: o da carta, o texto livre, ou null se vazio. */
export function nomeNoSlot(slot, porId) {
  if (!slot) return null;
  if ('texto' in slot) return slot.texto;
  return porId?.[slot.equipId]?.nome ?? slot.equipId;
}
