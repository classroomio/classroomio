"""Frame-by-frame compositor: video, explainer panels (split / full), captions, hook pre-roll, sign-off crossfade."""
import json
import os
import subprocess

from PIL import Image, ImageDraw

from . import brand, captions, config, prepare, signoff, timeline, visuals

TRANSITION = 0.45
FLASH = 0.14
LANDSCAPE = (1920, 1080)
VERTICAL = (1080, 1920)
FULL_PANEL_HEIGHT_16X9 = 860
SPLIT_PANEL_HEIGHT_9X16 = 820
FULL_PANEL_HEIGHT_9X16 = 1440
SAFE_TOP_9X16 = 120


def frame_reader(path, size, fps, seek=None, duration=None):
    command = ['ffmpeg', '-v', 'error']
    if seek is not None:
        command += ['-ss', f'{seek:.3f}']
    if duration is not None:
        command += ['-t', f'{duration:.3f}']
    command += ['-i', path, '-vf', f'fps={fps},scale={size[0]}:{size[1]}', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    process = subprocess.Popen(command, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL)
    frame_bytes = size[0] * size[1] * 3
    try:
        while True:
            data = process.stdout.read(frame_bytes)
            if len(data) < frame_bytes:
                break
            yield Image.frombuffer('RGB', size, data, 'raw', 'RGB', 0, 1)
    finally:
        process.stdout.close()
        process.wait()


def start_encoder(size, fps, audio, out_path):
    return subprocess.Popen(['ffmpeg', '-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{size[0]}x{size[1]}',
                             '-r', str(fps), '-i', '-', '-i', audio, '-map', '0:v', '-map', '1:a', '-c:v', 'libx264',
                             '-crf', '18', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k',
                             '-shortest', '-movflags', '+faststart', out_path], stdin=subprocess.PIPE)


def finish(encoder, size, fps, sign_off, last_frame):
    """Crossfades into the sign-off over 0.5s, then plays it; without a sign-off, holds 0.5s and stops."""
    if sign_off:
        fade_frames = round(0.5 * fps)
        for index, frame in enumerate(frame_reader(sign_off, size, fps)):
            if index < fade_frames:
                frame = Image.blend(last_frame, frame, (index + 1) / fade_frames)
            encoder.stdin.write(frame.tobytes())
            if index >= round(4.5 * fps):
                break
    else:
        for _ in range(round(0.5 * fps)):
            encoder.stdin.write(last_frame.tobytes())
    encoder.stdin.close()
    encoder.wait()


def event_state(events, t):
    """(event, s) where s ∈ [0, 1] is how far the layout has moved into the event's mode."""
    for event in events:
        if event['start'] <= t < event['end'] + TRANSITION:
            entering = visuals.ease_in_out((t - event['start']) / TRANSITION)
            leaving = visuals.ease_in_out((event['end'] + TRANSITION - t) / TRANSITION)
            return event, min(entering, leaving)
    return None, 0.0


def lerp(a, b, s):
    return a + (b - a) * s


def panel(event, width, height, t, inset=0):
    spec = event['spec']
    return visuals.render_panel(spec['kind'], spec['props'], event['item_times'], width, height, t - event['start'],
                                event['end'] - event['start'], inset).convert('RGB')


def title_card(project, clip):
    """Top-left ink card with the series eyebrow and clip title, shown for the first ~5s of landscape cuts."""
    image = Image.new('RGBA', LANDSCAPE, (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)
    lines, head, tracking = brand.fit_lines(clip['title'], 860, 3, 64)
    pad, line_height = 36, 64
    width = max(brand.text_width(line, head, tracking) for line in lines)
    height = 18 + 28 + line_height * len(lines) + 4
    draw.rectangle((80, 80, 80 + width + pad * 2, 80 + height + pad * 2), fill=brand.INK + (235,))
    eyebrow = project.series if project.series.startswith('CLASSROOMIO') else f'CLASSROOMIO · {project.series}'
    brand.draw_tracked(draw, 80 + pad, 80 + pad + 16, eyebrow, brand.mono(18), brand.SKY, 18 * 0.12)
    for number, line in enumerate(lines):
        brand.draw_tracked(draw, 80 + pad, 80 + pad + 46 + line_height * number + 50, line, head, brand.PAPER, tracking)
    draw.rectangle((80, 80 + height + pad * 2, 80 + width + pad * 2, 80 + height + pad * 2 + 6), fill=brand.BLUE + (255,))
    return image


def vertical_background(project, clip):
    image = Image.new('RGB', VERTICAL, brand.INK)
    draw = ImageDraw.Draw(image)
    mark = brand.logo(40)
    image.paste(mark, (80, 130), mark)
    brand.draw_tracked(draw, 80, 236, project.series, brand.mono(24), brand.SKY, 24 * 0.12)
    lines, head, tracking = brand.fit_lines(clip['title'], 920, 3, 76)
    for number, line in enumerate(lines):
        brand.draw_tracked(draw, 80, 270 + head.size * 0.95 + head.size * 0.98 * number, line, head, brand.PAPER, tracking)
    brand.draw_tracked(draw, 80, 1830, project.data['url'], brand.mono(22), brand.MUTED_ON_INK, 22 * 0.12)
    return image


def split_video_16x9(frame, framing, s):
    """Left-half video during a split: crops around the speaker, or fits the whole screen for recordings."""
    width = round(lerp(1920, 960, s))
    if framing['split'] == 'fit':
        scale = lerp(1.0, 0.5, s)
        shrunk = frame.resize((round(1920 * scale), round(1080 * scale)), Image.BILINEAR)
        holder = Image.new('RGB', (width, 1080), brand.INK)
        holder.paste(shrunk, ((width - shrunk.width) // 2, (1080 - shrunk.height) // 2))
        return holder
    offset = round(lerp(0, max(0, min(960, framing['cx'] * 1920 - 960 * 0.42)), s))
    return frame.crop((offset, 0, offset + width, 1080))


def compose_landscape(project, clip, info, events, sign_off, out_path):
    fps = project.fps
    framing = clip['framing']
    tokens, duration = info['tokens'], info['duration']
    zooms = timeline.zoom_windows(tokens, duration, info['cuts']) if framing['zoom'] else []
    zoom_x = max(0, min(384, framing['cx'] * 2304 - 960))
    show_title = not events or events[0]['start'] > 5.2
    card = title_card(project, clip)
    bug = brand.logo(34)
    caption_track = captions.Captions(tokens, duration, captions.LANDSCAPE)
    total = duration + (4.5 if sign_off else 0.5)
    audio = os.path.join(project.clip_work(clip), 'audio-16x9.wav')
    prepare.mix_audio(info['trimmed'], None, duration, total, project.audio['loudness'], audio)
    encoder = start_encoder(LANDSCAPE, fps, audio, out_path)
    canvas = None
    for index, frame in enumerate(frame_reader(info['trimmed'], LANDSCAPE, fps)):
        t = index / fps
        event, s = event_state(events, t)
        base = Image.new('RGB', LANDSCAPE, brand.PAGE)
        if event is None or s <= 0:
            if any(a <= t < b for a, b in zooms):
                frame = frame.crop((zoom_x / 1.2, 86 / 1.2, zoom_x / 1.2 + 1600, 86 / 1.2 + 900)).resize(LANDSCAPE, Image.BILINEAR)
            base.paste(frame, (0, 0))
        elif event['spec']['mode']['16x9'] == 'split':
            video = split_video_16x9(frame, framing, s)
            base.paste(video, (0, 0))
            base.paste(panel(event, 960, 1080, t).crop((0, 0, 1920 - video.width, 1080)), (video.width, 0))
        else:
            panel_x = round(lerp(1920, 0, s))
            base.paste(frame, (round(-lerp(0, 640, s)), 0))
            full = Image.new('RGB', LANDSCAPE, visuals.BACKGROUND.get(event['spec']['kind'], brand.PAGE))
            full.paste(panel(event, 1920, FULL_PANEL_HEIGHT_16X9, t), (0, 0))
            base.paste(full.crop((0, 0, 1920 - panel_x, 1080)), (panel_x, 0))
        canvas = base.convert('RGBA')
        if show_title and t < 5.0:
            alpha = min(visuals.ease_out((t - 0.2) / 0.35), visuals.ease_out((4.75 - t) / 0.35))
            if alpha > 0:
                visuals.put(canvas, visuals.with_alpha(card, alpha), (0, round(24 * (1 - visuals.ease_out((t - 0.2) / 0.35)))))
        if s < 0.98:
            visuals.put(canvas, visuals.with_alpha(bug, 0.9 * (1 - s)), (1920 - bug.width - 80, 84))
        caption = caption_track.layer(t)
        if caption:
            visuals.put(canvas, *caption)
        canvas = canvas.convert('RGB')
        encoder.stdin.write(canvas.tobytes())
    finish(encoder, LANDSCAPE, fps, sign_off, canvas)
    return total


def hook_layers(hook):
    gradient = Image.new('RGBA', VERTICAL, (0, 0, 0, 0))
    draw = ImageDraw.Draw(gradient)
    for y in range(900, VERTICAL[1]):
        draw.line([0, y, VERTICAL[0], y], fill=brand.INK + (int(235 * min(1, (y - 900) / 520)),))
    font = brand.geist(88, 700)
    tracking = -88 * 0.04
    words = [w for _, w in hook['words']]
    lines = brand.wrap(words, font, tracking, 920)
    layers = []
    for active in range(len(words)):
        layer = gradient.copy()
        draw = ImageDraw.Draw(layer)
        top = 1660 - 92 * len(lines)
        index = 0
        for number, line in enumerate(lines):
            x = 80
            for word in line:
                colour = brand.SKY if index == active else brand.PAPER
                x = brand.draw_tracked(draw, x, top + 92 * number + 80, word, font, colour, tracking) + font.getlength(' ')
                index += 1
        layers.append(layer)
    return layers


def write_hook(encoder, info, hook, framing, fps):
    lead = hook['end'] - hook['start']
    layers = hook_layers(hook)
    word_times = [t - hook['start'] for t, _ in hook['words']]
    crop_width = 608
    crop_x = max(0, min(1920 - crop_width, framing['cx'] * 1920 - crop_width * 0.45))
    for index, frame in enumerate(frame_reader(info['trimmed'], LANDSCAPE, fps, hook['start'], lead)):
        t = index / fps
        scale = 1.0 + 0.04 * t / max(lead, 0.1)
        width, height = crop_width / scale, 1080 / scale
        left = crop_x + (crop_width - width) / 2
        top = (1080 - height) * 0.35
        canvas = frame.crop((left, top, left + width, top + height)).resize(VERTICAL, Image.BICUBIC).convert('RGBA')
        canvas.alpha_composite(layers[max(0, sum(1 for start in word_times if start <= t) - 1)])
        flash = visuals.ease_out((t - (lead - FLASH)) / FLASH)
        if flash > 0:
            canvas.alpha_composite(Image.new('RGBA', VERTICAL, brand.PAGE + (int(230 * flash),)))
        encoder.stdin.write(canvas.convert('RGB').tobytes())


def compose_vertical(project, clip, info, events, hook, sign_off, out_path):
    fps = project.fps
    framing = clip['framing']
    tokens, duration = info['tokens'], info['duration']
    zooms = timeline.zoom_windows(tokens, duration, info['cuts']) if framing['zoom'] else []
    background = vertical_background(project, clip)
    caption_track = captions.Captions(tokens, duration, captions.VERTICAL)
    lead = 0.0 if hook is None else hook['end'] - hook['start']
    total = lead + duration + (4.5 if sign_off else 0.5)
    audio = os.path.join(project.clip_work(clip), 'audio-9x16.wav')
    prepare.mix_audio(info['trimmed'], hook, duration, total, project.audio['loudness'], audio)
    encoder = start_encoder(VERTICAL, fps, audio, out_path)
    if hook:
        write_hook(encoder, info, hook, framing, fps)

    vx = framing['vx']
    if framing['vertical_crop'] == '16:9':
        normal_crop, normal_dest = (0, 0, 1920, 1080), (0, 640, 1080, 608)
    else:
        normal_crop, normal_dest = (vx, 0, 1440, 1080), (0, 560, 1080, 810)
    split_crop, split_dest = (vx, 135, 1440, 810), (0, 820, 1080, 608)
    if framing['split'] == 'fit':
        split_crop = (0, 0, 1920, 1080)
    canvas = None
    for index, frame in enumerate(frame_reader(info['trimmed'], LANDSCAPE, fps)):
        t = index / fps
        event, s = event_state(events, t)
        base = background.copy()
        mode = event['spec']['mode']['9x16'] if event else None
        layout = s if mode == 'split' else 0.0
        crop_x, crop_y, crop_w, crop_h = [lerp(a, b, layout) for a, b in zip(normal_crop, split_crop)]
        dest_x, dest_y, dest_w, dest_h = [round(lerp(a, b, layout)) for a, b in zip(normal_dest, split_dest)]
        if event is None and any(a <= t < b for a, b in zooms):
            crop_x, crop_y, crop_w, crop_h = crop_x + crop_w * 0.028, crop_h * 0.056, crop_w / 1.2, crop_h / 1.2
        base.paste(frame.crop((crop_x, crop_y, crop_x + crop_w, crop_y + crop_h)).resize((dest_w, dest_h), Image.BILINEAR),
                   (dest_x, dest_y))
        bar_y = dest_y + dest_h
        if mode:
            height = SPLIT_PANEL_HEIGHT_9X16 if mode == 'split' else FULL_PANEL_HEIGHT_9X16
            panel_y = round(lerp(-height, 0, s))
            content = panel(event, 1080, height, t, SAFE_TOP_9X16)
            base.paste(content.crop((0, max(0, -panel_y), 1080, height)), (0, max(0, panel_y)))
            if mode == 'full':
                bar_y = max(bar_y, panel_y + height)
        ImageDraw.Draw(base).rectangle([0, bar_y, round(1080 * min(1.0, t / duration)), bar_y + 8], fill=brand.BLUE)
        canvas = base.convert('RGBA')
        if hook and t < FLASH:
            canvas.alpha_composite(Image.new('RGBA', VERTICAL, brand.PAGE + (int(230 * (1 - t / FLASH)),)))
        caption = caption_track.layer(t)
        if caption:
            image, (x, y) = caption
            visuals.put(canvas, image, (x, y + captions.VERTICAL['top']))
        canvas = canvas.convert('RGB')
        encoder.stdin.write(canvas.tobytes())
    finish(encoder, VERTICAL, fps, sign_off, canvas)
    return lead, total


def render_clip(project, clip, formats, out_dir=None, warn=print):
    """Renders the requested formats for one clip and writes work/<clip>/meta.json for captions, QA and the guide."""
    info = prepare.prepare(project, clip)
    events = timeline.resolve_events(clip, info['tokens'], info['duration'], warn)
    sign_offs = signoff.ensure(project) if project.sign_off.get('enabled', True) else {}
    out_dir = out_dir or project.output
    os.makedirs(out_dir, exist_ok=True)
    meta_path = os.path.join(project.clip_work(clip), 'meta.json')
    meta = json.load(open(meta_path)) if os.path.exists(meta_path) else {}
    meta.update({'id': clip['id'], 'title': clip['title'], 'video_duration': info['duration'],
                 'raw_duration': info['raw_duration'], 'cuts': len(info['removed']), 'tokens': info['tokens'],
                 'events': [{'kind': e['spec']['kind'], 'trigger': e['spec']['trigger'], 'start': round(e['start'], 2),
                             'end': round(e['end'], 2), 'mode': e['spec']['mode']} for e in events]})
    if '16x9' in formats:
        meta['duration_16x9'] = round(compose_landscape(project, clip, info, events, sign_offs.get('16x9'),
                                                        os.path.join(out_dir, f"{clip['id']}-16x9.mp4")), 2)
    if '9x16' in formats:
        hook = timeline.resolve_hook(clip, info['tokens'], info['duration'], warn)
        lead, total = compose_vertical(project, clip, info, events, hook, sign_offs.get('9x16'),
                                       os.path.join(out_dir, f"{clip['id']}-9x16.mp4"))
        meta['hook'] = None if hook is None else {'start': round(hook['start'], 3), 'end': round(hook['end'], 3),
                                                  'text': ' '.join(w for _, w in hook['words'])}
        meta['hook_lead'] = round(lead, 3)
        meta['duration_9x16'] = round(total, 2)
    json.dump(meta, open(meta_path, 'w'))
    return meta


def render_by_id(project_path, clip_id, formats, out_dir=None):
    """Process-pool entry point: loads the project fresh and renders one clip."""
    project = config.Project(project_path)
    clip = project.select([clip_id])[0]
    meta = render_clip(project, clip, formats, out_dir)
    return clip_id, meta.get('duration_16x9'), meta.get('duration_9x16')
