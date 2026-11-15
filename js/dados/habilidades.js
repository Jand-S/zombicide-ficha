// Habilidades do Zombicide 2ª edição (seção Skills do rulebook, 64 habilidades).
// As habilidades com parâmetro ([Action], [Action type]) viram uma entrada por valor.
// As de parâmetro livre ([X] Health, [Equipment], [Zombie type], [game effect]) ficam genéricas.
const FONTE = 'https://rulespal.com/zombicide-2nd-edition/rulebook';

const ACOES = [
  { en: 'Combat', pt: 'Combate', id: 'combate', de: 'de combate' },
  { en: 'Melee', pt: 'Corpo a corpo', id: 'corpo', de: 'corpo a corpo' },
  { en: 'Ranged', pt: 'À distância', id: 'distancia', de: 'à distância' },
];
const ACOES_GRATIS = [
  ...ACOES,
  { en: 'Move', pt: 'Movimento', id: 'movimento', de: 'de movimento' },
  { en: 'Search', pt: 'Busca', id: 'busca', de: 'de busca' },
];

const h = {};
function add(hid, nome, pt, desc) {
  h[hid] = { nome, pt, desc, fonte: FONTE };
}
function porAcao(lista, base, nome, pt, desc) {
  for (const a of lista) add(`${base}-${a.id}`, nome(a.en), pt(a), desc(a));
}

add('mais-1-acao', '+1 Action', '+1 Ação', 'Ganha 1 ação extra para usar como quiser.');
porAcao(ACOES, 'mais-1-dano', (x) => `+1 Damage: ${x}`, (a) => `+1 de dano: ${a.pt}`,
  (a) => `Soma 1 ao dano das ações ${a.de}.`);
porAcao(ACOES, 'mais-1-dado', (x) => `+1 die: ${x}`, (a) => `+1 dado: ${a.pt}`,
  (a) => `Cada arma rola 1 dado a mais nas ações ${a.de}. Armas Dual ganham 1 cada.`);
porAcao(ACOES_GRATIS, 'mais-1-acao-gratis', (x) => `+1 free ${x} Action`, (a) => `+1 ação grátis: ${a.pt}`,
  (a) => `Ganha 1 ação grátis ${a.de}, que só serve para esse tipo.`);
add('mais-1-alcance-max', '+1 max Range', '+1 de alcance máximo', 'O alcance máximo das armas à distância sobe 1.');
add('mais-1-zona-por-movimento', '+1 Zone per Move', '+1 zona por movimento',
  'Com 1 ação de movimento anda 1 ou 2 zonas. Entrar em zona com zumbis encerra o movimento.');
porAcao(ACOES, 'mais-1-no-dado', (x) => `+1 to dice roll: ${x}`, (a) => `+1 no resultado: ${a.pt}`,
  (a) => `Soma 1 a cada dado das ações ${a.de}. O máximo é 6.`);
porAcao(ACOES, 'dano-2', (x) => `${x}: Damage 2`, (a) => `${a.pt}: dano 2`,
  (a) => `Armas ${a.de} com dano 1 contam como dano 2.`);
add('2-coqueteis', '2 cocktails are better than 1', '2 coquetéis são melhores que 1',
  'Ao descartar um Molotov numa ação à distância, rola 1 dado: com 4+ o Molotov volta grátis para a mochila.');
add('ambidestro', 'Ambidextrous', 'Ambidestro', 'Todas as armas contam como Dual.');
add('barbaro', 'Barbarian', 'Bárbaro',
  'Na ação corpo a corpo, pode usar o número de zumbis da zona no lugar dos dados da arma.');
add('blitz', 'Blitz', 'Blitz',
  'Uma vez por turno, por 1 ação, anda até 2 zonas até uma zona com zumbis ao alcance da arma à distância e ganha 1 ação à distância grátis.');
porAcao(ACOES, 'sede-de-sangue', (x) => `Bloodlust: ${x}`, (a) => `Sede de sangue: ${a.pt}`,
  (a) => `Uma vez por turno, por 1 ação, anda até 2 zonas até uma zona com zumbi e ganha 1 ação ${a.de} grátis.`);
add('lider-nato', 'Born leader', 'Líder nato',
  'No seu turno, pode dar 1 ação grátis a outro sobrevivente, que a usa na hora.');
add('arrombar', 'Break-in', 'Arrombar',
  'Abre portas sem equipamento e sem barulho. Ganha 1 ação grátis só para abrir portas.');
add('irmao-de-armas', 'Brother in arms: [game effect]', 'Irmão de armas: [efeito]',
  'Com outro sobrevivente na mesma zona, todos ali ganham o efeito indicado (Companions não).');
add('busca-mais-de-uma-vez', 'Can Search more than once', 'Pode buscar mais de uma vez',
  'Pode fazer várias buscas por turno, gastando 1 ação por busca.');
add('investida', 'Charge', 'Investida',
  'Uma vez por turno, de graça, anda até 2 zonas até uma zona com pelo menos 1 zumbi.');
add('reflexos-de-combate', 'Combat reflexes', 'Reflexos de combate',
  'Quando zumbis surgem a alcance 0-1, faz 1 ação de combate grátis contra eles. Uma vez por carta de zumbi.');
add('destino', 'Destiny', 'Destino',
  'Uma vez por turno, ao revelar uma carta de equipamento, pode descartá-la e comprar outra do mesmo baralho.');
add('distribuidor', 'Distributor', 'Distribuidor',
  'Na fase de surgimento, compra uma carta de zumbi por zona de surgimento ativa e escolhe onde cada uma vai.');
add('encouracado', 'Dreadnought: [Zombie type]', 'Encouraçado: [tipo de zumbi]',
  'Ignora todos os ferimentos causados por zumbis do tipo indicado.');
add('especialista-em-duplas', 'Dual expert', 'Especialista em Dual',
  'Com armas Dual equipadas, ganha 1 ação de combate grátis usando só essas armas.');
porAcao(ACOES, 'escalada', (x) => `Escalation: ${x}`, (a) => `Escalada: ${a.pt}`,
  (a) => `Ganha +1 dado a cada ação ${a.de} seguida. Perde o bônus ao trocar de tipo de ação ou no fim do turno.`);
add('medico-de-campo', 'Field medic', 'Médico de campo',
  'Uma vez por turno, por 1 ação, anda até 2 zonas até um sobrevivente e cura 1 ferimento de alguém ali.');
add('recarga-gratis', 'Free reload', 'Recarga grátis', 'Armas que precisam recarregar recarregam de graça.');
add('automatico', 'Full auto', 'Automático',
  'Na ação à distância, pode usar o número de zumbis da zona alvo no lugar dos dados da arma.');
add('pistoleiro', 'Gunslinger', 'Pistoleiro', 'Todas as armas à distância contam como Dual.');
add('bate-e-corre', 'Hit & run', 'Bate e corre',
  'Logo depois de matar pelo menos 1 zumbi numa ação de ataque, faz 1 movimento grátis sem custo extra.');
add('acumulador', 'Hoard', 'Acumulador', 'Carrega até 2 cartas de equipamento a mais, que contam como mochila.');
add('tampe-o-nariz', 'Hold your nose', 'Tampe o nariz',
  'Compra 1 carta de equipamento sempre que o último zumbi da sua zona é eliminado. Não é busca.');
add('defensor-da-casa', 'Home defender', 'Defensor da casa',
  'Dentro de prédios, a linha de visão não fica limitada ao alcance 0-1.');
add('arma-improvisada-corpo', 'Improvised weapon: Melee', 'Arma improvisada: corpo a corpo',
  'Uma vez por turno, 1 ataque corpo a corpo grátis: alcance 0, 2 dados, precisão 4+, dano 1.');
add('arma-improvisada-distancia', 'Improvised weapon: Ranged', 'Arma improvisada: à distância',
  'Uma vez por turno, 1 ataque à distância grátis: alcance 1-1, 2 dados, precisão 4+, dano 1.');
add('e-so-isso', "Is That All You've Got?", 'É só isso?',
  'Ao receber ferimentos, anula 1 ferimento para cada carta de equipamento descartada do inventário.');
add('salto', 'Jump', 'Salto',
  'Uma vez por turno, por 1 ação, anda 2 zonas ignorando a do meio (paredes e portas fechadas valem).');
add('salva-vidas', 'Lifesaver', 'Salva-vidas',
  'Uma vez por turno, de graça, puxa os sobreviventes de uma zona com zumbi a alcance 1 para a sua zona.');
add('discreto', 'Low profile', 'Discreto', 'Imune a fogo amigo (regras do Molotov valem).');
add('sortudo', 'Lucky', 'Sortudo', 'Em cada ação, pode rolar de novo todos os dados mais uma vez.');
add('par-perfeito', 'Matching set', 'Par perfeito',
  'Ao achar na busca uma carta com símbolo Dual, pode pegar outra igual do baralho.');
add('medico', 'Medic', 'Médico',
  'No fim de cada rodada, de graça, ele e cada sobrevivente da zona curam 1 ferimento. Ganha 1 XP por ferimento curado.');
add('queima-roupa', 'Point-blank', 'À queima-roupa',
  'Pode atirar na própria zona, seja qual for o alcance mínimo, e escolhe os alvos. Ignora fogo amigo.');
porAcao(ACOES, 'ceifador', (x) => `Reaper: ${x}`, (a) => `Ceifador: ${a.pt}`,
  (a) => `Na ação ${a.de}, 1 acerto também elimina 1 zumbi igual na mesma zona (1 extra por ação).`);
add('regeneracao', 'Regeneration', 'Regeneração', 'No fim de cada rodada, a vida volta ao máximo.');
porAcao(ACOES, 'seis-mais-1-dano', (x) => `Roll 6: +1 Damage ${x}`, (a) => `Tirou 6: +1 de dano ${a.pt}`,
  (a) => `Na ação ${a.de}, cada 6 rolado dá +1 de dano.`);
porAcao(ACOES, 'seis-mais-1-dado', (x) => `Roll 6: +1 die ${x}`, (a) => `Tirou 6: +1 dado ${a.pt}`,
  (a) => `Na ação ${a.de}, cada 6 rolado dá mais 1 dado, enquanto sair 6.`);
add('saqueador', 'Scavenger', 'Saqueador', 'Pode buscar em qualquer zona, de prédio ou de rua.');
add('busca-2-cartas', 'Search: 2 cards', 'Busca: 2 cartas', 'Compra 2 cartas ao buscar.');
add('empurrao', 'Shove', 'Empurrão',
  'Uma vez por turno, de graça, empurra todos os zumbis da sua zona para uma zona vizinha com passagem livre.');
add('esquiva', 'Sidestep', 'Esquiva',
  'Quando zumbis surgem a alcance 0-1, faz 1 movimento grátis sem custo extra. Uma vez por carta de zumbi.');
add('escorregadio', 'Slippery', 'Escorregadio',
  'Não paga ação extra para sair de zona com zumbis e ignora zumbis ao se mover.');
add('atirador-de-elite', 'Sniper', 'Atirador de elite', 'Escolhe os alvos nas ações à distância. Ignora fogo amigo.');
add('disparada', 'Sprint', 'Disparada',
  'Uma vez por turno, gasta 1 movimento para andar 2 ou 3 zonas. Entrar em zona com zumbis encerra.');
add('comeca-com-x-vida', 'Starts with [X] Health', 'Começa com [X] de vida',
  'Começa o jogo com a vida indicada. Não pode ser Companion.');
add('comeca-com-2-pa', 'Starts with 2 AP', 'Começa com 2 XP',
  'Começa o jogo com 2 pontos de adrenalina. Não pode ser Companion.');
add('comeca-com-equipamento', 'Starts with a [Equipment]', 'Começa com [equipamento]',
  'Começa com o equipamento indicado, recebido na preparação. Não pode ser Companion.');
add('mao-firme', 'Steady hand', 'Mão firme',
  'Ao errar uma ação à distância, pode poupar os sobreviventes que escolher (não vale para Molotov).');
add('super-forca', 'Super strength', 'Superforça', 'O dano das armas corpo a corpo conta como 3.');
add('mestre-espadachim', 'Swordmaster', 'Mestre espadachim', 'Todas as armas corpo a corpo contam como Dual.');
add('tatico', 'Tactician', 'Tático', 'Pode jogar o seu turno em qualquer momento da fase dos jogadores.');
add('provocar', 'Taunt', 'Provocar',
  'Uma vez por turno, de graça, escolhe uma zona a até 2 de distância: os zumbis ali ganham 1 ativação extra e vão atrás dele.');
add('duro', 'Tough', 'Durão',
  'Ignora o primeiro ferimento em cada fase de ataque dos zumbis e no fogo amigo.');
add('teia', 'Webbing', 'Teia', 'Todo o equipamento do inventário conta como equipado na mão.');
add('elo-zumbi', 'Zombie link', 'Elo zumbi',
  'Joga 1 turno extra sempre que sai uma carta de ativação extra (não vale Rush).');

export const HABILIDADES = h;
