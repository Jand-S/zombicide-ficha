// As 63 cartas de equipamento da caixa base do Zombicide 2ª edição.
// Contagem (qtd), inicial e épico: lista de componentes do rulebook.
// Atributos: só os que o texto do rulebook diz com todas as letras. O resto fica null até alguém
// conferir as cartas. Por isso nenhuma carta está com confirmado: true.
const FONTE = 'https://rulespal.com/zombicide-2nd-edition/rulebook';

function e(id, nome, qtd, extra = {}) {
  return {
    id, nome,
    tipo: null, dados: null, precisao: null, dano: null, alcance: null, dual: null,
    abrePorta: null, barulhento: null,
    epico: false, inicial: false, qtd,
    fonte: FONTE, confirmado: false,
    ...extra,
  };
}

// Atributos citados no rulebook (iguais na versão inicial e na da pilha).
const PISTOL = { dual: true };
const FIRE_AXE = { abrePorta: 'barulhento', barulhento: false };
const CHAINSAW = { abrePorta: 'barulhento', barulhento: true };
const KATANA = { tipo: 'corpo', dano: 1, barulhento: false };
const SHOTGUN = { tipo: 'distancia', dano: 2, barulhento: true };
const SAWED_OFF = { tipo: 'distancia', alcance: [0, 1] };
const SNIPER = { tipo: 'distancia', alcance: [1, 3] };
const MOLOTOV = { tipo: 'distancia' };
const ITEM = { tipo: 'item' };
const INICIAL = { inicial: true };
const EPICO = { epico: true };

export const EQUIPAMENTOS = [
  // Iniciais (6)
  e('baseball-bat-inicial', 'Baseball Bat', 1, INICIAL),
  e('crowbar-inicial', 'Crowbar', 1, INICIAL),
  e('fire-axe-inicial', 'Fire Axe', 1, { ...FIRE_AXE, ...INICIAL }),
  e('pistol-inicial', 'Pistol', 3, { ...PISTOL, ...INICIAL }),
  // Pilha de equipamento (45)
  e('aaahh', 'Aaahh!!', 4, ITEM),
  e('bag-of-rice', 'Bag of Rice', 2, ITEM),
  e('canned-food', 'Canned Food', 2, ITEM),
  e('chainsaw', 'Chainsaw', 2, CHAINSAW),
  e('crowbar', 'Crowbar', 1),
  e('fire-axe', 'Fire Axe', 1, FIRE_AXE),
  e('flashlight', 'Flashlight', 2, ITEM),
  e('katana', 'Katana', 2, KATANA),
  e('kukri', 'Kukri', 2),
  e('machete', 'Machete', 4),
  e('molotov', 'Molotov', 4, MOLOTOV),
  e('pistol', 'Pistol', 1, PISTOL),
  e('plenty-of-bullets', 'Plenty of Bullets', 3, ITEM),
  e('plenty-of-shells', 'Plenty of Shells', 3, ITEM),
  e('sawed-off', 'Sawed-Off', 4, SAWED_OFF),
  e('shotgun', 'Shotgun', 2, SHOTGUN),
  e('sniper-rifle', 'Sniper Rifle', 2, SNIPER),
  e('sub-mg', 'Sub-MG', 2),
  e('water', 'Water', 2, ITEM),
  // Épicos (12)
  e('aaahh-epico', 'Aaahh!', 2, { ...ITEM, ...EPICO }),
  e('army-sniper-rifle', 'Army Sniper Rifle', 1, EPICO),
  e('automatic-shotgun', 'Automatic Shotgun', 1, EPICO),
  e('evil-twins', 'Evil Twins', 1, EPICO),
  e('golden-ak-47', 'Golden AK-47', 1, EPICO),
  e('golden-kukri', 'Golden Kukri', 1, EPICO),
  e('gunblade', 'Gunblade', 1, EPICO),
  e('mas-shotgun', "Ma's Shotgun", 1, EPICO),
  e('nailbat', 'Nailbat', 1, EPICO),
  e('zantetsuken', 'Zantetsuken', 1, EPICO),
  // A lista de componentes soma 62, mas o rulebook fala em 63 cartas: falta identificar 1.
  // Fica como carta sem nome e sem dados até alguém conferir (não inventar).
  e('carta-nao-identificada', null, 1),
];
