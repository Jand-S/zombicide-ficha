# O que a ficha precisa ter

Pedido do dono (14/11/2026): um web app de ficha (painel de sobrevivente) para o Zombicide 2ª edição, com visual
temático, ótimo no celular e com poucos toques. As regras estão em docs/regras-2e.md e as tarefas em
docs/status.md.

## Decisões do dono (14/11/2026)
- Edição: Zombicide 2ª edição (caixa base, 12 sobreviventes).
- Só sobreviventes oficiais, com as habilidades fixas do ID Card. Não há criação de personagem.
- Várias pessoas: cada uma no próprio celular, sem servidor. No mesmo aparelho dá para ter várias fichas (tela
  Mesa), e uma ficha passa para outro celular por link ou QR.
- Itens: escolhidos de uma lista das cartas da 2E (com dados da arma), com texto livre para expansões.
- Visual próprio em SVG/CSS. Em 15/11/2026 o dono decidiu usar as imagens oficiais (retratos, ID Cards e cartas), sabendo do risco de
  direito autoral. Elas ficam só em assets/oficial/ (com LEIA-ME e fontes). Apagar essa pasta faz o app voltar aos ícones próprios.
  No rodapé: "ficha de fã, não oficial · imagens © CMON".

## Campos
- Sobrevivente (nome, retrato SVG genérico, adulto ou Kid).
- Barra de perigo com XP e nível atual (azul, amarelo, laranja, vermelho). Ultrared é opcional.
- Habilidades por nível. Ao chegar ao laranja ou ao vermelho, a ficha pede a escolha.
- Vida (3 para adulto, 2 para Kid), com ferir e curar.
- Ações do turno (normais e grátis por tipo), com "novo turno".
- Inventário: 2 mãos, 3 de mochila e +2 com Hoard. Contador de objetivos.

## Comportamento
- Salva sozinha a cada mudança (localStorage). Ao reabrir, volta para a ficha onde parou.
- Partidas com nome, para pausar uma e abrir outra. Exportar e importar backup.
- Desfazer em vez de pedir confirmação.
- Funciona offline (PWA) e dá para instalar na tela inicial.
- Toques de no mínimo 48px, funciona a partir de 360px de largura, uso com uma mão.
