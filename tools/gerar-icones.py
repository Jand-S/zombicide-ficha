#!/usr/bin/env python3
"""Gera os ícones do app (desenho próprio: um "7" e a barra de perigo, sem arte da CMON).

Uso: python3 tools/gerar-icones.py   (precisa do Pillow; escreve em assets/app/)
"""
from pathlib import Path
from PIL import Image, ImageDraw

RAIZ = Path(__file__).resolve().parent.parent
SAIDA = RAIZ / 'assets' / 'app'

FUNDO = '#121110'
BORDA = '#a3101a'
PAPEL = '#211e1b'
SETE = '#f6c30b'
BARRA = ['#2b8cff', '#ffd21f', '#ff7a1a', '#e3141c']


def octogono(x0, y0, x1, y1, corte):
    return [(x0 + corte, y0), (x1 - corte, y0), (x1, y0 + corte), (x1, y1 - corte),
            (x1 - corte, y1), (x0 + corte, y1), (x0, y1 - corte), (x0, y0 + corte)]


def formas():
    """Formas no espaço 512x512: lista de (cor, pontos)."""
    f = [(BORDA, octogono(72, 72, 440, 440, 60)), (PAPEL, octogono(88, 88, 424, 424, 53))]
    f.append((SETE, [(160, 124), (352, 124), (352, 178), (254, 352), (192, 352), (288, 178), (160, 178)]))
    x, y0, y1, gap, larg = 160, 372, 400, 6, (192 - 3 * 6) / 4
    for cor in BARRA:
        f.append((cor, [(x, y0), (x + larg, y0), (x + larg, y1), (x, y1)]))
        x += larg + gap
    return f


def escalar(pontos, k):
    return [(256 + (px - 256) * k, 256 + (py - 256) * k) for px, py in pontos]


def svg(k=1.0):
    partes = [f'<rect width="512" height="512" fill="{FUNDO}"/>']
    for cor, pts in formas():
        d = ' '.join(f'{px:.1f},{py:.1f}' for px, py in escalar(pts, k))
        partes.append(f'<polygon fill="{cor}" points="{d}"/>')
    return ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">'
            + ''.join(partes) + '</svg>\n')


def png(tam, k=1.0):
    ss = 4
    big = tam * ss
    img = Image.new('RGB', (big, big), FUNDO)
    d = ImageDraw.Draw(img)
    esc = big / 512
    for cor, pts in formas():
        d.polygon([(px * esc, py * esc) for px, py in escalar(pts, k)], fill=cor)
    return img.resize((tam, tam), Image.LANCZOS)


def main():
    SAIDA.mkdir(parents=True, exist_ok=True)
    (SAIDA / 'icone.svg').write_text(svg(), encoding='utf-8')
    for tam in (180, 192, 512):
        png(tam).save(SAIDA / f'icone-{tam}.png', optimize=True)
    # maskable: o desenho cabe no círculo seguro (80% do centro)
    png(512, 0.78).save(SAIDA / 'icone-maskable-512.png', optimize=True)
    print('ícones gerados em', SAIDA.relative_to(RAIZ))


if __name__ == '__main__':
    main()
