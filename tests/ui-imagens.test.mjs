// Imagens oficiais na UI: retrato, ID Card, miniatura das cartas e fallback (onerror) para o visual próprio.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fichaVazia } from '../js/estado.js';
import { SOBREVIVENTES } from '../js/dados/sobreviventes.js';
import { HABILIDADES } from '../js/dados/habilidades.js';
import { telaFicha, telaMesa, telaEscolher, folhaIdCard, listaCartas } from '../js/ui/telas.js';

const SOB = Object.fromEntries(SOBREVIVENTES.map((s) => [s.id, s]));
const contar = (html, re) => (html.match(re) ?? []).length;
const imgs = (html) => html.match(/<img\b[^>]*>/g) ?? [];

test('retrato com imagem: <img> com onerror por cima das iniciais; sem imagem, só as iniciais', () => {
  const s = SOBREVIVENTES[0];
  const f = fichaVazia(s.id, 'f1');
  const html = telaFicha({ ficha: f, sobrevivente: s, habilidades: HABILIDADES, fichasDaMesa: [f], sobreviventes: SOB });
  const topo = html.slice(0, html.indexOf('</header>'));
  assert.match(topo, new RegExp(`<img class="retrato__img" src="${s.imagem}"[^>]*onerror="this.remove\\(\\)"`));
  assert.match(topo, /class="retrato retrato--topo"[^>]*><span>OS<\/span>/); // iniciais continuam por baixo
  // sem imagem: nada de <img>, e sem card não há botão de ID Card
  const semImg = { ...s, imagem: undefined, card: undefined };
  const html2 = telaFicha({ ficha: f, sobrevivente: semImg, habilidades: HABILIDADES });
  assert.equal(imgs(html2.slice(0, html2.indexOf('</header>'))).length, 0);
  assert.doesNotMatch(html2, /data-acao="ver-card"/);
});

test('ficha: tocar no retrato do topo abre o ID Card (botão com rótulo)', () => {
  const s = SOBREVIVENTES[0];
  const html = telaFicha({ ficha: fichaVazia(s.id, 'f1'), sobrevivente: s, habilidades: HABILIDADES });
  assert.match(html, new RegExp(`<button class="retrato-btn" type="button" data-acao="ver-card" aria-label="Ver ID Card de ${s.nome}">`));
});

test('mesa e escolha mostram o retrato com loading="lazy"', () => {
  const escolha = telaEscolher({ sobreviventes: SOBREVIVENTES, habilidades: HABILIDADES });
  const lista = imgs(escolha);
  assert.equal(lista.length, SOBREVIVENTES.length);
  for (const i of lista) {
    assert.match(i, /loading="lazy"/);
    assert.match(i, /onerror="this.remove\(\)"/);
    assert.match(i, /alt=""/);
  }
  const fichas = SOBREVIVENTES.slice(0, 3).map((s, i) => fichaVazia(s.id, 'f' + i));
  const mesa = telaMesa({ partida: { nome: 'P', fichas }, sobreviventes: SOB, fichaAtiva: 'f0' });
  assert.equal(contar(mesa, /<img class="retrato__img"[^>]*loading="lazy"/g), 3);
});

test('folha do ID Card: imagem com alt e, se der erro, troca pelo aviso com o retrato', () => {
  const s = SOBREVIVENTES.find((x) => x.id === 'tiger-sam');
  const html = folhaIdCard({ sobrevivente: s });
  assert.match(html, new RegExp(`<img src="${s.card}" alt="ID Card de Tiger Sam" width="600" height="518"`));
  assert.match(html, /onerror="this.parentNode.classList.add\('id-card--sem'\)"/);
  assert.match(html, /<div class="id-card__falta">/); // div: um <p> com o retrato (div) dentro quebra no parser
  assert.doesNotMatch(html, /<p[^>]*>(?:(?!<\/p>)[^])*<div/); // nenhum bloco dentro de <p>
  assert.match(html, /data-acao="fechar-folha"/);
  // sem card nos dados: já abre no modo sem imagem
  const sem = folhaIdCard({ sobrevivente: { ...s, card: undefined } });
  assert.match(sem, /class="id-card id-card--sem"/);
  assert.equal(imgs(sem).filter((i) => !i.includes('retrato__img')).length, 0);
  assert.doesNotThrow(() => folhaIdCard({ sobrevivente: null }));
});

test('lista de cartas: miniatura lazy sobre o ícone do tipo; sem imagem fica só o ícone', () => {
  const cartas = [
    { id: 'a', nome: 'Com Arte', tipo: 'corpo', imagem: 'assets/oficial/cartas/katana.jpg' },
    { id: 'b', nome: 'Sem Arte', tipo: 'item' },
  ];
  const html = listaCartas({ cartas, termo: '' });
  assert.equal(contar(html, /class="mini-carta"/g), 2);
  assert.equal(contar(html, /assets\/icones\.svg#i-corpo/g) >= 1, true);
  const [img, ...resto] = imgs(html);
  assert.equal(resto.length, 0);
  assert.match(img, /src="assets\/oficial\/cartas\/katana\.jpg"/);
  assert.match(img, /loading="lazy"/);
  assert.match(img, /onerror="this.remove\(\)"/);
});

test('slot do inventário com carta que tem imagem: arte atrás do texto; sem imagem, slot como antes', () => {
  const s = SOBREVIVENTES[0];
  const f = fichaVazia(s.id, 'f1');
  f.inventario.maos[0] = { equipId: 'x' };
  f.inventario.maos[1] = { equipId: 'y' };
  const equipamentos = {
    x: { id: 'x', nome: 'Katana', tipo: 'corpo', dados: 2, precisao: 4, dano: 1, imagem: 'assets/oficial/cartas/katana.jpg' },
    y: { id: 'y', nome: 'Água', tipo: 'item' },
  };
  const html = telaFicha({ ficha: f, sobrevivente: s, habilidades: HABILIDADES, equipamentos });
  assert.equal(contar(html, /class="slot__arte"/g), 1);
  assert.match(html, /<span class="slot__arte" aria-hidden="true"><img src="assets\/oficial\/cartas\/katana\.jpg"[^>]*onerror="this.remove\(\)"/);
  // o nome continua no slot (legível) e o rótulo do slot não muda
  assert.match(html, /<span class="slot__nome">Katana<\/span>/);
  assert.match(html, /<span class="slot__nome">Água<\/span>/);
});

test('src e alt passam por esc (sem injeção de atributo)', () => {
  const s = { ...SOBREVIVENTES[0], nome: 'A"b', imagem: 'x" onload="alert(1)', card: 'y"><script>' };
  const html = telaEscolher({ sobreviventes: [s], habilidades: HABILIDADES }) + folhaIdCard({ sobrevivente: s });
  assert.doesNotMatch(html, /onload="/); // a aspa vira &quot; e o atributo não nasce
  assert.doesNotMatch(html, /<script>/);
});

test('rodapé diz que é de fã e que as imagens são © CMON', () => {
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.match(html, /<footer class="rodape">ficha de fã, não oficial · imagens © CMON<\/footer>/);
});
