"""The ClassroomIO sign-off: the logo mark assembles, notch blocks drop and interlock, the headline lands with a swipe."""
import os
import shutil
import subprocess
import tempfile

from PIL import Image, ImageDraw

from . import brand
from .visuals import ease_out

DURATION = 5.0
SS = brand.SUPERSAMPLE

DEFAULT_BLOCKS = [
    {'kind': 'LESSON', 'title': 'Getting started', 'tone': 'sand'},
    {'kind': 'QUIZ', 'title': 'Setup check', 'tone': 'tint'},
    {'kind': 'CERTIFICATE', 'title': 'Certified', 'tone': 'blue'},
]
TONES = {'sand': (brand.SAND_BLOCK, brand.BLUE, brand.INK), 'tint': (brand.TINT, brand.BLUE, brand.INK),
         'blue': (brand.BLUE, brand.SKY, brand.WHITE)}

LANDSCAPE = {'size': (1920, 1080), 'unit': 2.4, 'block_units': 300, 'mark_height': 84, 'mark_pos': (140, 190),
             'wordmark_size': 76, 'headline_size': 112, 'headline_pos': (140, 420), 'url_size': 24, 'url_pos': (146, 720),
             'stack_pos': (1060, 880), 'max_width': 860}
VERTICAL = {'size': (1080, 1920), 'unit': 2.6, 'block_units': 340, 'mark_height': 84, 'mark_pos': (80, 250),
            'wordmark_size': 76, 'headline_size': 112, 'headline_pos': (80, 470), 'url_size': 26, 'url_pos': (86, 770),
            'stack_pos': (80, 1560), 'max_width': 920}


def drop(t, start, distance):
    """Brand drop timing (cubic-bezier(.55,0,.9,.45) fall, small bounce). Returns (y_offset, alpha) or (None, 0)."""
    elapsed = t - start
    if elapsed <= 0:
        return None, 0.0
    fall, bounce = 0.34, 0.16
    if elapsed < fall:
        progress = elapsed / fall
        return -distance * (1 - progress ** 2.4), min(1.0, progress / 0.35)
    elapsed -= fall
    if elapsed < bounce:
        progress = elapsed / bounce
        return -distance * 0.055 * 4 * progress * (1 - progress), 1.0
    return 0.0, 1.0


def fade(layer, alpha):
    if alpha >= 1:
        return layer
    faded = layer.copy()
    faded.putalpha(faded.getchannel('A').point(lambda value: round(value * alpha)))
    return faded


def reveal(frame, layer, x, y, progress):
    if progress <= 0:
        return
    offset = round((1 - progress) * layer.height)
    frame.alpha_composite(layer.crop((0, 0, layer.width, layer.height - offset)), (round(x), round(y + offset)))


def text_layer(text, font, colour, tracking):
    ascent, descent = font.getmetrics()
    image = Image.new('RGBA', (round(brand.text_width(text, font, tracking)) + 8, ascent + descent), (0, 0, 0, 0))
    brand.draw_tracked(ImageDraw.Draw(image), 0, ascent, text, font, colour + (255,), tracking)
    return image


def block_layer(block, unit, width_units, with_tab):
    """Block.jsx at video scale: square tile, notch cut from the top edge, optional interlocking tab."""
    bg, label_colour, title_colour = TONES[block.get('tone', 'sand')]
    width = round(width_units * unit)
    height = round(64 * unit)
    tab = round(16 * unit) if with_tab else 0
    image = Image.new('RGBA', (width, height + tab), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    draw.rectangle([0, 0, width, height], fill=bg)
    left, notch_width, notch_height, inset = 24 * unit, 46 * unit, 10 * unit, 8 * unit
    draw.polygon([(left, -unit), (left + notch_width, -unit), (left + notch_width - inset, notch_height),
                  (left + inset, notch_height)], fill=(0, 0, 0, 0))
    if with_tab:
        left, tab_width, inset = 26 * unit, 42 * unit, 7 * unit
        draw.polygon([(left, height), (left + tab_width, height), (left + tab_width - inset, height + tab),
                      (left + inset, height + tab)], fill=bg)
    pad = 18 * unit
    brand.draw_tracked(draw, pad, 24 * unit, block['kind'], brand.mono(round(10 * unit)), label_colour, 10 * unit * 0.12)
    draw.text((pad, 45 * unit), block['title'], font=brand.geist(round(15 * unit), 600), fill=title_colour, anchor='ls')
    return image


def frames(layout, settings):
    width, height = layout['size']
    pieces = brand.mark_pieces(layout['mark_height'], brand.BLUE)
    word = brand.wordmark_layer(layout['wordmark_size'], brand.INK)
    lines = settings['headline']
    size = layout['headline_size']
    font = brand.geist(size * SS, 700)
    tracking = -size * SS * 0.05
    while max(brand.text_width(line, font, tracking) for line in lines) > layout['max_width'] * SS and size > 48:
        size -= 6
        font = brand.geist(size * SS, 700)
        tracking = -size * SS * 0.05
    ascent = font.getmetrics()[0]
    head_layers = [text_layer(line, font, brand.INK, tracking) for line in lines]
    url_font = brand.mono(layout['url_size'] * SS)
    url_layer = text_layer(settings['url'], url_font, brand.MUTED, url_font.size * 0.12)
    unit = layout['unit'] * SS
    blocks = [block_layer(block, unit, layout['block_units'], index > 0)
              for index, block in enumerate(settings.get('blocks') or DEFAULT_BLOCKS)]
    block_height = round(64 * unit)
    block_gap = round(8 * unit)
    swipe = settings.get('swipe')

    for frame_index in range(round(DURATION * 30)):
        t = frame_index / 30
        frame = Image.new('RGBA', (width * SS, height * SS), brand.PAGE + (255,))
        mark_x, mark_y = layout['mark_pos'][0] * SS, layout['mark_pos'][1] * SS
        for index, piece in enumerate(pieces):
            offset, alpha = drop(t, 0.10 + index * 0.16, 90 * SS)
            if offset is not None:
                frame.alpha_composite(fade(piece, alpha), (round(mark_x), round(mark_y + offset)))
        word_x = mark_x + pieces[0].width + 22 * SS
        word_y = mark_y + pieces[0].height / 2 - word.height * 0.56
        reveal(frame, word, word_x, word_y, ease_out((t - 0.62) / 0.42))

        line_height = size * 0.98 * SS
        head_x, head_y = layout['headline_pos'][0] * SS, layout['headline_pos'][1] * SS
        for index, layer in enumerate(head_layers):
            line_y = head_y + line_height * index
            if swipe and swipe in lines[index]:
                before = lines[index][:lines[index].index(swipe)]
                left = head_x + brand.text_width(before, font, tracking) + (tracking if before else 0)
                span = brand.text_width(swipe.rstrip('.'), font, tracking)
                progress = ease_out((t - 1.55) / 0.38)
                if progress > 0:
                    baseline = line_y + ascent
                    ImageDraw.Draw(frame).rectangle(
                        [left - 6 * SS, baseline - size * SS * 0.30, left - 6 * SS + (span + 12 * SS) * progress,
                         baseline + size * SS * 0.08], fill=brand.SKY)
            reveal(frame, layer, head_x, line_y, ease_out((t - (0.95 + index * 0.09)) / 0.42))
        reveal(frame, url_layer, layout['url_pos'][0] * SS, layout['url_pos'][1] * SS, ease_out((t - 1.35) / 0.35))

        stack_x, stack_bottom = layout['stack_pos'][0] * SS, layout['stack_pos'][1] * SS
        for index, layer in enumerate(blocks):
            offset, alpha = drop(t, 0.45 + index * 0.30, 140 * SS)
            if offset is None:
                continue
            top = stack_bottom - block_height * (index + 1) - block_gap * index
            frame.alpha_composite(fade(layer, alpha), (round(stack_x), round(top + offset)))
        yield frame.convert('RGB').resize((width, height), Image.LANCZOS)


def render(settings, out_path, layout):
    with tempfile.TemporaryDirectory() as folder:
        for index, frame in enumerate(frames(layout, settings)):
            frame.save(os.path.join(folder, f'f{index:04d}.png'), compress_level=1)
        subprocess.run(['ffmpeg', '-y', '-v', 'error', '-framerate', '30', '-i', os.path.join(folder, 'f%04d.png'),
                        '-f', 'lavfi', '-t', str(DURATION), '-i', 'anullsrc=r=48000:cl=stereo',
                        '-c:v', 'libx264', '-crf', '14', '-preset', 'slow', '-pix_fmt', 'yuv420p', '-r', '30',
                        '-c:a', 'aac', '-b:a', '192k', '-shortest', '-movflags', '+faststart', out_path], check=True)


def ensure(project, force=False):
    """Returns {'16x9': path, '9x16': path}. Uses sign_off.file when given, otherwise renders into output/sign-off/."""
    settings = project.sign_off
    if settings.get('file'):
        given = project.resolve(settings['file'])
        return {'16x9': given.replace('9x16', '16x9'), '9x16': given.replace('16x9', '9x16')}
    folder = os.path.join(project.output, 'sign-off')
    os.makedirs(folder, exist_ok=True)
    paths = {'16x9': os.path.join(folder, 'classroomio-sign-off-16x9.mp4'),
             '9x16': os.path.join(folder, 'classroomio-sign-off-9x16.mp4')}
    for fmt, layout in (('16x9', LANDSCAPE), ('9x16', VERTICAL)):
        if force or not os.path.exists(paths[fmt]):
            render(settings, paths[fmt], layout)
    return paths


def copy_to(paths, folder):
    os.makedirs(folder, exist_ok=True)
    for path in paths.values():
        shutil.copy(path, folder)
