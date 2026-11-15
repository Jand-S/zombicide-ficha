# Próximos passos

## Onde paramos
- 15/11/2026: app completo e publicado no GitHub Pages. Workflow com 4 legs (dados, nucleo, visual, ficha-ui), auditoria e uma rodada de correções. Gate: 102 testes.
- Tem: Ficha, Mesa e Partidas; XP, níveis e Ultrared; vida, ações e inventário 2+3+Hoard; Desfazer; PWA offline; link/QR; backup JSON; várias abas sem se sobrescrever.

## Próximo (por prioridade)
1. Dados com o dono: quais dos 12 são Kids (só a Bunny G está confirmada) e fotos das cartas de arma para preencher dados, precisão, dano e alcance (js/dados/*). Também identificar a 63ª carta.
2. Testar num celular de verdade (iPhone e Android), instalar na tela inicial e jogar uma partida.
3. Menores da revisão: o foco não volta ao fechar a folha; ligar o Ultrared com XP >= 43 só dá a volta no próximo XP; o toast corta texto longo; Bunny G tem confirmado:true mas a árvore vem da mesma fonte que os outros.

## Pendências e riscos
- iOS anterior ao 15.4 não tem structuredClone nem Array.at, então os toques que mudam a ficha dão erro.
- Safari sem instalar na tela inicial pode apagar o localStorage depois de 7 dias sem uso. Instalar como app evita isso.
- sw.js: subir VERSAO a cada deploy. A versão nova só aparece na 2ª abertura.
- Repositório público: nada privado. Nada de arte ou logo da CMON.
