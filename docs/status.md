# Lista de trabalho do workflow (fonte da verdade)

Cada leg lê só a sua seção, a seção "Contratos" e `docs/regras-2e.md`.
Status de um leg: `pendente` | `em_andamento` | `integrada` | `parado: <motivo>`.

## Contratos (todos os legs respeitam; mudar exige parar e avisar)
- **Módulos:** ES modules, sem build. O `package.json` tem `"type": "module"`. Os testes ficam em
  `tests/*.test.mjs`, rodados com `node --test tests/`.
- **`js/dados/sobreviventes.js`:** `export const SOBREVIVENTES = [{ id, nome, tipo: 'adulto'|'kid', vida,
  habilidades: { azul: [hid], amarelo: [hid], laranja: [hid, hid], vermelho: [hid, hid, hid] }, fonte: 'url',
  confirmado: bool }]`.
- **`js/dados/habilidades.js`:** `export const HABILIDADES = { [hid]: { nome: 'nome em inglês do card', pt: 'nome
  em português', desc: 'descrição curta em português', fonte } }`.
  - `hid` é kebab-case e estável. Exemplos: `mais-1-acao`, `mais-1-acao-gratis-movimento`, `sortudo` (Lucky).
- **`js/dados/equipamentos.js`:** `export const EQUIPAMENTOS = [{ id, nome, tipo: 'corpo'|'distancia'|'ambos'|'item',
  dados, precisao, dano, alcance: [min, max] | null, dual, abrePorta: 'silencioso'|'barulhento'|null, barulhento,
  epico, inicial, qtd, fonte, confirmado }]`. Os campos que não foram confirmados ficam `null`, nunca chutados.
- **`js/regras.js` (funções puras, sem DOM):**
  - `NIVEIS = [{ id: 'azul', min: 0 }, { id: 'amarelo', min: 7 }, { id: 'laranja', min: 19 }, { id: 'vermelho', min: 43 }]`
  - `nivelPorXp(xp)` devolve o id do nível.
  - `aplicarXp(ficha, delta, { ultrared })` devolve `{ ficha, niveisNovos: [id], escolhaPendente: null | { nivel,
    opcoes: [hid] } }`.
  - `habilidadesAtivas(ficha, sobrevivente)` devolve `[hid]`.
  - `acoesDoTurno(ficha, sobrevivente)` devolve `{ normais, gratis: { [tipo]: n } }`.
  - `vidaMax(ficha, sobrevivente)` devolve um número.
  - `temHoard(...)` devolve um booleano.
- **Formato da ficha:** `{ id, sobreviventeId, xp, voltas, escolhas: { laranja: [hid], vermelho: [hid] },
  ferimentos, acoesGastas: { normais, gratis: { [tipo]: n } }, inventario: { maos: [slot, slot], mochila: [slot,
  slot, slot], extra: [slot, slot] }, objetivos, ultrared }`. Cada slot é `null`, `{ equipId }` ou `{ texto }`.
- **`js/estado.js`:**
  - O armazenamento é injetado (`criarEstado(storage)`). No navegador é o `localStorage`; nos testes, um objeto
    em memória.
  - O estado tem `{ versao, partidas: [{ id, nome, fichas: [ficha], atualizadaEm }], partidaAtiva, fichaAtiva }`.
  - API: `carregar()`, `salvar()` (síncrono, a cada mudança), `novaPartida(nome)`, `abrirPartida(id)`,
    `adicionarFicha(sobreviventeId)`, `removerFicha(id)`, `alterarFicha(id, fn)` (empilha o desfazer),
    `desfazer()`, `exportarLink(fichaId)` (devolve um `#f=` com base64url), `importarLink(hash)`,
    `exportarJSON()`, `importarJSON(txt)`, `migrar(estadoAntigo)`.
  - A chave do localStorage é `zombicide-ficha:v1`.
- **`css/tema.css`:**
  - Tokens em `:root`: `--azul`, `--amarelo`, `--laranja`, `--vermelho`, `--sangue`, `--aviso`, `--fundo`,
    `--papel`, `--texto`, `--toque: 48px`.
  - Classes: `.btn`, `.btn-grande`, `.barra-perigo`, `.coracao`, `.pip`, `.slot`, `.folha` (folha de baixo),
    `.toast`, `.chip-nivel`, `.cartao`, `.retrato`.
- **`assets/icones.svg`:** sprite de `<symbol>`, usado com `<svg><use href="assets/icones.svg#i-mao"/></svg>`.
  Ids: `i-mao i-mochila i-coracao i-caveira i-dado i-bala i-porta i-barulho i-xp i-turno i-desfazer i-mesa
  i-compartilhar i-config i-objetivo i-corpo i-mira i-mais i-menos i-fechar`.
- **Gate:** `node --test tests/` passa (inclui `tests/estrutura.test.mjs`, que roda `tools/checar.mjs`).

## Leg `dados` (fase 1)
- [pendente] D1: habilidades.js com todas as habilidades da 2E. Feito quando todas as do rulebook estiverem lá, com
  descrição em português e fonte.
- [pendente] D2: sobreviventes.js com os 12 da caixa base. Feito quando cada um tiver a árvore completa e a fonte.
  Se não conseguir confirmar um sobrevivente, ele fica com `confirmado: false` e entra na lista de faltas.
- [pendente] D3: equipamentos.js com as 63 cartas (e `qtd`). Feito quando os atributos confirmados estiverem com
  fonte e os não confirmados estiverem `null`.
- [pendente] D4: `tests/dados.test.mjs`. Feito quando validar que todo `hid` usado existe, que os ids são únicos,
  que a soma de `qtd` é 63 e que as opções de laranja e vermelho têm o tamanho certo.

## Leg `nucleo` (fase 1)
- [pendente] N1: regras.js. Feito quando os testes cobrirem 6/7, 18/19, 42/43, o salto múltiplo (de 5 para 45),
  Ultrared (de 40 para 50 volta para 7 e pede escolha não repetida), vida de Kid e Hoard.
- [pendente] N2: estado.js. Feito quando os testes cobrirem salvar e recarregar com o mesmo storage, 2 fichas que
  não se misturam, desfazer, ida e volta de link e JSON, migração de uma versão sem `voltas`, e storage cheio ou
  JSON corrompido sem crash.

## Leg `visual` (fase 1)
- [pendente] V1: tema.css com os tokens e componentes, fontes locais (OFL, com licença) e fundo grunge em
  SVG/CSS. Feito quando o contraste for AA e os toques tiverem no mínimo 48px.
- [pendente] V2: icones.svg com todos os ids do contrato. Feito quando todos renderizarem em `design.html`.
- [pendente] V3: design.html, um catálogo de componentes que mostra a ficha estática completa. Feito quando abrir
  em 360px de largura sem rolagem lateral.

## Leg `ficha-ui` (fase 2; depende de dados, nucleo e visual = "integrada")
- [pendente] U1: telas Mesa/Partidas e escolha do sobrevivente. Feito quando abrir o site levar direto à última
  ficha.
- [pendente] U2: Ficha. XP +1/−1/+5, barra de perigo, seletor de nível, vida, ações e novo turno. Feito quando cada
  ação frequente levar 1 toque.
- [pendente] U3: inventário com folha de cartas, busca, texto livre e mão↔mochila em 2 toques, e Desfazer. Feito
  quando trocar de slot levar ≤2 toques.
- [pendente] U4: PWA (manifest, sw.js e ícones) mais link/QR (QR vendorizado em vendor/) e export/import JSON.
  Feito quando funcionar offline e o link restaurar a ficha.
