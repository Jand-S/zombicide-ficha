// Os 12 sobreviventes da caixa base do Zombicide 2ª edição.
// Árvores: tabela "2nd Edition > Survivor" de cada página do Zombicide Wiki (Fandom).
// tipo e vida: só Bunny G tem fonte (a página diz que é "kid"; Kid começa com 2 de vida pelo rulebook).
// Os outros 11 ficam com tipo e vida null e confirmado: false até alguém conferir o ID Card.
const WIKI = 'https://zombicide.fandom.com/wiki/';

function s(id, nome, pagina, tipo, vida, azul, amarelo, laranja, vermelho, confirmado) {
  return {
    id, nome, tipo, vida,
    habilidades: { azul: [azul], amarelo: [amarelo], laranja, vermelho },
    fonte: WIKI + pagina,
    confirmado,
  };
}

export const SOBREVIVENTES = [
  s('ostara', 'Ostara', 'Ostara', null, null, 'busca-mais-de-uma-vez', 'mais-1-acao',
    ['mais-1-dado-distancia', 'mais-1-acao-gratis-movimento'],
    ['mais-1-acao-gratis-combate', 'mais-1-no-dado-distancia', 'escorregadio'], false),
  s('lili', 'Lili', 'Lili', null, null, 'mais-1-alcance-max', 'mais-1-acao',
    ['mais-1-dado-distancia', 'disparada'],
    ['mais-1-acao-gratis-combate', 'mais-1-acao-gratis-movimento', 'mais-1-no-dado-combate'], false),
  s('tiger-sam', 'Tiger Sam', 'Tiger_Sam', null, null, 'mais-1-dado-distancia', 'mais-1-acao',
    ['mais-1-acao-gratis-combate', 'atirador-de-elite'],
    ['mais-1-dano-distancia', 'mais-1-acao-gratis-combate', 'empurrao'], false),
  s('odin', 'Odin', 'Odin', null, null, 'mais-1-dado-corpo', 'mais-1-acao',
    ['mais-1-acao-gratis-corpo', 'mais-1-acao-gratis-movimento'],
    ['mais-1-dado-corpo', 'mais-1-dado-distancia', 'mais-1-acao-gratis-combate'], false),
  s('bunny-g', 'Bunny G', 'Bunny_G', 'kid', 2, 'sortudo', 'mais-1-acao',
    ['mais-1-no-dado-corpo', 'salto'],
    ['mais-1-dano-corpo', 'mais-1-acao-gratis-combate', 'seis-mais-1-dado-combate'], true),
  s('lou', 'Lou', 'Lou', null, null, 'investida', 'mais-1-acao',
    ['mais-1-dado-combate', 'mais-1-acao-gratis-corpo'],
    ['mais-1-acao-gratis-movimento', 'mais-1-acao-gratis-distancia', 'medico'], false),
  s('josh', 'Josh', 'Josh', null, null, 'escorregadio', 'mais-1-acao',
    ['mais-1-dado-corpo', 'mais-1-acao-gratis-combate'],
    ['mais-1-acao-gratis-movimento', 'mais-1-no-dado-combate', 'sortudo'], false),
  s('doug', 'Doug', 'Doug', null, null, 'par-perfeito', 'mais-1-acao',
    ['mais-1-dado-distancia', 'mais-1-acao-gratis-combate'],
    ['mais-1-no-dado-combate', 'ambidestro', 'escorregadio'], false),
  s('elle', 'Elle', 'Elle', null, null, 'atirador-de-elite', 'mais-1-acao',
    ['mais-1-dado-combate', 'mais-1-acao-gratis-distancia'],
    ['mais-1-dado-distancia', 'mais-1-acao-gratis-combate', 'mais-1-no-dado-distancia'], false),
  s('amy', 'Amy', 'Amy', null, null, 'mais-1-acao-gratis-movimento', 'mais-1-acao',
    ['mais-1-acao-gratis-corpo', 'mais-1-acao-gratis-distancia'],
    ['mais-1-dado-combate', 'mais-1-no-dado-combate', 'medico'], false),
  s('ned', 'Ned', 'Ned', null, null, 'mais-1-acao-gratis-busca', 'mais-1-acao',
    ['mais-1-dado-distancia', 'mais-1-acao-gratis-combate'],
    ['mais-1-dado-combate', 'mais-1-no-dado-combate', 'empurrao'], false),
  s('wanda', 'Wanda', 'Wanda', null, null, 'disparada', 'mais-1-acao',
    ['mais-1-no-dado-corpo', 'escorregadio'],
    ['mais-1-dado-combate', 'mais-1-acao-gratis-corpo', 'mais-1-acao-gratis-movimento'], false),
];
