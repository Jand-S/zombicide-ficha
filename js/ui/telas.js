// Telas do app como HTML (strings). Sem acesso ao DOM: o app.js põe na página e trata os toques.
// Cada botão leva data-acao="..." (e dados extras), tratado por delegação em app.js.
import { esc, icone, barraPerigo, NOME_NIVEL, NOME_ACAO } from './dom.js';
import { resumo, iniciais } from './logica.js';

const TIPO = { adulto: 'Adulto', kid: 'Kid' };

function nomeHab(hid, habilidades) {
  return habilidades?.[hid]?.pt ?? hid;
}

function selo(conferir) {
  return conferir
    ? `<span class="selo" title="A árvore de habilidades veio de uma fonte não oficial e ainda não foi conferida no ID Card.">${icone('i-config', 'icone--p')}habilidades a conferir</span>`
    : '';
}

function retrato(sob, nivel, classe = '') {
  return `<div class="retrato${classe ? ' ' + classe : ''}" data-nivel="${nivel}" aria-hidden="true"><span>${esc(iniciais(sob?.nome))}</span></div>`;
}

function topoSimples(titulo, { voltar, direita = '' } = {}) {
  const esq = voltar
    ? `<button class="btn btn-icone btn-fantasma" type="button" data-acao="ir" data-tela="${voltar.tela}" aria-label="${esc(voltar.rotulo)}">${icone(voltar.icone ?? 'i-mesa')}</button>`
    : '';
  return `<header class="topo">${esq}<h1 class="topo__titulo">${titulo}</h1>${direita}</header>`;
}

// ---------- Ficha ----------

export function telaFicha({ ficha, sobrevivente, habilidades, fichasDaMesa = [], sobreviventes = {} }) {
  const r = resumo(ficha, sobrevivente, habilidades);
  const nome = esc(sobrevivente?.nome ?? ficha.sobreviventeId);

  const abas = fichasDaMesa.length > 1
    ? `<nav class="abas-fichas" aria-label="Fichas da mesa">${fichasDaMesa.map((f) => {
      const s = sobreviventes[f.sobreviventeId];
      const atual = f.id === ficha.id;
      return `<button class="aba-ficha${atual ? ' aba-ficha--atual' : ''}" type="button" data-acao="abrir-ficha" data-id="${esc(f.id)}"
        ${atual ? 'aria-current="true"' : ''} aria-label="Abrir ${esc(s?.nome ?? f.sobreviventeId)}">${retrato(s, resumo(f, s).nivel, 'retrato--mini')}<span>${esc(s?.nome ?? f.sobreviventeId)}</span></button>`;
    }).join('')}</nav>`
    : '';

  const coracoes = Array.from({ length: r.vidaMax }, (_, i) => {
    const ferido = i >= r.vida;
    return `<button class="coracao${ferido ? ' coracao--ferido' : ''}" type="button" data-acao="coracao"
      aria-label="Vida ${i + 1} de ${r.vidaMax}: ${ferido ? 'ferida' : 'cheia'}. Toque para ferir, segure para curar.">${icone('i-coracao')}</button>`;
  }).join('');

  const pipsNormais = Array.from({ length: r.acoes.normais }, (_, i) => {
    const gasta = i < r.acoes.gastas;
    return `<button class="pip${gasta ? ' pip--gasta' : ''}" type="button" data-acao="pip" data-gasta="${gasta ? 1 : 0}"
      aria-label="Ação ${i + 1}: ${gasta ? 'gasta (toque para devolver)' : 'disponível'}"></button>`;
  }).join('');

  const pipsGratis = r.acoes.gratis.map((g) => {
    const pips = Array.from({ length: g.total }, (_, i) => {
      const gasta = i < g.gastas;
      return `<button class="pip pip--gratis${gasta ? ' pip--gasta' : ''}" type="button" data-acao="pip" data-tipo="${esc(g.tipo)}"
        data-gasta="${gasta ? 1 : 0}" aria-label="Ação grátis de ${esc(NOME_ACAO[g.tipo] ?? g.tipo)}: ${gasta ? 'gasta' : 'disponível'}">${gasta ? '' : icone('i-mais')}</button>`;
    }).join('');
    return `<div class="linha linha--nowrap acoes-gratis"><span class="rotulo">Grátis: ${esc(NOME_ACAO[g.tipo] ?? g.tipo)}</span><div class="pips">${pips}</div></div>`;
  }).join('');

  const livres = r.acoes.normais - r.acoes.gastas + r.acoes.gratis.reduce((s, g) => s + g.total - g.gastas, 0);

  const linhasHab = ['azul', 'amarelo', 'laranja', 'vermelho'].map((nv) => {
    const itens = r.arvore[nv];
    if (!itens.length) return '';
    const alcancado = r.alcancados.includes(nv);
    const chips = itens.map((h) => {
      const bloqueado = !h.ativa;
      const titulo = esc(habilidades?.[h.hid]?.desc ?? '');
      return `<span class="chip-nivel${bloqueado ? ' chip-nivel--bloqueado' : ''}" data-nivel="${nv}" title="${titulo}">${h.escolhida ? icone('i-xp', 'icone--p') : ''}${esc(nomeHab(h.hid, habilidades))}</span>`;
    }).join('');
    return `<div class="hab-linha"><span class="rotulo hab-linha__nivel" data-nivel="${nv}">${NOME_NIVEL[nv]}${alcancado ? '' : ' · bloqueado'}</span><div class="linha hab-linha__chips">${chips}</div></div>`;
  }).join('');

  const pendente = r.escolhaPendente;
  const botaoEscolha = pendente
    ? `<button class="btn btn-grande" data-nivel="${pendente.nivel}" type="button" data-acao="abrir-escolha">${icone('i-xp')}Escolher habilidade ${NOME_NIVEL[pendente.nivel].toLowerCase()}</button>`
    : '';

  return `
  <header class="topo topo-ficha">
    <div class="topo-ficha__linha">
      <button class="btn btn-icone btn-fantasma" type="button" data-acao="ir" data-tela="mesa" aria-label="Mesa (todas as fichas)">${icone('i-mesa')}</button>
      <div class="topo-ficha__nome">
        <h1 class="topo__titulo">${nome}</h1>
        <span class="chip-nivel" data-nivel="${r.nivel}"><span class="chip-nivel__nivel">${NOME_NIVEL[r.nivel]}</span></span>
      </div>
      <div class="topo-ficha__xp"><span class="numero">${r.xp}</span><span class="rotulo">XP${r.voltas ? ' · UR' + r.voltas : ''}</span></div>
      <button class="btn btn-icone btn-fantasma" type="button" data-acao="abrir-config" aria-label="Opções da ficha">${icone('i-config')}</button>
    </div>
    ${barraPerigo(r)}
  </header>
  ${abas}
  <main class="pagina pilha ficha" data-nivel="${r.nivel}">
    ${r.conferir ? `<p class="aviso-conferir">${selo(true)} A árvore de ${nome} veio de uma fonte não oficial. Confira no ID Card.</p>` : ''}
    ${r.eliminado ? `<p class="aviso-eliminado" role="status">${icone('i-caveira')} Eliminado. Segure um coração para curar ou use Desfazer.</p>` : ''}

    <article class="cartao" data-nivel="${r.nivel}">
      <h2 class="cartao__titulo">${icone('i-coracao')}Vida<span class="cartao__extra">${r.vida} de ${r.vidaMax}</span></h2>
      <div class="linha linha--entre">
        <div class="vida">${coracoes}</div>
        <span class="rotulo">${esc(TIPO[sobrevivente?.tipo] ?? 'Tipo a conferir')}</span>
      </div>
      <p class="dica">Toque fere · segure cura</p>
    </article>

    <article class="cartao">
      <h2 class="cartao__titulo">${icone('i-turno')}Ações<span class="cartao__extra">${livres} livre${livres === 1 ? '' : 's'}</span></h2>
      <div class="pips">${pipsNormais}</div>
      ${pipsGratis}
      <button class="btn btn-grande btn-sangue novo-turno" type="button" data-acao="novo-turno">${icone('i-turno')}Novo turno</button>
    </article>

    <article class="cartao">
      <h2 class="cartao__titulo">${icone('i-dado')}Habilidades</h2>
      ${r.conferir ? `<p class="hab-selo">${selo(true)}</p>` : ''}
      <div class="pilha hab">${linhasHab || '<p class="texto-suave">Sem árvore de habilidades nos dados.</p>'}</div>
      ${botaoEscolha}
    </article>

    <article class="cartao">
      <div class="linha linha--entre linha--nowrap">
        <div class="linha linha--nowrap" style="gap:8px">
          ${icone('i-objetivo', 'icone--g cor-aviso')}
          <div><div class="rotulo">Objetivos</div><div class="texto-suave dica">5 XP cada</div></div>
        </div>
        <div class="contador">
          <button class="btn btn-icone" type="button" data-acao="objetivo" data-delta="-1" aria-label="Devolver objetivo (−5 XP)" ${ficha.objetivos ? '' : 'disabled'}>${icone('i-menos')}</button>
          <span class="numero">${ficha.objetivos}</span>
          <button class="btn btn-icone btn-aviso" type="button" data-acao="objetivo" data-delta="1" aria-label="Pegar objetivo (+5 XP)">${icone('i-mais')}</button>
        </div>
      </div>
    </article>
    <!-- U3: inventário (2 mãos + 3 mochila, +2 com Hoard) entra aqui -->
  </main>
  <nav class="barra-xp" aria-label="Adrenalina">
    <button class="btn btn-icone btn-grande" type="button" data-acao="xp" data-delta="-1" aria-label="Tirar 1 XP">${icone('i-menos')}</button>
    <button class="btn btn-grande btn-aviso cresce" type="button" data-acao="xp" data-delta="1">${icone('i-mais')}1 XP</button>
    <button class="btn btn-grande btn-sangue cresce" type="button" data-acao="xp" data-delta="5">${icone('i-mais')}5 XP</button>
  </nav>`;
}

// ---------- Mesa (fichas da partida ativa) ----------

export function telaMesa({ partida, sobreviventes, fichaAtiva }) {
  const cards = partida.fichas.map((f) => {
    const s = sobreviventes[f.sobreviventeId];
    const r = resumo(f, s);
    const atual = f.id === fichaAtiva;
    return `<button class="cartao cartao-ficha${atual ? ' cartao-ficha--atual' : ''}" data-nivel="${r.nivel}" type="button" data-acao="abrir-ficha" data-id="${esc(f.id)}">
      ${retrato(s, r.nivel)}
      <span class="cartao-ficha__corpo">
        <span class="cartao-ficha__nome">${esc(s?.nome ?? f.sobreviventeId)}</span>
        <span class="linha" style="gap:6px">
          <span class="chip-nivel" data-nivel="${r.nivel}"><span class="chip-nivel__nivel">${NOME_NIVEL[r.nivel]}</span></span>
          ${r.conferir ? selo(true) : ''}
        </span>
      </span>
      <span class="cartao-ficha__dados">
        <span>${icone('i-coracao', 'icone--p')}${r.vida}/${r.vidaMax}</span>
        <span>${icone('i-xp', 'icone--p')}${r.xp}</span>
      </span>
    </button>`;
  }).join('');

  return `
  ${topoSimples(esc(partida.nome), {
    voltar: { tela: 'partidas', rotulo: 'Partidas', icone: 'i-turno' },
  })}
  <main class="pagina pilha">
    <p class="rotulo">Mesa · ${partida.fichas.length} ficha${partida.fichas.length === 1 ? '' : 's'}</p>
    ${cards || '<p class="texto-suave">Nenhuma ficha ainda. Escolha um sobrevivente.</p>'}
    <button class="btn btn-grande btn-aviso" type="button" data-acao="ir" data-tela="escolher">${icone('i-mais')}Sobrevivente</button>
    <button class="btn btn-fantasma" type="button" data-acao="ir" data-tela="partidas">${icone('i-turno')}Pausar partida</button>
  </main>`;
}

// ---------- Partidas ----------

function quando(ms) {
  try {
    return new Date(ms).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function telaPartidas({ partidas, partidaAtiva }) {
  const lista = [...partidas].sort((a, b) => b.atualizadaEm - a.atualizadaEm).map((p) => {
    const ativa = p.id === partidaAtiva;
    return `<button class="cartao cartao-partida${ativa ? ' cartao-partida--ativa' : ''}" type="button" data-acao="retomar" data-id="${esc(p.id)}">
      <span class="cartao-partida__nome">${esc(p.nome)}</span>
      <span class="texto-suave">${p.fichas.length} ficha${p.fichas.length === 1 ? '' : 's'} · ${esc(quando(p.atualizadaEm))}</span>
      <span class="rotulo">${ativa ? 'Em jogo · retomar' : 'Pausada · retomar'}</span>
    </button>`;
  }).join('');
  const voltar = partidaAtiva ? { tela: 'mesa', rotulo: 'Voltar para a mesa', icone: 'i-mesa' } : null;
  return `
  ${topoSimples('Partidas', voltar ? { voltar } : {})}
  <main class="pagina pilha">
    <form class="cartao pilha" data-form="nova-partida">
      <label class="rotulo" for="nome-partida">Nova partida</label>
      <div class="linha linha--nowrap">
        <input class="campo cresce" id="nome-partida" name="nome" maxlength="40" placeholder="Ex.: Noite de sexta" autocomplete="off">
        <button class="btn btn-aviso" type="submit">${icone('i-mais')}Criar</button>
      </div>
    </form>
    ${lista || '<p class="texto-suave">Nenhuma partida salva.</p>'}
  </main>`;
}

// ---------- Escolher sobrevivente ----------

export function telaEscolher({ sobreviventes, habilidades, temPartida }) {
  const cards = sobreviventes.map((s) => `
    <button class="cartao cartao-sobrevivente" type="button" data-acao="adicionar" data-id="${esc(s.id)}">
      ${retrato(s, 'azul')}
      <span class="cartao-ficha__corpo">
        <span class="cartao-ficha__nome">${esc(s.nome)}</span>
        <span class="texto-suave">${esc(TIPO[s.tipo] ?? 'Tipo a conferir')} · ${esc(nomeHab(s.habilidades?.azul?.[0], habilidades) ?? '')}</span>
        ${s.confirmado ? '' : selo(true)}
      </span>
    </button>`).join('');
  return `
  ${topoSimples('Escolha o sobrevivente', temPartida ? { voltar: { tela: 'mesa', rotulo: 'Voltar para a mesa', icone: 'i-mesa' } } : {})}
  <main class="pagina pilha">
    <p class="texto-suave">Os 12 da caixa base. Toque para criar a ficha.</p>
    <div class="grade-sobreviventes">${cards}</div>
  </main>`;
}

// ---------- Folhas de baixo ----------

export function folhaEscolha({ escolha, habilidades, nomeSobrevivente }) {
  const opcoes = escolha.opcoes.map((hid) => `
    <button class="chip-nivel chip-nivel--opcao opcao-hab" data-nivel="${escolha.nivel}" type="button" data-acao="escolher" data-nivel-escolha="${escolha.nivel}" data-hid="${esc(hid)}">
      <span class="opcao-hab__nome">${esc(nomeHab(hid, habilidades))}</span>
      <span class="opcao-hab__desc">${esc(habilidades?.[hid]?.desc ?? '')}</span>
    </button>`).join('');
  const qtd = escolha.opcoes.length;
  return `
    <div class="folha__titulo"><span id="folha-titulo">Nível ${NOME_NIVEL[escolha.nivel].toLowerCase()}!</span>
      <button class="btn btn-icone btn-fantasma" type="button" data-acao="fechar-folha" aria-label="Escolher depois">${icone('i-fechar')}</button></div>
    <p class="texto-suave" style="margin-bottom:12px">${esc(nomeSobrevivente)}: escolha 1 habilidade${qtd > 1 ? ` de ${qtd}` : ''}.</p>
    <div class="folha__opcoes">${opcoes || '<p class="texto-suave">Não sobrou opção nos dados.</p>'}</div>`;
}

export function folhaConfig({ ficha, sobrevivente, wakeLock, wakeLockSuportado }) {
  const fonte = sobrevivente?.fonte
    ? `<p class="texto-suave dica">Fonte da árvore: <a href="${esc(sobrevivente.fonte)}" target="_blank" rel="noopener">${esc(sobrevivente.fonte.replace(/^https?:\/\//, ''))}</a></p>`
    : '';
  return `
    <div class="folha__titulo"><span id="folha-titulo">Opções</span>
      <button class="btn btn-icone btn-fantasma" type="button" data-acao="fechar-folha" aria-label="Fechar">${icone('i-fechar')}</button></div>
    <div class="folha__opcoes">
      <label class="interruptor"><input type="checkbox" data-acao="ultrared" ${ficha.ultrared ? 'checked' : ''}>
        <span><b>Ultrared</b><small>Ao chegar a 43, o marcador volta a 0 e continua no vermelho.</small></span></label>
      <label class="interruptor"><input type="checkbox" data-acao="wake-lock" ${wakeLock ? 'checked' : ''} ${wakeLockSuportado ? '' : 'disabled'}>
        <span><b>Tela sempre acesa</b><small>${wakeLockSuportado ? 'Enquanto a ficha estiver aberta.' : 'Este navegador não deixa.'}</small></span></label>
      <button class="btn btn-grande btn-fantasma" type="button" data-acao="remover-ficha">${icone('i-fechar')}Tirar ficha da mesa</button>
      ${fonte}
    </div>`;
}
