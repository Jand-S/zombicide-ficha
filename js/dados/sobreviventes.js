// Os 12 sobreviventes da caixa base do Zombicide 2ª edição.
// Árvores: tabela "2nd Edition > Survivor" de cada página do Zombicide Wiki (Fandom), conferidas com o ID Card.
// tipo e vida: lidos no ID Card de cada um (imagem do card oficial 2E; ver notes/dados-fontes.md).
// Kid tem o símbolo de Kid no card e a barra de vida 2-1-caveira; adulto não tem símbolo e a barra é 3-2-1-caveira.
// Bate com o rulebook ("Classic Survivors ... usually start with Health 3", Kids "usually start with Health 2") e
// com a caixa (6 adultos e 6 kids). fonte = imagem do ID Card; wiki: https://zombicide.fandom.com/wiki/<Nome>.
// Correção: no laranja de Tiger Sam o wiki dizia "+1 free Combat Action"; o ID Card diz "+1 Free Move Action"
// (e o wiki repetia +1 free Combat no laranja e no vermelho). Ficou o que está no card.
const CARD = 'https://raw.githubusercontent.com/Axiileszko/zombicide/HEAD/Zombicide/Assets/Resources/Characters/';

function s(id, nome, card, tipo, vida, azul, amarelo, laranja, vermelho, confirmado) {
  return {
    id, nome, tipo, vida,
    habilidades: { azul: [azul], amarelo: [amarelo], laranja, vermelho },
    fonte: CARD + card + '.jpg',
    confirmado,
  };
}

export const SOBREVIVENTES = [
  s('ostara', 'Ostara', 'ostara', 'kid', 2, 'busca-mais-de-uma-vez', 'mais-1-acao',
    ['mais-1-dado-distancia', 'mais-1-acao-gratis-movimento'],
    ['mais-1-acao-gratis-combate', 'mais-1-no-dado-distancia', 'escorregadio'], true),
  s('lili', 'Lili', 'lili', 'kid', 2, 'mais-1-alcance-max', 'mais-1-acao',
    ['mais-1-dado-distancia', 'disparada'],
    ['mais-1-acao-gratis-combate', 'mais-1-acao-gratis-movimento', 'mais-1-no-dado-combate'], true),
  s('tiger-sam', 'Tiger Sam', 'tigersam', 'kid', 2, 'mais-1-dado-distancia', 'mais-1-acao',
    ['mais-1-acao-gratis-movimento', 'atirador-de-elite'],
    ['mais-1-dano-distancia', 'mais-1-acao-gratis-combate', 'empurrao'], true),
  s('odin', 'Odin', 'odin', 'kid', 2, 'mais-1-dado-corpo', 'mais-1-acao',
    ['mais-1-acao-gratis-corpo', 'mais-1-acao-gratis-movimento'],
    ['mais-1-dado-corpo', 'mais-1-dado-distancia', 'mais-1-acao-gratis-combate'], true),
  s('bunny-g', 'Bunny G', 'bunnyg', 'kid', 2, 'sortudo', 'mais-1-acao',
    ['mais-1-no-dado-corpo', 'salto'],
    ['mais-1-dano-corpo', 'mais-1-acao-gratis-combate', 'seis-mais-1-dado-combate'], true),
  s('lou', 'Lou', 'lou', 'kid', 2, 'investida', 'mais-1-acao',
    ['mais-1-dado-combate', 'mais-1-acao-gratis-corpo'],
    ['mais-1-acao-gratis-movimento', 'mais-1-acao-gratis-distancia', 'medico'], true),
  s('josh', 'Josh', 'josh', 'adulto', 3, 'escorregadio', 'mais-1-acao',
    ['mais-1-dado-corpo', 'mais-1-acao-gratis-combate'],
    ['mais-1-acao-gratis-movimento', 'mais-1-no-dado-combate', 'sortudo'], true),
  s('doug', 'Doug', 'doug', 'adulto', 3, 'par-perfeito', 'mais-1-acao',
    ['mais-1-dado-distancia', 'mais-1-acao-gratis-combate'],
    ['mais-1-no-dado-combate', 'ambidestro', 'escorregadio'], true),
  s('elle', 'Elle', 'elle', 'adulto', 3, 'atirador-de-elite', 'mais-1-acao',
    ['mais-1-dado-combate', 'mais-1-acao-gratis-distancia'],
    ['mais-1-dado-distancia', 'mais-1-acao-gratis-combate', 'mais-1-no-dado-distancia'], true),
  s('amy', 'Amy', 'amy', 'adulto', 3, 'mais-1-acao-gratis-movimento', 'mais-1-acao',
    ['mais-1-acao-gratis-corpo', 'mais-1-acao-gratis-distancia'],
    ['mais-1-dado-combate', 'mais-1-no-dado-combate', 'medico'], true),
  s('ned', 'Ned', 'ned', 'adulto', 3, 'mais-1-acao-gratis-busca', 'mais-1-acao',
    ['mais-1-dado-distancia', 'mais-1-acao-gratis-combate'],
    ['mais-1-dado-combate', 'mais-1-no-dado-combate', 'empurrao'], true),
  s('wanda', 'Wanda', 'wanda', 'adulto', 3, 'disparada', 'mais-1-acao',
    ['mais-1-no-dado-corpo', 'escorregadio'],
    ['mais-1-dado-combate', 'mais-1-acao-gratis-corpo', 'mais-1-acao-gratis-movimento'], true),
];
