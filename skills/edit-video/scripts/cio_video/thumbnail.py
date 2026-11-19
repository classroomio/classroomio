"""1280x720 YouTube thumbnail from the design system's 'Pain' launch frame: ink copy column, photo right, colour rows."""
import os
import subprocess

from PIL import Image, ImageDraw

from . import brand


def still(trimmed, at, path):
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{at:.2f}', '-i', trimmed, '-frames:v', '1', path], check=True)
    return path


def render(project, clip, trimmed, duration, out_path):
    settings = clip.get('thumbnail_frame', {})
    frame = Image.open(still(trimmed, settings.get('time', min(8.0, duration / 3)), out_path + '.still.jpg')).convert('RGB')
    image = Image.new('RGB', (1280, 720), brand.INK)
    draw = ImageDraw.Draw(image)
    photo_width = 520
    crop_height = frame.height * 0.82
    crop_width = crop_height * photo_width / 720
    left = max(0, min(frame.width - crop_width, clip['framing']['cx'] * frame.width - crop_width * 0.42))
    top = frame.height * settings.get('top', 0.08)
    photo = frame.crop((left, top, left + crop_width, top + crop_height)).resize((photo_width, 720), Image.LANCZOS)
    image.paste(photo, (1280 - photo_width, 0))
    brand.draw_tracked(draw, 72, 96, project.series, brand.mono(18), brand.SKY, 18 * 0.12)
    lines, head, tracking = brand.fit_lines(clip['thumbnail'], 1280 - photo_width - 144, 4, 96, tracking_em=-0.05, step=6)
    for number, line in enumerate(lines):
        brand.draw_tracked(draw, 72, 140 + head.size * 0.95 + head.size * 0.98 * number, line, head, brand.PAPER, tracking)
    mark = brand.logo(34)
    image.paste(mark, (72, 720 - 72 - 34), mark)
    rows = [(brand.SKY, brand.INK, f"EP {clip['number']:02d}", project.data['thumbnail']['label']),
            (brand.BLUE, brand.WHITE, 'CLASSROOMIO', project.data['thumbnail']['url'])]
    for number, (bg, fg, left_label, right_label) in enumerate(rows):
        y0 = 720 - 58 * (len(rows) - number)
        draw.rectangle((1280 - photo_width, y0, 1280, y0 + 58), fill=bg)
        brand.draw_tracked(draw, 1280 - photo_width + 24, y0 + 37, left_label, brand.mono(16), fg, 16 * 0.08)
        draw.text((1280 - 24, y0 + 37), right_label, font=brand.geist(19, 600), fill=fg, anchor='rs')
    image.save(out_path)
    os.remove(out_path + '.still.jpg')
    return out_path
