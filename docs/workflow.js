export const meta = {
  name: 'zombicide-ficha',
  description: 'Ficha Zombicide 2E: legs dados/nucleo/visual em paralelo, integra, leg ficha-ui, integra e audita',
  phases: [
    { title: 'Fase 1', detail: 'legs dados, nucleo e visual em paralelo' },
    { title: 'Integrar 1', detail: 'merge, gate e push (sonnet)' },
    { title: 'Fase 2', detail: 'leg ficha-ui' },
    { title: 'Integrar 2', detail: 'merge, gate e push (sonnet)' },
    { title: 'Auditoria', detail: 'auditor cego + verificador' },
  ],
}

// ---------- configuração ----------
const REPO = '/Users/jandson/Documents/zombicide-ficha'
const WT = '/Users/jandson/Documents/zombicide-ficha-wt'
const NOTES = REPO + '/notes'
const A = args || {}
const MANUAL = new Set(A.manual || []) // legs já integrados à mão: pulam direto para "integrada"
const CAP = 6 // teto de agentes por leg

const PREAMBULO = `Projeto: web app estático (HTML, CSS e JS ES modules, sem build) com a ficha de sobrevivente do Zombicide 2ª edição, publicado no GitHub Pages. Repositório principal: ${REPO} (branch main). Worktrees dos legs: ${WT}/<leg>. Notas do leg: ${NOTES}/<leg>.md (fora do git).
Regras:
1. Uma tarefa pequena; ao terminar, devolva o resultado e pare. Nada de sleep, polling ou laço de espera.
2. Leia arquivos grandes em trechos; logs só com tail ou grep.
3. Leia só ${REPO}/docs/status.md (a seção do seu leg e a seção "Contratos") e ${REPO}/docs/regras-2e.md. Não mude os contratos: se precisar, pare e explique.
4. Git: trabalhe só no worktree do seu leg e na branch leg/<leg>. Use git add com caminhos explícitos. Nunca use --force nem reset --hard, nunca faça push e nunca mexa na main. Termine cada mensagem de commit com a linha "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>".
5. Gate: \`node --test tests/\` precisa passar no worktree. Toda mudança de lógica vem com um teste que falharia sem ela. Nunca enfraqueça um teste.
6. Não invente dados do jogo: o que não tiver fonte fica null ou confirmado:false.
7. Nada de arte ou logo da CMON. Nada privado (o repositório é público). Sem chaves e sem segredos.
8. Escreva em ${NOTES}/<leg>.md o que fez, o que falta e o número de agentes já usados, para um agente novo continuar de onde você parou. Antes de começar, leia esse arquivo se ele existir.`

const SEVERIDADE = `Barra de severidade. Bloqueia só isto, e nada mais:
- falso sucesso;
- crash ou exceção não tratada;
- comportamento diferente da especificação (docs/status.md, docs/regras-2e.md);
- perda de determinismo;
- "feito quando" não cumprido;
- regra de segurança ou de git quebrada.
Todo o resto é menor e vai para a lista de menores. Todo item bloqueante precisa de arquivo:linha e de um jeito de reproduzir (comando ou passos).`

const LEGS = {
  dados: {
    fase: 1, deps: [], tarefas: 'D1 a D4',
    foco: `Dados do jogo em js/dados/habilidades.js, js/dados/sobreviventes.js e js/dados/equipamentos.js, mais tests/dados.test.mjs.
É uma tarefa de investigação: registre cada fonte consultada em ${NOTES}/dados-fontes.md (URL, o que achou, confirmado ou não). Um agente novo lê esse arquivo primeiro e continua de onde parou.
Fontes:
- a árvore de cada sobrevivente está nos ID Cards: zombicide.fandom.com/wiki/<Nome>, boardgamegeek.com/filepage/220983 e o thread 3520041 do BGG;
- os atributos das armas estão nos cards;
- as habilidades estão em https://rulespal.com/zombicide-2nd-edition/rulebook.
Use WebFetch ou WebSearch. Se elas bloquearem (403/402), carregue as ferramentas mcp__claude-in-chrome__* via ToolSearch e leia pelo navegador, numa aba nova. Limite: ~25 consultas; ao chegar nele, pare e liste as faltas.
Escreva descrições curtas em português. Guarde o nome em inglês no campo nome. Sobrevivente ou arma sem fonte que confirme: confirmado:false e campos null.`,
  },
  nucleo: {
    fase: 1, deps: [], tarefas: 'N1 e N2',
    foco: `js/regras.js (funções puras) e js/estado.js (storage injetado), com tests/regras.test.mjs e tests/estado.test.mjs. Siga à risca as assinaturas da seção Contratos.
Nos testes, use sobreviventes de mentira, porque js/dados ainda não existe.
O estado precisa sobreviver a JSON corrompido e a storage cheio (QuotaExceededError) sem crash. O desfazer guarda no máximo 30 passos.
O link usa base64url de JSON compacto e precisa caber em um QR (o alvo é <1500 caracteres).`,
  },
  visual: {
    fase: 1, deps: [], tarefas: 'V1 a V3',
    foco: `Design system com tema Zombicide em css/tema.css, assets/icones.svg, assets/fontes/ (woff2 locais, OFL, com o arquivo de licença; baixe do Google Fonts / fontsource, ex.: Bebas Neue para títulos e Oswald ou Barlow Condensed para texto) e design.html.
Direção de arte:
- fundo escuro com textura grunge feita em SVG/CSS (concreto, arranhões, respingos de sangue discretos);
- destaques em vermelho-sangue e amarelo de aviso, faixas de fita zebrada;
- as 4 cores de perigo vivas (azul, amarelo, laranja, vermelho);
- cartões com cara de "painel" de jogo de tabuleiro, com cantos chanfrados;
- ícones SVG próprios, traço grosso, legíveis a 24px.
Precisa ficar bonito de verdade. Para o celular: toques ≥48px, contraste AA, prefers-reduced-motion respeitado, safe-area do iPhone.
design.html mostra todos os componentes e uma ficha estática completa (barra de perigo, corações, pips de ação, 5 slots, folha de baixo, toast, chips de nível).
Se as ferramentas mcp__claude-in-chrome__* estiverem disponíveis (carregue via ToolSearch), abra o design.html (python3 -m http.server num terminal em background, numa porta livre) com a janela em 360x800 e confira. Feche o servidor ao terminar.`,
  },
  'ficha-ui': {
    fase: 2, deps: ['dados', 'nucleo', 'visual'], tarefas: 'U1 a U4',
    foco: `index.html, css/app.css e js/ui/*.js, ligando js/dados, js/regras.js, js/estado.js, css/tema.css e assets/icones.svg (já estão na main; não reescreva esses módulos: se faltar algo, adicione uma função pequena com teste).
UX:
- tela principal para uma mão só, com topo fixo (nome, nível e barra de perigo);
- XP +1/−1/+5;
- corações: tocar fere, segurar cura;
- pips de ação: tocar gasta, e "novo turno" zera;
- ao subir para laranja ou vermelho, abre o seletor de escolha;
- inventário 2+3 (+2 com Hoard). A folha de baixo de cartas tem busca, atributos e texto livre; mão↔mochila em 2 toques;
- Desfazer por 5 s em toda mudança, vibração leve, Wake Lock opcional;
- telas Mesa (várias fichas, troca em 1 toque) e Partidas (pausar e retomar);
- sobrevivente com confirmado:false mostra o selo "habilidades a conferir".
Persistência: salvar a cada mudança e em visibilitychange/pagehide; ao abrir, volta à última ficha; pede navigator.storage.persist().
PWA: manifest.webmanifest, sw.js com const ARQUIVOS = [...] cobrindo tudo (o gate confere) e ícones do app em SVG/PNG próprios.
Link/QR: exportarLink e importarLink, com o QR de uma lib MIT baixada de cdnjs para vendor/ (versão fixa). Export/import JSON.
Rodapé: "ficha de fã, não oficial".
Use caminhos relativos (o Pages serve em /zombicide-ficha/). Se as ferramentas mcp__claude-in-chrome__* estiverem disponíveis, teste em 360x800 com python3 -m http.server em background numa porta livre, e feche ao terminar.`,
  },
}

// ---------- schemas ----------
const IMPL = {
  type: 'object',
  properties: {
    ok: { type: 'boolean', description: 'true só se o "feito quando" das tarefas foi cumprido e o gate passa' },
    commits: { type: 'array', items: { type: 'string' } },
    gate: { type: 'string', description: 'últimas linhas de node --test tests/' },
    resumo: { type: 'string' },
    faltas: { type: 'array', items: { type: 'string' }, description: 'o que ficou sem fonte ou sem fazer' },
  },
  required: ['ok', 'commits', 'gate', 'resumo', 'faltas'],
}
const REVIEW = {
  type: 'object',
  properties: {
    bloqueantes: {
      type: 'array',
      items: {
        type: 'object',
        properties: { arquivo: { type: 'string' }, linha: { type: 'number' }, problema: { type: 'string' }, reproduzir: { type: 'string' } },
        required: ['arquivo', 'linha', 'problema', 'reproduzir'],
      },
    },
    menores: { type: 'array', items: { type: 'string' } },
  },
  required: ['bloqueantes', 'menores'],
}
const INTEG = {
  type: 'object',
  properties: {
    integradas: { type: 'array', items: { type: 'string' } },
    revertidas: { type: 'array', items: { type: 'object', properties: { leg: { type: 'string' }, motivo: { type: 'string' } }, required: ['leg', 'motivo'] } },
    push: { type: 'boolean' },
    gate: { type: 'string' },
  },
  required: ['integradas', 'revertidas', 'push', 'gate'],
}
const AUDIT = {
  type: 'object',
  properties: {
    quebras: {
      type: 'array',
      items: {
        type: 'object',
        properties: { garantia: { type: 'string' }, arquivo: { type: 'string' }, linha: { type: 'number' }, repro: { type: 'string' } },
        required: ['garantia', 'arquivo', 'linha', 'repro'],
      },
    },
    riscos: { type: 'array', items: { type: 'string' } },
  },
  required: ['quebras', 'riscos'],
}
const VERIF = {
  type: 'object',
  properties: {
    confirmadas: { type: 'array', items: { type: 'object', properties: { garantia: { type: 'string' }, evidencia: { type: 'string' } }, required: ['garantia', 'evidencia'] } },
    refutadas: { type: 'array', items: { type: 'object', properties: { garantia: { type: 'string' }, motivo: { type: 'string' } }, required: ['garantia', 'motivo'] } },
  },
  required: ['confirmadas', 'refutadas'],
}

// ---------- prompts ----------
const wt = (leg) => `${WT}/${leg}`
const setup = (leg) => `Worktree: ${wt(leg)} na branch leg/${leg}. Se ele não existir, crie com \`git -C ${REPO} worktree add ${wt(leg)} -b leg/${leg} main\` (se a branch já existir, use o mesmo comando sem "-b"). Se ele já existir, rode git log e leia ${NOTES}/${leg}.md, e continue de onde parou. Se a main avançou, rode \`git merge main\`.`

const pImpl = (leg, tarefas, extra) => `${PREAMBULO}

Leg: ${leg}. Tarefas: ${tarefas} (a seção "Leg \`${leg}\`" de docs/status.md).
${setup(leg)}

${LEGS[leg].foco}
${extra || ''}
Commite no worktree ao terminar cada tarefa. Atualize o status das suas linhas apenas em ${NOTES}/${leg}.md; não edite docs/status.md.
Devolva ok=true somente se o "feito quando" de cada tarefa foi cumprido e o gate passa. Se faltar fonte de dados, não é falha: liste em faltas.`

const pReview = (leg, anterior) => `${PREAMBULO}

Você é o revisor do leg ${leg}. Não edite arquivos e não commite.
Revise o diff: \`git -C ${wt(leg)} diff main...leg/${leg} --stat\`, e depois os arquivos em trechos. Rode \`node --test tests/\` no worktree.
Compare com as tarefas ${LEGS[leg].tarefas} (o "feito quando" de cada uma) e com a seção Contratos de ${REPO}/docs/status.md.
${anterior ? `Esta é uma nova revisão depois de uma correção. Os bloqueantes anteriores foram:\n${JSON.stringify(anterior, null, 1)}\nConfira se foram resolvidos e se a correção não quebrou outra coisa.` : ''}

${SEVERIDADE}`

const pFix = (leg, bloq) => `${PREAMBULO}

Leg: ${leg}. Corrija APENAS estes bloqueantes apontados pela revisão, no worktree ${wt(leg)} (branch leg/${leg}). Cada correção vem com um teste que falharia sem ela, quando for lógica:
${JSON.stringify(bloq, null, 1)}
Commite e devolva ok=true somente se todos foram resolvidos e o gate passa.`

const pInteg = (legs) => `Integrador do projeto ${REPO} (Zombicide ficha, GitHub Pages). Faça uma tarefa só e pare, sem sleep nem polling; logs só com tail ou grep.
Para cada branch, na ordem: ${legs.map((l) => 'leg/' + l).join(', ')}.
1. Em ${REPO}, na main (git status precisa estar limpo; se não estiver, pare e reporte), rode \`git merge --no-ff leg/<leg> -m "Integra leg <leg>"\` (termine a mensagem com a linha "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"). Se houver conflito, rode \`git merge --abort\` e marque como revertida, com o motivo.
2. Gate: \`node --test tests/\` (tail -20). Se falhar por defeito do leg, rode \`git revert -m 1 HEAD --no-edit\` e marque como revertida, com o motivo e a saída.
Depois de todas as branches:
- se houve pelo menos uma integrada e o remoto é git@github.com:Jand-S/zombicide-ficha.git (confira com git remote -v), rode \`git push origin main\`. Nunca use --force;
- remova o worktree de cada leg integrado: \`git -C ${REPO} worktree remove ${WT}/<leg>\` (sem --force; se falhar, apenas reporte).
Devolva o resultado.`

// ---------- execução ----------
const status = {}
for (const l of Object.keys(LEGS)) status[l] = MANUAL.has(l) ? 'integrada' : 'pendente'
const relatorio = { legs: {}, auditoria: null }

if (A.dry) {
  return {
    dry: true,
    legs: Object.entries(LEGS).map(([nome, l]) => ({ nome, fase: l.fase, deps: l.deps, status: status[nome] })),
    fluxo: 'Fase 1 (dados|nucleo|visual em paralelo: implementar → revisar → [corrigir → revisar]) → Integrar 1 → Fase 2 (ficha-ui: implementar U1-U2 → implementar U3-U4 → revisar → [corrigir → revisar]) → Integrar 2 → Auditoria (auditor → verificador)',
    agentesEstimados: { min: 12, max: 20 },
  }
}

async function rodarLeg(leg, fase) {
  let usados = 0
  const spawn = async (prompt, opts) => {
    if (usados >= CAP) throw new Error(`teto de ${CAP} agentes`)
    usados++
    return agent(prompt, { phase: fase, ...opts })
  }
  try {
    const partes = leg === 'ficha-ui' ? [['U1 e U2', 'Faça só U1 e U2 agora; U3 e U4 ficam para o próximo agente.'], ['U3 e U4', 'U1 e U2 já estão commitados; faça U3 e U4.']] : [[LEGS[leg].tarefas, '']]
    let impl = null
    for (const [t, extra] of partes) {
      impl = await spawn(pImpl(leg, t, extra), { label: `${leg}:implementar ${t}`, schema: IMPL, effort: 'high' })
      if (!impl || !impl.ok) return { leg, status: `parado: implementação não concluída (${t})`, impl, usados }
    }
    let rev = await spawn(pReview(leg), { label: `${leg}:revisar`, schema: REVIEW, effort: 'high' })
    if (!rev) return { leg, status: 'parado: revisão falhou', impl, usados }
    if (rev.bloqueantes.length) {
      const anterior = rev.bloqueantes
      const fix = await spawn(pFix(leg, anterior), { label: `${leg}:corrigir`, schema: IMPL, effort: 'high' })
      rev = await spawn(pReview(leg, anterior), { label: `${leg}:re-revisar`, schema: REVIEW, effort: 'high' })
      if (!fix || !rev || rev.bloqueantes.length) return { leg, status: 'parado: bloqueantes após correção', impl, rev, usados }
    }
    return { leg, status: 'pronta', impl, menores: rev.menores, faltas: impl.faltas, usados }
  } catch (e) {
    return { leg, status: `parado: ${e.message}`, usados }
  }
}

async function integrar(legs, fase) {
  if (!legs.length) return
  const r = await agent(pInteg(legs), { label: `integrar:${legs.join(',')}`, phase: fase, schema: INTEG, model: 'sonnet', effort: 'low' })
  if (!r) { for (const l of legs) status[l] = 'parado: integrador falhou'; return }
  for (const l of r.integradas) if (legs.includes(l)) status[l] = 'integrada'
  for (const x of r.revertidas) if (legs.includes(x.leg)) status[x.leg] = `parado: revertida (${x.motivo})`
  relatorio[`integracao_${fase}`] = r
}

// Fase 1
phase('Fase 1')
const fase1 = Object.keys(LEGS).filter((l) => LEGS[l].fase === 1 && status[l] !== 'integrada')
const res1 = await parallel(fase1.map((l) => () => rodarLeg(l, 'Fase 1')))
for (const r of res1.filter(Boolean)) { relatorio.legs[r.leg] = r; status[r.leg] = r.status }
log(`Fase 1: ${fase1.map((l) => `${l}=${status[l]}`).join(' | ')}`)

phase('Integrar 1')
await integrar(fase1.filter((l) => status[l] === 'pronta'), 'Integrar 1')

// Fase 2 — dependência só conta com status exatamente "integrada"
const deps2 = LEGS['ficha-ui'].deps
if (status['ficha-ui'] !== 'integrada') {
  if (deps2.every((d) => status[d] === 'integrada')) {
    phase('Fase 2')
    const r = await rodarLeg('ficha-ui', 'Fase 2')
    relatorio.legs['ficha-ui'] = r
    status['ficha-ui'] = r.status
    if (r.status === 'pronta') { phase('Integrar 2'); await integrar(['ficha-ui'], 'Integrar 2') }
  } else {
    status['ficha-ui'] = `parado: dependências não integradas (${deps2.filter((d) => status[d] !== 'integrada').join(', ')})`
  }
}

// Auditoria
if (status['ficha-ui'] === 'integrada') {
  phase('Auditoria')
  const GARANTIAS = `1. Fechar a aba e reabrir mantém todas as fichas, partidas e a ficha ativa (salva a cada mudança e em pagehide).
2. Offline: depois da primeira visita, recarregar sem rede abre o app completo (sw.js faz cache de tudo).
3. Duas fichas no mesmo aparelho não se misturam (mudar uma não altera a outra).
4. exportarLink → importarLink reproduz a ficha igual (XP, escolhas, ferimentos, inventário, objetivos).
5. XP: 6→Azul, 7→Amarelo, 18→Amarelo, 19→Laranja, 42→Laranja, 43→Vermelho. Um salto de vários níveis pede todas as escolhas. Com o Ultrared, a volta soma o excedente.
6. Vida: adulto 3, Kid 2, chegar a 0 = eliminado, curar não passa do máximo.
7. Inventário 2 mãos + 3 mochila e +2 só com Hoard. Mão↔mochila em ≤2 toques.
8. Ações frequentes (XP±, ferir, gastar ação, novo turno) em 1 toque, com Desfazer.
9. Storage corrompido ou cheio não derruba o app.
10. Funciona em /zombicide-ficha/ (caminhos relativos) e cabe em 360px sem rolagem lateral.
11. Nenhum dado do jogo inventado: o que não tem fonte aparece como "a conferir".`
  const NAO_FEITO = 'Ainda não existe: sincronização entre celulares em tempo real (fora do escopo), sobreviventes de expansões, criação de personagem.'
  const aud = await agent(`Você é um auditor cego do web app em ${REPO} (branch main; use git pull se precisar, sem editar nada). Sua missão é REFUTAR as garantias abaixo: procure onde cada uma quebra. Leia o código em trechos e rode \`node --test tests/\`. Você pode rodar scripts node descartáveis no scratchpad para provar uma quebra. Nada de sleep ou polling.
Garantias:
${GARANTIAS}
${NAO_FEITO}
Uma quebra só conta com uma repro executável (comando node, ou passos exatos no navegador citando arquivo:linha). Sem repro, vai para riscos.`, { label: 'auditor', phase: 'Auditoria', schema: AUDIT, effort: 'xhigh' })
  relatorio.auditoria = aud
  if (aud && aud.quebras.length) {
    relatorio.verificacao = await agent(`Verificador. Em ${REPO} (sem editar o repositório; use o scratchpad), rode cada repro abaixo e diga se a quebra se confirma (com a saída) ou se é refutada (com o motivo). Nada de sleep ou polling; logs só com tail ou grep.
${JSON.stringify(aud.quebras, null, 1)}`, { label: 'verificador', phase: 'Auditoria', schema: VERIF, effort: 'high' })
  }
}

return { status, relatorio }
