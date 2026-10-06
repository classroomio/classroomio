"""ClassroomIO brand primitives for video: colours, Geist fonts, tracked text and the logo."""
import math
import os
from functools import lru_cache

from PIL import Image, ImageDraw, ImageFont

SKILL_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
DESIGN_DIR = os.path.join(os.path.dirname(SKILL_DIR), 'classroomio-design')
DESIGN_ASSETS = os.path.join(DESIGN_DIR, 'assets', 'images')
CACHE_DIR = os.environ.get('CIO_VIDEO_CACHE') or os.path.join(
    os.environ.get('XDG_CACHE_HOME') or os.path.join(os.path.expanduser('~'), '.cache'), 'cio-video')

PAGE = (250, 250, 250)
PAPER = (253, 251, 247)
SAND_100 = (246, 242, 233)
SAND_200 = (241, 238, 231)
SAND_BLOCK = (227, 218, 202)
SAND_300 = (207, 197, 179)
INK = (23, 20, 15)
MUTED = (107, 97, 82)
MUTED_ON_INK = (140, 130, 114)
DIM = (176, 167, 150)
BLUE = (2, 51, 189)
SKY = (173, 195, 255)
TINT = (214, 222, 255)
INK_RULE = (58, 53, 45)
WHITE = (255, 255, 255)

MARK_VIEWBOX = (55, 180, 916, 666)
SUPERSAMPLE = 2


def font_path(name):
    """Converts a design-system woff2 to a cached ttf that Pillow can load."""
    target = os.path.join(CACHE_DIR, 'fonts', f'{name}.ttf')
    if os.path.exists(target):
        return target
    from fontTools.ttLib import TTFont
    os.makedirs(os.path.dirname(target), exist_ok=True)
    font = TTFont(os.path.join(DESIGN_DIR, 'fonts', f'{name}.woff2'))
    font.flavor = None
    font.save(target)
    return target


@lru_cache(maxsize=256)
def geist(size, weight=700):
    font = ImageFont.truetype(font_path('Geist-Variable-latin'), max(1, round(size)))
    font.set_variation_by_axes([weight])
    return font


@lru_cache(maxsize=128)
def mono(size, weight=500):
    font = ImageFont.truetype(font_path('GeistMono-latin'), max(1, round(size)))
    font.set_variation_by_axes([weight])
    return font


def text_width(text, font, tracking=0.0):
    return sum(font.getlength(ch) + tracking for ch in text) - (tracking if text else 0)


def draw_tracked(draw, x, baseline, text, font, fill, tracking=0.0):
    """Draws text glyph by glyph so letter-spacing matches the design tokens. Returns the end x."""
    for ch in text:
        draw.text((x, baseline), ch, font=font, fill=fill, anchor='ls')
        x += font.getlength(ch) + tracking
    return x


def wrap(words, font, tracking, max_width):
    lines, current = [], []
    space = font.getlength(' ')
    for word in words:
        trial = current + [word]
        width = sum(text_width(w, font, tracking) for w in trial) + space * (len(trial) - 1)
        if current and width > max_width:
            lines.append(current)
            current = [word]
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


def fit_lines(text, max_width, max_lines, size, weight=700, tracking_em=-0.04, step=4):
    """Shrinks a Geist headline until it wraps into `max_lines`. Returns (lines, font, tracking)."""
    while True:
        font = geist(size, weight)
        tracking = size * tracking_em
        lines = wrap(text.split(), font, tracking, max_width)
        if len(lines) <= max_lines or size <= 24:
            return [' '.join(line) for line in lines], font, tracking
        size -= step


def mark_pieces(height, colour):
    """The three shapes of assets/logo-mark.svg, each on its own supersampled layer at full mark size."""
    scale = height * SUPERSAMPLE / MARK_VIEWBOX[3]
    width = round(MARK_VIEWBOX[2] * scale)
    full_height = round(MARK_VIEWBOX[3] * scale)

    def point(x, y):
        return ((x - MARK_VIEWBOX[0]) * scale, (y - MARK_VIEWBOX[1]) * scale)

    def layer():
        image = Image.new('L', (width, full_height), 0)
        return image, ImageDraw.Draw(image)

    radius = 10 * scale
    disc, draw = layer()
    draw.pieslice([*point(385 - 333, 180), *point(385 + 333, 846)], 90, 270, fill=255)
    draw.rounded_rectangle([*point(385, 180), *point(528, 846)], radius, fill=255, corners=(False, True, True, False))

    head, draw = layer()
    draw.ellipse([*point(796 - 173, 353 - 173), *point(796 + 173, 353 + 173)], fill=255)

    body, draw = layer()
    draw.rounded_rectangle([*point(591, 752), *point(971, 846)], radius, fill=255, corners=(False, False, True, True))
    draw.rounded_rectangle([*point(748, 595), *point(971, 760)], radius, fill=255, corners=(False, True, False, False))
    draw.pieslice([*point(748 - 157, 752 - 157), *point(748 + 157, 752 + 157)], 180, 270, fill=255)

    layers = []
    for mask in (disc, head, body):
        piece = Image.new('RGBA', mask.size, colour + (255,))
        piece.putalpha(mask)
        layers.append(piece)
    return layers


def wordmark_layer(size, colour):
    """Lowercase Geist 800 'classroomio' wordmark at supersampled scale."""
    font = geist(size * SUPERSAMPLE, 800)
    tracking = -size * SUPERSAMPLE * 0.04
    width = math.ceil(text_width('classroomio', font, tracking)) + 4
    ascent, descent = font.getmetrics()
    image = Image.new('RGBA', (width, ascent + descent), (0, 0, 0, 0))
    draw_tracked(ImageDraw.Draw(image), 0, ascent, 'classroomio', font, colour + (255,), tracking)
    return image


@lru_cache(maxsize=16)
def logo(height, mark_colour=PAPER, text_colour=PAPER):
    """Mark + wordmark lockup at the given mark height, cropped to its ink."""
    pieces = mark_pieces(height, mark_colour)
    mark = pieces[0].copy()
    for piece in pieces[1:]:
        mark.alpha_composite(piece)
    word = wordmark_layer(height * 0.92, text_colour)
    gap = round(height * 0.26 * SUPERSAMPLE)
    canvas = Image.new('RGBA', (mark.width + gap + word.width, max(mark.height, word.height)), (0, 0, 0, 0))
    canvas.alpha_composite(mark, (0, 0))
    canvas.alpha_composite(word, (mark.width + gap, round(mark.height / 2 - word.height * 0.56)))
    canvas = canvas.crop(canvas.getbbox())
    return canvas.resize((round(canvas.width / SUPERSAMPLE), round(canvas.height / SUPERSAMPLE)), Image.LANCZOS)


def design_asset(name):
    return os.path.join(DESIGN_ASSETS, name)
