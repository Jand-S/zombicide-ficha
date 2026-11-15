# Ficha de sobrevivente do Zombicide 2ª edição

Web app (PWA) com a ficha interativa do sobrevivente do Zombicide 2E, feito para celular.
Publicado no GitHub Pages (repositório Jand-S/zombicide-ficha, branch main, raiz).

## Regras
- Responder em português (Brasil).
- Uma tarefa por sessão. Ao terminar, atualizar NEXT-STEPS.md e commitar (gate, add, commit e push encadeados com &&).
- Site estático: HTML, CSS e JS (ES modules) simples, sem build. Gate: `node --test tests/`. O index.html da raiz é a página publicada.
- Funcionar no celular e offline. Salvar no navegador (localStorage).

## Índice
- docs/ficha.md: decisões do dono e o que a ficha precisa ter.
- docs/regras-2e.md: regras da 2E usadas pela ficha (XP, níveis, vida, inventário), com fonte.
- docs/status.md: lista de trabalho do workflow por leg e contratos entre módulos.
- docs/workflow.js: cópia do script do workflow multiagente.
- tools/checar.mjs: gate estrutural (referências e cache do sw.js).
- NEXT-STEPS.md: onde paramos, próximos passos e pendências.
