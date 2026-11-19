"""Word-by-word burned-in captions and SRT export."""
from PIL import Image, ImageDraw

from . import brand
from .timeline import build_pages

LANDSCAPE = {'size': 50, 'tracking': -1.0, 'max_width': 820, 'max_lines': 2, 'origin': (108, 1080 - 96), 'chip': True,
             'line_height': 62, 'canvas': (1920, 1080)}
VERTICAL = {'size': 60, 'tracking': -1.2, 'max_width': 920, 'max_lines': 3, 'origin': (80, 0), 'chip': False,
            'line_height': 70, 'canvas': (1080, 320), 'top': 1460}


def page_drawer(style):
    font = brand.geist(style['size'], 700)

    def draw_page(words, active):
        image = Image.new('RGBA', style['canvas'], (0, 0, 0, 0))
        draw = ImageDraw.Draw(image)
        lines = brand.wrap(words, font, style['tracking'], style['max_width'])
        space = font.getlength(' ')
        widths = [sum(brand.text_width(w, font, style['tracking']) for w in line) + space * (len(line) - 1) for line in lines]
        x0, anchor = style['origin']
        block = style['line_height'] * len(lines)
        top = anchor - block if style['chip'] else anchor
        if style['chip']:
            draw.rectangle((x0 - 28, top - 22, x0 + max(widths) + 28, top + block + 14), fill=brand.INK + (214,))
        index = 0
        for number, line in enumerate(lines):
            baseline = top + style['line_height'] * number + font.size * 0.92
            x = x0
            for word in line:
                colour = brand.SKY if index == active else brand.PAPER
                x = brand.draw_tracked(draw, x, baseline, word, font, colour, style['tracking']) + space
                index += 1
        return image

    return draw_page


class Captions:
    def __init__(self, tokens, duration, style):
        font = brand.geist(style['size'], 700)
        self.pages = build_pages(tokens, font, style['tracking'], style['max_width'], style['max_lines'], duration)
        self.states = []
        for page_index, (page, _, page_end) in enumerate(self.pages):
            for word_index, (t, _) in enumerate(page):
                state_end = page[word_index + 1][0] if word_index + 1 < len(page) else page_end
                self.states.append((t, state_end, page_index, word_index))
        self.draw = page_drawer(style)
        self.cache = {}

    def layer(self, t):
        """(image, (x, y)) for the caption visible at time t, or None."""
        for start, end, page_index, word_index in self.states:
            if start <= t < end:
                key = (page_index, word_index)
                if key not in self.cache:
                    image = self.draw([w for _, w in self.pages[page_index][0]], word_index)
                    box = image.getbbox()
                    self.cache[key] = (image.crop(box), box[:2]) if box else None
                return self.cache[key]
        return None


def stamp(t):
    ms = int(round(t * 1000))
    hours, ms = divmod(ms, 3600000)
    minutes, ms = divmod(ms, 60000)
    seconds, ms = divmod(ms, 1000)
    return f'{hours:02d}:{minutes:02d}:{seconds:02d},{ms:03d}'


def write_srt(path, tokens, duration, offset=0.0, lead_text=None):
    """Writes captions paged like the burned-in landscape captions, shifted by `offset` (the hook length)."""
    font = brand.geist(LANDSCAPE['size'], 700)
    pages = build_pages(tokens, font, LANDSCAPE['tracking'], LANDSCAPE['max_width'], LANDSCAPE['max_lines'], duration)
    with open(path, 'w') as handle:
        index = 1
        if lead_text:
            handle.write(f'{index}\n{stamp(0)} --> {stamp(offset)}\n{lead_text}\n\n')
            index += 1
        for page, _, page_end in pages:
            text = ' '.join(w for _, w in page)
            handle.write(f'{index}\n{stamp(page[0][0] + offset)} --> {stamp(page_end + offset)}\n{text}\n\n')
            index += 1
