// Regras do Zombicide 2ª edição usadas pela ficha (docs/regras-2e.md).
// Funções puras: não mexem no DOM, não leem storage e nunca alteram a ficha recebida.
// Os dados do sobrevivente (vida, árvore de habilidades) chegam por parâmetro.

export const NIVEIS = Object.freeze([
  Object.freeze({ id: 'azul', min: 0 }),
  Object.freeze({ id: 'amarelo', min: 7 }),
  Object.freeze({ id: 'laranja', min: 19 }),
  Object.freeze({ id: 'vermelho', min: 43 }),
]);

// Ações por turno sem habilidades (rulebook 2E: 3 ações).
export const ACOES_BASE = 3;
// Vida inicial por tipo, usada quando o sobrevivente não traz `vida` (adulto 3, Kid 2).
export const VIDA_POR_TIPO = Object.freeze({ adulto: 3, kid: 2 });
// hids aceitos para Hoard (o nome final vem do leg `dados`).
export const HIDS_HOARD = Object.freeze(['hoard', 'acumulador']);

// Padrões de hid com efeito numérico (kebab-case, como nos exemplos do contrato).
const RE_ACAO = /^mais-(\d+)-acao$/;
const RE_ACAO_GRATIS = /^mais-(\d+)-acao-gratis-([a-z0-9-]+)$/;
const RE_VIDA = /^comeca-com-(\d+)-de-vida$/;

const TOPO = NIVEIS[NIVEIS.length - 1].min; // 43: onde o Ultrared dá a volta

function inteiro(n) {
  const v = Math.trunc(Number(n));
  return Number.isFinite(v) ? v : 0;
}

function indiceNivel(id) {
  return NIVEIS.findIndex((n) => n.id === id);
}

function clonar(obj) {
  return structuredClone(obj);
}

function escolhasDe(ficha, nivel) {
  const lista = ficha?.escolhas?.[nivel];
  return Array.isArray(lista) ? lista : [];
}

function arvore(sobrevivente, nivel) {
  const lista = sobrevivente?.habilidades?.[nivel];
  return Array.isArray(lista) ? lista.filter((h) => typeof h === 'string') : [];
}

/** Id do nível para um valor de XP (marcador da barra). */
export function nivelPorXp(xp) {
  const v = inteiro(xp);
  let id = NIVEIS[0].id;
  for (const n of NIVEIS) if (v >= n.min) id = n.id;
  return id;
}

/** Nível em que o sobrevivente está: com voltas de Ultrared ele continua no Vermelho. */
export function nivelAtual(ficha) {
  return inteiro(ficha?.voltas) > 0 ? 'vermelho' : nivelPorXp(ficha?.xp);
}

/** Habilidades valendo agora, sem repetição, na ordem azul → vermelho. */
export function habilidadesAtivas(ficha, sobrevivente) {
  const idx = indiceNivel(nivelAtual(ficha));
  const voltas = inteiro(ficha?.voltas);
  const lista = [...arvore(sobrevivente, 'azul')];
  if (idx >= 1) lista.push(...arvore(sobrevivente, 'amarelo'));
  // Escolhas já feitas continuam guardadas; valem quando o nível as alcança
  // (ou sempre, depois de uma volta de Ultrared).
  if (idx >= 2 || voltas > 0) lista.push(...escolhasDe(ficha, 'laranja'));
  if (idx >= 3 || voltas > 0) lista.push(...escolhasDe(ficha, 'vermelho'));
  return [...new Set(lista.filter((h) => typeof h === 'string'))];
}

/** Quantas escolhas de cada cor a ficha já deveria ter feito. */
function escolhasDevidas(ficha) {
  const voltas = inteiro(ficha?.voltas);
  const xp = inteiro(ficha?.xp);
  return {
    laranja: voltas + (xp >= NIVEIS[2].min ? 1 : 0),
    vermelho: voltas + (xp >= NIVEIS[3].min ? 1 : 0),
  };
}

/**
 * Próxima escolha que falta fazer (laranja antes de vermelho), ou null.
 * `opcoes` são as da árvore que ainda não foram pegas; se não sobrar nenhuma (Ultrared),
 * vêm da lista geral `habilidades` (array de hid ou objeto { [hid]: ... }), se for passada.
 */
export function escolhaPendente(ficha, sobrevivente, { habilidades } = {}) {
  const devidas = escolhasDevidas(ficha);
  for (const nivel of ['laranja', 'vermelho']) {
    if (escolhasDe(ficha, nivel).length >= devidas[nivel]) continue;
    const jaTem = new Set([
      ...habilidadesAtivas(ficha, sobrevivente),
      ...escolhasDe(ficha, 'laranja'),
      ...escolhasDe(ficha, 'vermelho'),
    ]);
    let opcoes = arvore(sobrevivente, nivel).filter((h) => !jaTem.has(h));
    if (opcoes.length === 0 && habilidades) {
      const geral = Array.isArray(habilidades) ? habilidades : Object.keys(habilidades);
      opcoes = geral.filter((h) => typeof h === 'string' && !jaTem.has(h));
    }
    return { nivel, opcoes: [...new Set(opcoes)] };
  }
  return null;
}

/** Guarda uma escolha de laranja/vermelho. Devolve uma ficha nova. */
export function escolher(ficha, nivel, hid) {
  if (nivel !== 'laranja' && nivel !== 'vermelho') throw new Error(`nível sem escolha: ${nivel}`);
  const nova = clonar(ficha);
  nova.escolhas = { laranja: [...escolhasDe(ficha, 'laranja')], vermelho: [...escolhasDe(ficha, 'vermelho')] };
  if (!nova.escolhas[nivel].includes(hid)) nova.escolhas[nivel].push(hid);
  return nova;
}

/**
 * Soma `delta` ao XP. Com Ultrared, ao chegar a 43 o marcador volta a 0 somando o que passou
 * (e conta uma volta); um delta negativo desfaz a volta. Sem Ultrared o XP só não fica abaixo de 0.
 * Extras opcionais em `opcoes`: `sobrevivente` e `habilidades` (para preencher as opções da escolha).
 */
export function aplicarXp(ficha, delta, { ultrared, sobrevivente, habilidades } = {}) {
  const comUltrared = ultrared ?? Boolean(ficha?.ultrared);
  const antes = nivelAtual(ficha);
  let xp = inteiro(ficha?.xp) + inteiro(delta);
  let voltas = Math.max(0, inteiro(ficha?.voltas));
  if (comUltrared) {
    while (xp >= TOPO) { xp -= TOPO; voltas += 1; }
    while (xp < 0 && voltas > 0) { xp += TOPO; voltas -= 1; }
  }
  if (xp < 0) xp = 0;

  const nova = clonar(ficha);
  nova.xp = xp;
  nova.voltas = voltas;
  nova.escolhas = { laranja: [...escolhasDe(ficha, 'laranja')], vermelho: [...escolhasDe(ficha, 'vermelho')] };

  const de = indiceNivel(antes);
  const ate = indiceNivel(nivelAtual(nova));
  const niveisNovos = ate > de ? NIVEIS.slice(de + 1, ate + 1).map((n) => n.id) : [];
  return { ficha: nova, niveisNovos, escolhaPendente: escolhaPendente(nova, sobrevivente, { habilidades }) };
}

/** Ações do turno: normais (3 + "+N Action") e grátis por tipo ("+N free <tipo> Action"). */
export function acoesDoTurno(ficha, sobrevivente) {
  let normais = ACOES_BASE;
  const gratis = {};
  for (const hid of habilidadesAtivas(ficha, sobrevivente)) {
    let m = RE_ACAO.exec(hid);
    if (m) { normais += Number(m[1]); continue; }
    m = RE_ACAO_GRATIS.exec(hid);
    if (m) gratis[m[2]] = (gratis[m[2]] ?? 0) + Number(m[1]);
  }
  return { normais, gratis };
}

/** Vida máxima: a do sobrevivente (ou 3 adulto / 2 Kid); "Starts with X Health" troca a inicial. */
export function vidaMax(ficha, sobrevivente) {
  const base = Number.isFinite(sobrevivente?.vida) && sobrevivente.vida > 0
    ? sobrevivente.vida
    : (VIDA_POR_TIPO[sobrevivente?.tipo] ?? VIDA_POR_TIPO.adulto);
  let vida = base;
  for (const hid of habilidadesAtivas(ficha, sobrevivente)) {
    const m = RE_VIDA.exec(hid);
    if (m) vida = Math.max(vida, Number(m[1]));
  }
  return vida;
}

/** Hoard ativo: libera os 2 slots extras (que contam como mochila). */
export function temHoard(ficha, sobrevivente) {
  return habilidadesAtivas(ficha, sobrevivente).some((h) => HIDS_HOARD.includes(h));
}
