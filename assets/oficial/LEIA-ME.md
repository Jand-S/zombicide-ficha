# Imagens oficiais (arte da CMON)

Todas as imagens desta pasta são © CMON (Zombicide 2ª edição). Estão aqui só para uso de fã, não comercial,
nesta ficha não oficial. Não são do autor do site e não estão sob a licença do código.

**Para remover, apague esta pasta** (`assets/oficial/`). O app volta sozinho ao visual próprio (retrato de iniciais
e ícones), porque toda imagem tem fallback. Depois tire as linhas `assets/oficial/...` da lista `ARQUIVOS` do `sw.js`
(e suba a `VERSAO`) e os campos `imagem`/`card` de `js/dados/`, senão o gate acusa arquivo faltando.

Todas foram reduzidas (sips) e recomprimidas em JPEG. Baixadas em 15/11/2026.

## Fontes

Repositório de fã (jogo Unity da caixa base 2E): https://github.com/Axiileszko/zombicide
Base: `https://raw.githubusercontent.com/Axiileszko/zombicide/HEAD/Zombicide/Assets/Resources/`

### Sobreviventes (`sobreviventes/`)
- `<id>-retrato.jpg` (192x192): `Characters/<nome>_head.png` (recorte redondo do rosto; o canto foi preenchido com a
  cor do tema). Os headshots do Zombicide Wiki (static.wikia.nocookie.net/zombicide/images/.../<Nome>_headsh.png)
  responderam 403 ao curl, por isso a fonte é o repositório.
- `<id>-card.jpg` (600 de largura): `Characters/<nome>.jpg` (ID Card).

| id | nome no repositório |
|---|---|
| ostara | ostara |
| lili | lili |
| tiger-sam | tigersam |
| odin | odin |
| bunny-g | bunnyg |
| lou | lou |
| josh | josh |
| doug | doug |
| elle | elle |
| amy | amy |
| ned | ned |
| wanda | wanda |

### Cartas de equipamento (`cartas/`, 360 de largura)
Fonte: `Items/<arquivo>.png` (o canto arredondado transparente foi preenchido com a cor de fundo do tema).

| arquivo aqui | Items/ | observação |
|---|---|---|
| baseball-bat-inicial.jpg | baseballbat.png | versão inicial (fundo cinza) |
| aaahh.jpg | zombie.png | carta "AAAHH!!" em húngaro (o repositório só tem essa) |
| bag-of-rice.jpg | rice.png | título "RICE" |
| canned-food.jpg | cannedfood.png | |
| chainsaw.jpg | chainsaw.png | |
| crowbar.jpg | crowbar.png | usada também pela Crowbar inicial |
| fire-axe.jpg | axe.png | título "AXE"; usada também pelo Fire Axe inicial |
| flashlight.jpg | flashlight.png | |
| katana.jpg | katana.png | |
| kukri.jpg | kukri.png | |
| machete.jpg | machete.png | |
| molotov.jpg | molotov.png | |
| pistol.jpg | pistol.png | usada também pela Pistol inicial |
| plenty-of-bullets.jpg | plentyofbullets.png | |
| plenty-of-shells.jpg | plentyofshells.png | |
| sawed-off.jpg | sawedoff.png | |
| shotgun.jpg | shotgun.png | |
| sniper-rifle.jpg | sniperrifle.png | |
| sub-mg.jpg | submg.png | |
| water.jpg | water.png | |
| army-sniper-rifle.jpg | militarysniperrifle.png | título "MILITARY SNIPER RIFLE" |
| automatic-shotgun.jpg | autshotgun.png | |
| evil-twins.jpg | eviltwins.png | |
| golden-ak-47.jpg | goldenak47.png | |
| golden-kukri.jpg | goldenkukri.png | |
| gunblade.jpg | gunblade.png | |
| mas-shotgun.jpg | masshotgun.png | |
| nailbat.jpg | nailbat.png | |
| zantetsuken.jpg | zantetsuken.png | |

Sem imagem (o repositório não tem): Aaahh! épico (`aaahh-epico`) e a carta de referência do Car (`car-referencia`).
