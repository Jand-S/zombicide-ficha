// Preferências só da interface (não fazem parte da ficha): Wake Lock e a última ficha de cada partida.
// Ficam numa chave separada para não mexer no formato do estado. Nunca lançam.
export const CHAVE_PREFS = 'zombicide-ficha:v1:ui';

export function criarPrefs(storage) {
  let dados = {};
  try {
    const bruto = storage?.getItem(CHAVE_PREFS);
    const obj = bruto ? JSON.parse(bruto) : {};
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) dados = obj;
  } catch { /* sem storage ou JSON ruim: começa vazio */ }
  if (!dados.ultimaFicha || typeof dados.ultimaFicha !== 'object') dados.ultimaFicha = {};

  function gravar() {
    try { storage?.setItem(CHAVE_PREFS, JSON.stringify(dados)); } catch { /* cheio: segue */ }
  }

  return {
    get wakeLock() { return dados.wakeLock === true; },
    set wakeLock(v) { dados.wakeLock = Boolean(v); gravar(); },
    /** Lembra a ficha aberta da partida, para "retomar" voltar nela. */
    lembrarFicha(partidaId, fichaId) {
      if (!partidaId || !fichaId || dados.ultimaFicha[partidaId] === fichaId) return;
      dados.ultimaFicha[partidaId] = fichaId;
      gravar();
    },
    ultimaFicha(partidaId) {
      return typeof dados.ultimaFicha[partidaId] === 'string' ? dados.ultimaFicha[partidaId] : null;
    },
  };
}
