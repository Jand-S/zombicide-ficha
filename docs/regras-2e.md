# Regras do Zombicide 2ª edição usadas pela ficha

Fonte principal: transcrição do rulebook 2E em https://rulespal.com/zombicide-2nd-edition/rulebook ,
conferida com uma cópia do PDF oficial. Pesquisa feita em 14/11/2026. Os itens marcados como "a confirmar" ficam
com o leg `dados`.

## Barra de perigo (Adrenalina / XP)
- Azul a partir de 0, Amarelo a partir de 7, Laranja a partir de 19, Vermelho a partir de 43.
- Pontos: 1 por zumbi comum e Brute, 5 por Abominação, 5 por objetivo.
  - A confirmar: os valores de Walker, Runner e Fatty.
- O nível só sobe. A ficha deixa corrigir o XP com −1, mas as escolhas já feitas continuam guardadas.

## Ultrared (regra opcional, liga e desliga na ficha)
- Ao chegar no Vermelho, o marcador volta a 0 e os pontos que passaram de 43 são somados.
- O sobrevivente continua no Vermelho e mantém todas as habilidades.
- Nas voltas seguintes, ao passar de novo por 19 e 43, escolhe uma opção de Laranja/Vermelho que ainda não pegou.
  Quando todas já foram escolhidas, escolhe qualquer habilidade da lista geral.

## Ações e habilidades
- 3 ações por turno, mais a habilidade Azul (que às vezes é uma ação grátis).
- Amarelo: em geral +1 Action (4 ações).
- Laranja: escolher 1 de 2 opções. Vermelho: escolher 1 de 3 opções.
- As habilidades se acumulam. As ações grátis de um tipo ("+1 free Move Action") contam à parte das ações
  normais.

## Vida
- Adulto ("Classic") tem 3 de vida e criança ("Kid") tem 2.
- Cada ferimento tira 1 na Wound Bar do painel (a 2E não tem carta de ferimento). Chegar a 0 elimina o
  sobrevivente.
- Medic cura 1, Regeneration cura tudo no End Phase, e a vida nunca passa da inicial. A habilidade
  "Starts with X Health" muda a vida inicial.
- Kids usam Slippery 1 vez por turno, em uma ação de movimento.

## Inventário
- 2 slots de mão e 3 de mochila. Não há slot de corpo na 2E base.
- Hoard dá +2 cartas, que contam como mochila.
- Carta na mochila não pode ser usada, salvo se a carta disser o contrário.
- Descartar é grátis, a qualquer momento.
- Reorganizar/Trocar é uma ação: a troca é com 1 sobrevivente na mesma zona e não precisa ser equilibrada.

## Outros marcadores do painel
- Tokens de objetivo ficam no painel e não ocupam slot (cada um vale 5 XP).
- Companions não têm inventário; o ID Card fica junto do líder.

## Caixa base
- 12 sobreviventes (6 adultos e 6 Kids): Ostara, Lili, Tiger Sam, Odin, Bunny G, Lou, Josh, Doug, Elle, Amy,
  Ned, Wanda.
- Kids (vida 2): Ostara, Lili, Tiger Sam, Odin, Bunny G e Lou. Adultos (vida 3): Josh, Doug, Elle, Amy, Ned e Wanda. Lido nos ID Cards.
- Equipamentos, 63 cartas: as 62 abaixo e a carta de referência do Car (`car-referencia`).
  - Iniciais: Baseball Bat, Crowbar, Fire Axe, Pistol ×3.
  - Pilha: Aaahh!! ×4, Bag of Rice ×2, Canned Food ×2, Chainsaw ×2, Crowbar, Fire Axe, Flashlight ×2,
    Katana ×2, Kukri ×2, Machete ×4, Molotov ×4, Pistol, Plenty of Bullets ×3, Plenty of Shells ×3,
    Sawed-Off ×4, Shotgun ×2, Sniper Rifle ×2, Sub-MG ×2, Water ×2.
  - Epic: Aaahh! ×2, Army Sniper Rifle, Automatic Shotgun, Evil Twins, Golden AK-47, Golden Kukri, Gunblade,
    Ma's Shotgun, Nailbat, Zantetsuken.
- Árvores e atributos das armas foram lidos nos ID Cards e nas imagens das cartas (fontes em js/dados). Continua sem fonte só o Aaahh! épico.
