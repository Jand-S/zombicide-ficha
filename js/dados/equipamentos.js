// As 63 cartas de equipamento da caixa base do Zombicide 2ª edição.
// Contagem (qtd), inicial e épico: lista de componentes do rulebook. A 63ª é a carta de referência do Car
// (o rulebook lista "1 Reference Card: Car" dentro das 63 Equipment cards).
// Atributos das armas comuns: lidos na imagem de cada carta (formato 2E) e conferidos com o que o rulebook diz
// (Katana 2 dados e dano 1 silenciosa; Pistol Dual; Fire Axe abre porta com barulho e mata em silêncio; Chainsaw
// barulhenta; Shotgun dano 2 barulhenta; Sawed-Off 0-1; Sniper 1-3). Todos batem.
// As imagens estão num repositório de fã (ver notes/dados-fontes.md); a carta do Fire Axe se chama "AXE" lá.
// Iniciais: só a imagem do Baseball Bat é a versão inicial (fundo cinza); Crowbar, Fire Axe e Pistol iniciais
// usam os atributos da carta da pilha, que tem o mesmo nome.
// Épicos e itens: lidos na imagem de cada carta (mesmo repositório). Itens não têm atributos de arma (só texto),
// então dados/precisão/dano/alcance/dual/porta/barulho ficam null, com confirmado: true (como no Molotov).
// Gunblade e Ma's Shotgun têm dois perfis na carta (distância e corpo a corpo) e o contrato só guarda um: ficam
// tipo 'ambos' com os números null e confirmado: false. Lido na carta:
//   Gunblade: distância 0-1 / 2 dados / 4+ / dano 2, barulhenta; corpo 0 / 4 dados / 4+ / dano 2, silenciosa.
//   Ma's Shotgun: distância 0-1 / 2 dados / 3+ / dano 2, barulhenta; corpo 0 / 1 dado / 3+ / dano 2, silenciosa; Reload.
// O Army Sniper Rifle se chama "MILITARY SNIPER RIFLE" na carta (o nome do rulebook fica).
// imagem: arte oficial © CMON, caminho relativo à página (ver assets/oficial/LEIA-ME.md). Opcional.
const FONTE = 'https://rulespal.com/zombicide-2nd-edition/rulebook';
const IMG = 'https://raw.githubusercontent.com/Axiileszko/zombicide/HEAD/Zombicide/Assets/Resources/Items/';
const CARTAS = 'assets/oficial/cartas/';
// Carta (arquivo em assets/oficial/cartas) de cada id. As iniciais Crowbar, Fire Axe e Pistol usam a da pilha.
const ARTE = {
  'baseball-bat-inicial': 'baseball-bat-inicial', 'crowbar-inicial': 'crowbar', 'fire-axe-inicial': 'fire-axe',
  'pistol-inicial': 'pistol',
};
const SEM_ARTE = new Set(['aaahh-epico', 'car-referencia']); // o repositório não tem essas cartas

function e(id, nome, qtd, extra = {}) {
  return {
    id, nome,
    tipo: null, dados: null, precisao: null, dano: null, alcance: null, dual: null,
    abrePorta: null, barulhento: null,
    epico: false, inicial: false, qtd,
    fonte: FONTE, confirmado: false,
    ...extra,
    ...(SEM_ARTE.has(id) ? {} : { imagem: CARTAS + (ARTE[id] ?? id) + '.jpg' }),
  };
}

// Arma lida na carta: [tipo, dados, precisão, dano, [min, max], dual, abrePorta, barulhento, imagem].
function arma(tipo, dados, precisao, dano, alcance, dual, abrePorta, barulhento, img) {
  return { tipo, dados, precisao, dano, alcance, dual, abrePorta, barulhento, fonte: IMG + img, confirmado: true };
}

const BASEBALL_BAT = arma('corpo', 2, 3, 1, [0, 0], false, null, false, 'baseballbat.png');
const CROWBAR = arma('corpo', 1, 4, 1, [0, 0], false, 'silencioso', false, 'crowbar.png');
const FIRE_AXE = arma('corpo', 1, 4, 2, [0, 0], false, 'barulhento', false, 'axe.png');
const PISTOL = arma('distancia', 1, 3, 1, [0, 1], true, null, true, 'pistol.png');
const CHAINSAW = arma('corpo', 5, 5, 2, [0, 0], false, 'barulhento', true, 'chainsaw.png');
const KATANA = arma('corpo', 2, 4, 1, [0, 0], true, null, false, 'katana.png');
const KUKRI = arma('corpo', 2, 4, 2, [0, 0], false, null, false, 'kukri.png');
const MACHETE = arma('corpo', 1, 3, 2, [0, 0], true, null, false, 'machete.png');
// Molotov: a carta não tem dados, precisão nem dano ("Discard from Hand: Eliminate all Actors in the targeted Zone").
const MOLOTOV = arma('distancia', null, null, null, [1, 1], false, null, true, 'molotov.png');
const SAWED_OFF = arma('distancia', 2, 3, 1, [0, 1], true, null, true, 'sawedoff.png');
const SHOTGUN = arma('distancia', 2, 4, 2, [0, 1], false, null, true, 'shotgun.png');
const SNIPER = arma('distancia', 1, 3, 2, [1, 3], false, null, true, 'sniperrifle.png');
const SUB_MG = arma('distancia', 3, 5, 1, [0, 1], true, null, true, 'submg.png');
// Épicos lidos na carta.
const ARMY_SNIPER = arma('distancia', 2, 3, 2, [1, 4], false, null, true, 'militarysniperrifle.png');
const AUTO_SHOTGUN = arma('distancia', 3, 4, 2, [0, 1], false, null, true, 'autshotgun.png');
const EVIL_TWINS = arma('distancia', 2, 3, 1, [0, 1], false, null, true, 'eviltwins.png');
const GOLDEN_AK = arma('distancia', 3, 4, 2, [1, 2], false, null, true, 'goldenak47.png');
const GOLDEN_KUKRI = arma('corpo', 4, 4, 2, [0, 0], false, null, false, 'goldenkukri.png');
const NAILBAT = arma('corpo', 2, 3, 2, [0, 0], false, null, false, 'nailbat.png');
const ZANTETSUKEN = arma('corpo', 5, 4, 1, [0, 0], false, null, false, 'zantetsuken.png');
// Carta com dois perfis (corpo a corpo e distância): os números ficam em `perfis`, lidos na imagem da carta.
const AMBOS = (img, perfis) => ({ tipo: 'ambos', dual: false, abrePorta: null, fonte: IMG + img, confirmado: true, perfis });
// Item lido na carta: sem atributos de arma.
const LIDO = (img) => ({ tipo: 'item', fonte: IMG + img, confirmado: true });
const ITEM = { tipo: 'item' };
const INICIAL = { inicial: true };
const EPICO = { epico: true };

export const EQUIPAMENTOS = [
  // Iniciais (6)
  e('baseball-bat-inicial', 'Baseball Bat', 1, { ...BASEBALL_BAT, ...INICIAL }),
  e('crowbar-inicial', 'Crowbar', 1, { ...CROWBAR, ...INICIAL }),
  e('fire-axe-inicial', 'Fire Axe', 1, { ...FIRE_AXE, ...INICIAL }),
  e('pistol-inicial', 'Pistol', 3, { ...PISTOL, ...INICIAL }),
  // Pilha de equipamento (45)
  e('aaahh', 'Aaahh!!', 4, LIDO('zombie.png')),
  e('bag-of-rice', 'Bag of Rice', 2, LIDO('rice.png')),
  e('canned-food', 'Canned Food', 2, LIDO('cannedfood.png')),
  e('chainsaw', 'Chainsaw', 2, CHAINSAW),
  e('crowbar', 'Crowbar', 1, CROWBAR),
  e('fire-axe', 'Fire Axe', 1, FIRE_AXE),
  e('flashlight', 'Flashlight', 2, LIDO('flashlight.png')),
  e('katana', 'Katana', 2, KATANA),
  e('kukri', 'Kukri', 2, KUKRI),
  e('machete', 'Machete', 4, MACHETE),
  e('molotov', 'Molotov', 4, MOLOTOV),
  e('pistol', 'Pistol', 1, PISTOL),
  e('plenty-of-bullets', 'Plenty of Bullets', 3, LIDO('plentyofbullets.png')),
  e('plenty-of-shells', 'Plenty of Shells', 3, LIDO('plentyofshells.png')),
  e('sawed-off', 'Sawed-Off', 4, SAWED_OFF),
  e('shotgun', 'Shotgun', 2, SHOTGUN),
  e('sniper-rifle', 'Sniper Rifle', 2, SNIPER),
  e('sub-mg', 'Sub-MG', 2, SUB_MG),
  e('water', 'Water', 2, LIDO('water.png')),
  // Épicos (11)
  e('aaahh-epico', 'Aaahh!', 2, { ...ITEM, ...EPICO }),
  e('army-sniper-rifle', 'Army Sniper Rifle', 1, { ...ARMY_SNIPER, ...EPICO }),
  e('automatic-shotgun', 'Automatic Shotgun', 1, { ...AUTO_SHOTGUN, ...EPICO }),
  e('evil-twins', 'Evil Twins', 1, { ...EVIL_TWINS, ...EPICO }),
  e('golden-ak-47', 'Golden AK-47', 1, { ...GOLDEN_AK, ...EPICO }),
  e('golden-kukri', 'Golden Kukri', 1, { ...GOLDEN_KUKRI, ...EPICO }),
  e('gunblade', 'Gunblade', 1, { ...AMBOS('gunblade.png', [
    { tipo: 'corpo', dados: 4, precisao: 4, dano: 2, alcance: [0, 0], barulhento: false },
    { tipo: 'distancia', dados: 2, precisao: 4, dano: 2, alcance: [0, 1], barulhento: true },
  ]), ...EPICO }),
  e('mas-shotgun', "Ma's Shotgun", 1, { ...AMBOS('masshotgun.png', [
    { tipo: 'corpo', dados: 1, precisao: 3, dano: 2, alcance: [0, 0], barulhento: false },
    { tipo: 'distancia', dados: 2, precisao: 3, dano: 2, alcance: [0, 1], barulhento: true },
  ]), ...EPICO }),
  e('nailbat', 'Nailbat', 1, { ...NAILBAT, ...EPICO }),
  e('zantetsuken', 'Zantetsuken', 1, { ...ZANTETSUKEN, ...EPICO }),
  // Carta de referência (1): a 63ª carta da lista de componentes. Não é arma nem item de inventário.
  e('car-referencia', 'Car (carta de referência)', 1, { confirmado: true }),
];
