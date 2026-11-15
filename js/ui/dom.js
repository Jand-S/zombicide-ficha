// Ajudantes pequenos de DOM/HTML usados pelas telas.

const MAPA = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escapa texto para pôr dentro de HTML (nomes de partida e textos livres vêm do usuário). */
export function esc(v) {
  return String(v ?? '').replace(/[&<>"']/g, (c) => MAPA[c]);
}

/** <svg> de um ícone do sprite (caminho relativo: o Pages serve em /zombicide-ficha/). */
export function icone(id, classe = '') {
  return `<svg class="icone${classe ? ' ' + classe : ''}" aria-hidden="true"><use href="assets/icones.svg#${id}"/></svg>`;
}

export const NOME_NIVEL = { azul: 'Azul', amarelo: 'Amarelo', laranja: 'Laranja', vermelho: 'Vermelho' };

export const NOME_ACAO = {
  combate: 'combate', corpo: 'corpo a corpo', distancia: 'à distância', movimento: 'movimento', busca: 'busca',
};

export function barraPerigo({ xp, voltas }) {
  const ur = voltas > 0;
  const rotulo = ur ? `Adrenalina (Ultrared, volta ${voltas})` : 'Adrenalina';
  return `<div class="barra-perigo${ur ? ' barra-perigo--ultrared' : ''}" style="--xp: ${xp}" role="meter"
    aria-label="${rotulo}" aria-valuemin="0" aria-valuemax="43" aria-valuenow="${xp}">
    <div class="barra-perigo__trilho">
      <span class="zona" data-nivel="azul"></span><span class="zona" data-nivel="amarelo"></span><span class="zona" data-nivel="laranja"></span><span class="zona" data-nivel="vermelho"></span>
      <span class="barra-perigo__marcador"><b>${xp}</b></span>
    </div>
    <div class="barra-perigo__marcas" aria-hidden="true"><span style="--em:0">0</span><span style="--em:7">7</span><span style="--em:19">19</span><span style="--em:43">43</span></div>
  </div>`;
}
