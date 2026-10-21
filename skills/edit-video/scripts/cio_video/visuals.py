"""Explainer panels built from ClassroomIO design-system parts. Every kind draws into any (width, height) box."""
import math
from functools import lru_cache

from PIL import Image, ImageDraw

from .brand import (BLUE, DIM, INK, INK_RULE, MUTED, PAGE, PAPER, SAND_100, SAND_200, SAND_300, SAND_BLOCK, SKY, TINT,
                    draw_tracked, geist, mono, text_width)

BACKGROUND = {'browser': SAND_200, 'eventlog': INK}


def ease_out(p):
    p = min(1.0, max(0.0, p))
    return 1 - (1 - p) ** 3


def ease_in_out(p):
    p = min(1.0, max(0.0, p))
    return 3 * p * p - 2 * p * p * p


def appear(tau, at, length=0.38):
    return ease_out((tau - at) / length)


def drop(tau, at, distance):
    """Brand block drop: accelerate in, land, small bounce."""
    elapsed = tau - at
    if elapsed <= 0:
        return None, 0.0
    fall, bounce = 0.32, 0.16
    if elapsed < fall:
        progress = elapsed / fall
        return -distance * (1 - progress ** 2.4), min(1.0, progress / 0.35)
    elapsed -= fall
    if elapsed < bounce:
        progress = elapsed / bounce
        return -distance * 0.05 * 4 * progress * (1 - progress), 1.0
    return 0.0, 1.0


def put(canvas, layer, position):
    x, y = round(position[0]), round(position[1])
    if x >= canvas.width or y >= canvas.height or x + layer.width <= 0 or y + layer.height <= 0:
        return
    if x < 0 or y < 0:
        layer = layer.crop((max(0, -x), max(0, -y), layer.width, layer.height))
        x, y = max(0, x), max(0, y)
    canvas.alpha_composite(layer, (x, y))


def with_alpha(image, alpha):
    if alpha >= 0.999:
        return image
    faded = image.copy()
    faded.putalpha(faded.getchannel('A').point(lambda value: int(value * alpha)))
    return faded


def text_layer(text, font, colour, tracking=0.0):
    ascent, descent = font.getmetrics()
    width = max(1, math.ceil(text_width(text, font, tracking)) + 6)
    layer = Image.new('RGBA', (width, ascent + descent), (0, 0, 0, 0))
    draw_tracked(ImageDraw.Draw(layer), 0, ascent, text, font, colour + (255,), tracking)
    return layer


@lru_cache(maxsize=512)
def cached_text(text, family, size, weight, colour, tracking_em):
    font = mono(size, weight) if family == 'mono' else geist(size, weight)
    return text_layer(text, font, colour, size * tracking_em)


def wrap_words(text, family, size, weight, tracking_em, max_width):
    font = mono(size, weight) if family == 'mono' else geist(size, weight)
    tracking = size * tracking_em
    lines, current = [], ''
    for word in text.split():
        trial = f'{current} {word}'.strip()
        if current and text_width(trial, font, tracking) > max_width:
            lines.append(current)
            current = word
        else:
            current = trial
    if current:
        lines.append(current)
    return lines


class Box:
    def __init__(self, width, height, inset_top=0):
        self.width, self.height, self.inset_top = width, height, inset_top
        self.unit = max(0.8, min(1.5, min(width / 960, (height - inset_top) / 760))) * 1.3
        self.margin = round(80 * self.unit)
        self.content_width = width - 2 * self.margin
        self.top = inset_top + self.margin

    def u(self, value):
        return round(value * self.unit)


def eyebrow(canvas, box, text, tau, colour=BLUE):
    layer = cached_text(text, 'mono', box.u(20), 500, colour, 0.12)
    progress = appear(tau, 0.15)
    put(canvas, with_alpha(layer, progress), (box.margin, box.top + round((1 - progress) * box.u(12))))
    return box.top + layer.height + box.u(36)


@lru_cache(maxsize=32)
def browser_frame(image_path, url, frame_width, unit):
    """BrowserFrame (components/surfaces/BrowserFrame.jsx, non-sketch): sand header, three dots, mono URL pill."""
    shot = Image.open(image_path).convert('RGB')
    header = round(50 * unit)
    image_height = round(shot.height * (frame_width - 2) / shot.width)
    radius = round(18 * unit)
    frame = Image.new('RGBA', (frame_width, header + image_height + 2), (0, 0, 0, 0))
    mask = Image.new('L', frame.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, frame.width - 1, frame.height - 1], radius, fill=255)
    body = Image.new('RGBA', frame.size, SAND_300 + (255,))
    inner = Image.new('RGBA', (frame_width - 2, header + image_height), PAPER + (255,))
    draw = ImageDraw.Draw(inner)
    draw.rectangle([0, 0, inner.width, header - 1], fill=SAND_100)
    draw.line([0, header - 1, inner.width, header - 1], fill=SAND_300, width=1)
    dot = round(11 * unit)
    for index in range(3):
        x = round(14 * unit) + index * (dot + round(7 * unit))
        draw.ellipse([x, header / 2 - dot / 2, x + dot, header / 2 + dot / 2], fill=SAND_300)
    pill_x = round(14 * unit) + 3 * (dot + round(7 * unit)) + round(10 * unit)
    pill_h = round(24 * unit)
    url_font = mono(round(13 * unit), 500)
    pill_w = min(round(420 * unit), round(text_width(url, url_font, 0)) + round(24 * unit))
    draw.rounded_rectangle([pill_x, header / 2 - pill_h / 2, pill_x + pill_w, header / 2 + pill_h / 2], round(6 * unit),
                           fill=PAPER, outline=SAND_300)
    draw.text((pill_x + round(11 * unit), header / 2), url, font=url_font, fill=MUTED, anchor='lm')
    inner.paste(shot.resize((frame_width - 2, image_height), Image.LANCZOS), (0, header))
    body.paste(inner, (1, 1))
    frame.paste(body, (0, 0), mask)
    return frame


@lru_cache(maxsize=8)
def stamp_layer(top, bottom, size):
    """Stamp (components/brand/Stamp.jsx): outline circle, mono top line, bold bottom line, tilted -12deg."""
    scale = 2
    side = size * scale
    layer = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    stroke = max(3, round(side * 0.022))
    draw.ellipse([stroke, stroke, side - stroke, side - stroke], fill=PAPER + (235,), outline=BLUE, width=stroke)
    draw.ellipse([stroke * 4, stroke * 4, side - stroke * 4, side - stroke * 4], outline=BLUE, width=max(1, stroke // 2))
    top_font = mono(round(side * 0.085), 500)
    draw_tracked(draw, side / 2 - text_width(top, top_font, side * 0.012) / 2, side * 0.43, top, top_font, BLUE, side * 0.012)
    bottom_font = geist(round(side * 0.17), 700)
    draw_tracked(draw, side / 2 - text_width(bottom, bottom_font, -side * 0.006) / 2, side * 0.64, bottom, bottom_font, BLUE,
                 -side * 0.006)
    return layer.rotate(12, resample=Image.BICUBIC, expand=False).resize((size, size), Image.LANCZOS)


def draw_browser(canvas, box, props, tau, times, length):
    y = eyebrow(canvas, box, props['eyebrow'], tau)
    credit_space = box.u(56) if props.get('credit') else 0
    available_h = box.height - y - box.margin - credit_space
    frame_width = min(box.content_width, box.u(1400)) if box.width > box.height else box.width - box.u(56)
    probe = browser_frame(props['image'], props['url'], frame_width, box.unit)
    if probe.height > available_h:
        frame_width = round(frame_width * available_h / probe.height)
        probe = browser_frame(props['image'], props['url'], frame_width, box.unit)
    progress = appear(tau, 0.3, 0.5)
    zoom = 1 + 0.035 * ease_in_out(tau / max(length, 1))
    frame = probe if zoom < 1.001 else probe.resize((round(probe.width * zoom), round(probe.height * zoom)), Image.BILINEAR)
    x = (box.width - frame.width) // 2
    top = y + (available_h - probe.height) // 2 - (frame.height - probe.height) // 2
    put(canvas, with_alpha(frame, progress), (x, top + round((1 - progress) * box.u(60))))
    if props.get('credit'):
        credit = cached_text(props['credit'], 'mono', box.u(15), 500, MUTED, 0.1)
        put(canvas, with_alpha(credit, appear(tau, 0.7)), (x, top + frame.height + box.u(18)))
    if props.get('stamp'):
        size = box.u(210)
        stamp_at = 1.4
        progress = appear(tau, stamp_at, 0.28)
        if progress > 0:
            scale = 1.35 - 0.35 * progress
            layer = stamp_layer(*props['stamp'], size)
            layer = layer.resize((round(size * scale), round(size * scale)), Image.BILINEAR)
            cx = x + frame.width - size * 0.45
            cy = top + frame.height - size * 0.2
            put(canvas, with_alpha(layer, progress), (round(cx - layer.width / 2), round(cy - layer.height / 2)))


def item_time(item, times, index, base=0.45, step=0.45):
    at = times.get(item.get('at')) if item.get('at') else None
    return at if at is not None else base + index * step


def draw_rows(canvas, box, props, tau, times, length, numbered=False):
    y = eyebrow(canvas, box, props['eyebrow'], tau)
    entries = props.get('rows') or [dict(label=f'{i + 1:02d}', value=item['text'], at=item.get('at'))
                                    for i, item in enumerate(props['items'])]
    value_size = box.u(48 if not numbered else 44)
    label_col = box.u(240 if not numbered else 110)
    lines_per_entry = [wrap_words(entry['value'], 'geist', value_size, 600, -0.02, box.content_width - label_col) for entry in entries]
    row_heights = [box.u(44) + value_size * 1.05 * len(lines) for lines in lines_per_entry]
    total = sum(row_heights)
    y = max(y, y + (box.height - box.margin - y - total) // 2)
    draw = ImageDraw.Draw(canvas)
    rule = SAND_300 if canvas.getpixel((2, 2))[:3] != INK else INK_RULE
    for index, (entry, lines, row_height) in enumerate(zip(entries, lines_per_entry, row_heights)):
        start = item_time(entry, times, index)
        progress = appear(tau, start)
        if progress <= 0:
            y += row_height
            continue
        line_progress = ease_out((tau - start) / 0.45)
        draw.line([box.margin, y, box.margin + (box.content_width) * line_progress, y], fill=rule, width=max(1, box.u(1.5)))
        offset = round((1 - progress) * box.u(26))
        label = cached_text(entry['label'], 'mono', box.u(18), 500, BLUE if entry.get('blue') else MUTED, 0.12)
        put(canvas, with_alpha(label, progress), (box.margin, y + box.u(22) + offset + round(value_size * 0.24)))
        colour = BLUE if entry.get('blue') else DIM if entry.get('dim') else INK
        struck = entry.get('strike') and tau > start + 0.5
        if struck:
            colour = DIM
        line_y = y + box.u(22) + offset
        for line in lines:
            layer = cached_text(line, 'geist', value_size, 600, colour, -0.02)
            put(canvas, with_alpha(layer, progress), (box.margin + label_col, line_y))
            if entry.get('strike'):
                strike_progress = ease_out((tau - start - 0.45) / 0.35)
                if strike_progress > 0:
                    mid = line_y + value_size * 0.62
                    draw.line([box.margin + label_col - box.u(6), mid,
                               box.margin + label_col - box.u(6) + (layer.width + box.u(10)) * strike_progress, mid],
                              fill=INK, width=box.u(5))
            line_y += round(value_size * 1.05)
        y += row_height
        if index == len(entries) - 1:
            draw.line([box.margin, y, box.margin + box.content_width * line_progress, y], fill=rule, width=max(1, box.u(1.5)))


def block_height(width, min_height, title, unit):
    pad = 20 * unit
    title_size = round(24 * unit)
    lines = wrap_words(title, 'geist', title_size, 600, 0, width - 2 * pad)
    return max(min_height, round(pad * 1.0 + 13 * unit * 1.9 + title_size * 1.12 * len(lines) + pad * 0.8)), lines


def notch_block(width, min_height, bg, surface, label, title, unit, label_colour, title_colour, with_tab):
    """Block (components/brand/Block.jsx): square tile, trapezoid notch cut from the top edge, optional tab."""
    height, lines = block_height(width, min_height, title, unit)
    tab = round(16 * unit) if with_tab else 0
    layer = Image.new('RGBA', (width, height + tab), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)
    draw.rectangle([0, 0, width, height], fill=bg)
    left, notch_w, notch_h, inset = 24 * unit, 46 * unit, 10 * unit, 8 * unit
    draw.polygon([(left, -1), (left + notch_w, -1), (left + notch_w - inset, notch_h), (left + inset, notch_h)], fill=surface)
    if with_tab:
        left, tab_w, inset = 26 * unit, 42 * unit, 7 * unit
        draw.polygon([(left, height), (left + tab_w, height), (left + tab_w - inset, height + tab), (left + inset, height + tab)], fill=bg)
    pad = 20 * unit
    label_font = mono(round(13 * unit), 500)
    title_size = round(24 * unit)
    title_font = geist(title_size, 600)
    text_block = 13 * unit * 1.9 + title_size * 1.12 * len(lines)
    y = (height - text_block) / 2 + 13 * unit
    draw_tracked(draw, pad, y, label, label_font, label_colour, 13 * unit * 0.12)
    y += 13 * unit * 0.9
    for line in lines:
        y += title_size * 1.12
        draw.text((pad, y), line, font=title_font, fill=title_colour, anchor='ls')
    return layer


def dashed_line(draw, start, end, progress, colour, width, dash=3, gap=7):
    if progress <= 0:
        return
    x0, y0 = start
    x1, y1 = end
    length = math.hypot(x1 - x0, y1 - y0) * progress
    total = math.hypot(x1 - x0, y1 - y0)
    if total == 0:
        return
    ux, uy = (x1 - x0) / total, (y1 - y0) / total
    position = 0.0
    while position < length:
        segment_end = min(position + dash * width, length)
        draw.line([x0 + ux * position, y0 + uy * position, x0 + ux * segment_end, y0 + uy * segment_end], fill=colour,
                  width=width)
        position += (dash + gap) * width
    draw.ellipse([x0 - width * 2, y0 - width * 2, x0 + width * 2, y0 + width * 2], fill=colour)


def draw_flow(canvas, box, props, tau, times, length):
    y = eyebrow(canvas, box, props['eyebrow'], tau)
    nodes = props['nodes']
    unit = box.unit * 1.25
    ratio = box.width / max(1, box.height - box.inset_top)
    count_all = len(nodes) + (1 if props.get('image') else 0)
    horizontal = (ratio > 1.3 and count_all <= 3) or (ratio > 1.6 and count_all <= 4)
    gap = box.u(70)
    image = props.get('image')
    draw = ImageDraw.Draw(canvas)
    surface = canvas.getpixel((2, 2))[:3]
    count = len(nodes) + (1 if image else 0)
    if horizontal:
        width = (box.content_width - gap * (count - 1)) // count

        def longest_word(scale):
            font = geist(round(24 * scale), 600)
            return max(font.getlength(word) for node in nodes for word in node.get('title', '').split())

        while longest_word(unit) > width - 2 * 20 * unit and unit > 0.6:
            unit *= 0.94
        height = max(block_height(width, round(100 * unit), node.get('title', ''), unit)[0] for node in nodes)
        top = y + (box.height - box.margin - y - height) // 2
        positions = [(box.margin + i * (width + gap), top) for i in range(count)]
    else:
        width = min(box.content_width, box.u(720))
        gap = box.u(46)
        height = max(block_height(width, round(84 * unit), node.get('title', ''), unit)[0] for node in nodes)
        while count * height + (count - 1) * gap > box.height - box.margin - y and unit > 0.6:
            unit *= 0.92
            height = max(block_height(width, round(84 * unit), node.get('title', ''), unit)[0] for node in nodes)
        stack = count * height + (count - 1) * gap
        top = y + max(0, (box.height - box.margin - y - stack) // 2)
        positions = [(box.margin, top + i * (height + gap)) for i in range(count)]
    entries = ([dict(image=image)] if image else []) + nodes
    for index, (entry, (x, node_y)) in enumerate(zip(entries, positions)):
        start = item_time(entry, times, index, base=0.4, step=0.7)
        if index > 0:
            px, py = positions[index - 1]
            if horizontal:
                begin, finish = (px + width, py + height / 2), (x, node_y + height / 2)
            else:
                begin, finish = (px + box.u(48), py + height), (x + box.u(48), node_y)
            dashed_line(draw, begin, finish, ease_out((tau - (start - 0.35)) / 0.35), BLUE, max(2, box.u(3)))
        offset, alpha = drop(tau, start, box.u(90))
        if offset is None:
            continue
        if entry.get('image'):
            card = Image.new('RGBA', (width, height), PAPER + (255,))
            card_draw = ImageDraw.Draw(card)
            card_draw.rectangle([0, 0, width - 1, height - 1], outline=SAND_300, width=max(1, box.u(1.5)))
            logo = Image.open(entry['image']).convert('RGBA')
            logo.thumbnail((height - box.u(28), height - box.u(28)))
            card.alpha_composite(logo, (box.u(14), (height - logo.height) // 2))
            card_draw.text((box.u(28) + logo.width, height * 0.42), props.get('image_label', ''), font=mono(box.u(14), 500),
                           fill=MUTED, anchor='ls')
            card_draw.text((box.u(28) + logo.width, height * 0.75), props.get('image_title', ''), font=geist(round(24 * unit), 600),
                           fill=INK, anchor='ls')
            layer = card
        else:
            blue = entry.get('blue')
            layer = notch_block(width, height, BLUE if blue else SAND_BLOCK, surface, entry['label'], entry['title'], unit,
                                SKY if blue else BLUE, (255, 255, 255) if blue else INK, False)
        put(canvas, with_alpha(layer, alpha), (x, round(node_y + offset)))


def draw_blocks(canvas, box, props, tau, times, length):
    y = eyebrow(canvas, box, props['eyebrow'], tau)
    blocks = props['blocks']
    unit = box.unit * 1.3
    width = min(box.content_width, box.u(760))
    height = round(84 * unit)
    gap = round(10 * unit)
    surface = canvas.getpixel((2, 2))[:3]
    available = box.height - box.margin - y
    while len(blocks) * (height + round(16 * unit)) + (len(blocks) - 1) * gap > available and unit > 0.6:
        unit *= 0.93
        height = round(84 * unit)
        gap = round(10 * unit)
    stack = len(blocks) * height + (len(blocks) - 1) * gap
    bottom = y + (available - stack) // 2 + stack
    for index, block in enumerate(blocks):
        start = item_time(block, times, index, base=0.4, step=0.6)
        offset, alpha = drop(tau, start, box.u(160))
        if offset is None:
            continue
        blue = block.get('blue')
        tones = [(SAND_BLOCK, BLUE, INK), (TINT, BLUE, INK), (SAND_BLOCK, BLUE, INK)]
        bg, label_colour, title_colour = (BLUE, SKY, (255, 255, 255)) if blue else tones[index % 3]
        layer = notch_block(width, height, bg, surface, block['kind'], block['title'], unit, label_colour, title_colour, index > 0)
        top = bottom - height * (index + 1) - gap * index
        put(canvas, with_alpha(layer, alpha), (box.margin, round(top + offset)))


def draw_statement(canvas, box, props, tau, times, length):
    y = eyebrow(canvas, box, props['eyebrow'], tau)
    lines = props['lines']
    size = box.u(92)
    font = geist(size, 700)
    tracking = -size * 0.05
    while max(text_width(line, font, tracking) for line in lines) > box.content_width and size > 30:
        size -= 4
        font = geist(size, 700)
        tracking = -size * 0.05
    line_height = size * 0.98
    top = y + (box.height - box.margin - y - line_height * len(lines)) // 2
    swipe_line, swipe_word = props.get('swipe') or (None, None)
    swipe_at = times.get(props.get('swipe_at')) if props.get('swipe_at') else None
    swipe_at = swipe_at if swipe_at is not None else 1.2
    draw = ImageDraw.Draw(canvas)
    ascent = font.getmetrics()[0]
    for index, line in enumerate(lines):
        line_y = top + line_height * index
        if index == swipe_line:
            before = line[:line.index(swipe_word)]
            left = box.margin + text_width(before, font, tracking) + (tracking if before else 0)
            width = text_width(swipe_word.rstrip('.'), font, tracking)
            progress = ease_out((tau - swipe_at) / 0.38)
            if progress > 0:
                baseline = line_y + ascent
                draw.rectangle([left - size * 0.06, baseline - size * 0.32, left - size * 0.06 + (width + size * 0.12) * progress,
                                baseline + size * 0.08], fill=SKY)
        layer = cached_text(line, 'geist', size, 700, INK, -0.05)
        progress = ease_out((tau - (0.35 + index * 0.12)) / 0.42)
        if progress > 0:
            offset = round((1 - progress) * layer.height)
            put(canvas, layer.crop((0, 0, layer.width, layer.height - offset)), (box.margin, round(line_y + offset)))


def draw_progress(canvas, box, props, tau, times, length):
    y = eyebrow(canvas, box, props['eyebrow'], tau)
    draw = ImageDraw.Draw(canvas)
    track_y = y + (box.height - box.margin - y) // 2
    left, right = box.margin, box.width - box.margin
    thickness = box.u(10)
    reveal = ease_out((tau - 0.3) / 0.6)
    draw.rectangle([left, track_y, left + (right - left) * reveal, track_y + thickness], fill=SAND_BLOCK)
    marker_at = props.get('marker_at', 0.07)
    fill = marker_at * ease_out((tau - 0.9) / 0.7)
    if fill > 0:
        draw.rectangle([left, track_y, left + (right - left) * fill, track_y + thickness], fill=BLUE)
    for text, x, anchor_right in ((props['start'], left, False), (props['end'], right, True)):
        layer = cached_text(text.upper(), 'mono', box.u(18), 500, MUTED, 0.12)
        alpha = appear(tau, 0.5)
        put(canvas, with_alpha(layer, alpha), (round(x - layer.width) if anchor_right else x, track_y + box.u(34)))
    marker_progress = appear(tau, 1.6)
    if marker_progress > 0:
        mx = left + (right - left) * marker_at
        size = box.u(16)
        draw.polygon([(mx - size, track_y - box.u(30)), (mx + size, track_y - box.u(30)), (mx, track_y - box.u(8))], fill=INK)
        label = cached_text(props['marker'], 'geist', box.u(40), 600, INK, -0.02)
        put(canvas, with_alpha(label, marker_progress),
            (round(mx - box.u(14)), track_y - box.u(30) - label.height - box.u(10) + round((1 - marker_progress) * box.u(20))))
        quit_label = cached_text(props.get('marker_label', 'YOU ARE HERE'), 'mono', box.u(16), 500, BLUE, 0.12)
        put(canvas, with_alpha(quit_label, appear(tau, 2.1)),
            (round(mx - box.u(14)), track_y - box.u(30) - label.height - box.u(18) - quit_label.height))


def draw_prompt(canvas, box, props, tau, times, length):
    y = eyebrow(canvas, box, props['eyebrow'], tau)
    draw = ImageDraw.Draw(canvas)
    size = box.u(40)
    font = geist(size, 500)
    width = box.content_width
    lines = wrap_words(props['prompt'], 'geist', size, 500, -0.01, width - box.u(64))
    card_h = box.u(70) + round(size * 1.25) * len(lines) + box.u(30)
    reply_h = box.u(110)
    top = y + (box.height - box.margin - y - card_h - box.u(30) - reply_h) // 2
    progress = appear(tau, 0.3)
    if progress <= 0:
        return
    offset = round((1 - progress) * box.u(30))
    draw.rounded_rectangle([box.margin, top + offset, box.margin + width, top + offset + card_h], box.u(10), fill=PAPER,
                           outline=SAND_300, width=max(1, box.u(2)))
    put(canvas, cached_text(props.get('label', 'ASK AI'), 'mono', box.u(15), 500, MUTED, 0.12), (box.margin + box.u(32), top + offset + box.u(26)))
    typed_chars = int(max(0.0, tau - 0.7) * 24)
    remaining = typed_chars
    line_y = top + offset + box.u(62)
    caret = None
    for line in lines:
        shown = line[:max(0, remaining)]
        remaining -= len(line) + 1
        if shown:
            draw.text((box.margin + box.u(32), line_y + size), shown, font=font, fill=INK, anchor='ls')
        if 0 <= len(shown) < len(line) and caret is None:
            caret = (box.margin + box.u(32) + font.getlength(shown) + box.u(4), line_y)
        line_y += round(size * 1.25)
    if caret is None:
        caret = (box.margin + box.u(32) + font.getlength(lines[-1]) + box.u(4), line_y - round(size * 1.25))
    if int(tau * 2.2) % 2 == 0:
        draw.rectangle([caret[0], caret[1] + size * 0.15, caret[0] + box.u(3), caret[1] + size * 1.05], fill=BLUE)
    done_at = 0.7 + len(props['prompt']) / 24 + 0.35
    reply_progress = appear(tau, done_at)
    if reply_progress > 0:
        surface = canvas.getpixel((2, 2))[:3]
        layer = notch_block(width, reply_h, SAND_BLOCK, surface, props.get('reply_label', 'AI · ANSWERING'), props['reply'], box.unit * 1.15, BLUE, INK, False)
        put(canvas, with_alpha(layer, reply_progress),
            (box.margin, top + card_h + box.u(30) + round((1 - reply_progress) * box.u(24))))


def draw_eventlog(canvas, box, props, tau, times, length):
    y = eyebrow(canvas, box, props['eyebrow'], tau, colour=SKY)
    draw = ImageDraw.Draw(canvas)
    lines = props['lines']
    size = box.u(26)
    font = mono(size, 500)
    row = round(size * 2.4)
    top = y + (box.height - box.margin - y - row * len(lines)) // 2
    while text_width(lines[0]['text'], font, 0) > box.content_width and size > 14:
        size -= 1
        font = mono(size, 500)
    for index, line in enumerate(lines):
        start = item_time(line, times, index, base=0.4, step=0.6)
        if tau < start:
            continue
        line_y = top + index * row
        draw.line([box.margin, line_y, box.width - box.margin, line_y], fill=INK_RULE, width=max(1, box.u(1.5)))
        typed = line['text'][:int((tau - start) * 45)]
        head, _, tail = typed.partition('·')
        x = draw_tracked(draw, box.margin, line_y + row * 0.62, head, font, SKY, 0)
        if _:
            draw_tracked(draw, x, line_y + row * 0.62, '·' + tail, font, PAPER, 0)
        if len(typed) < len(line['text']) and int(tau * 3) % 2 == 0:
            cursor_x = box.margin + text_width(typed, font, 0) + box.u(4)
            draw.rectangle([cursor_x, line_y + row * 0.62 - size * 0.8, cursor_x + size * 0.55, line_y + row * 0.62 + size * 0.1], fill=SKY)


DRAWERS = {
    'browser': draw_browser,
    'rows': draw_rows,
    'numbered': lambda canvas, box, props, tau, times, length: draw_rows(canvas, box, props, tau, times, length, numbered=True),
    'flow': draw_flow,
    'blocks': draw_blocks,
    'statement': draw_statement,
    'progress': draw_progress,
    'prompt': draw_prompt,
    'eventlog': draw_eventlog,
}


def render_panel(kind, props, times, width, height, tau, length, inset_top=0):
    """Draws one explainer frame. `tau` is seconds since the event started; `times` maps item phrases to tau."""
    if kind not in DRAWERS:
        raise ValueError(f"Unknown explainer kind '{kind}'. Use one of: {', '.join(sorted(DRAWERS))}")
    canvas = Image.new('RGBA', (width, height), BACKGROUND.get(kind, PAGE) + (255,))
    DRAWERS[kind](canvas, Box(width, height, inset_top), props, tau, times, length)
    return canvas
