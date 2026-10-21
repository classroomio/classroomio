"""Checks rendered clips: contact sheets of every explainer and hook, loudness, and caption-to-speech sync."""
import json
import os
import re
import subprocess

from PIL import Image

from . import transcript


def grab(path, t, width, out):
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{max(0.0, t):.2f}', '-i', path, '-frames:v', '1', '-vf',
                    f'scale={width}:-1', out], check=True)
    return Image.open(out).copy()


def loudness(path):
    result = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'ebur128', '-f', 'null', '-'],
                            capture_output=True, text=True)
    match = re.search(r'Integrated loudness:\s+I:\s+(-?[\d.]+) LUFS', result.stderr)
    return float(match.group(1)) if match else None


def duration(path):
    result = subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                            capture_output=True, text=True)
    return float(result.stdout.strip() or 0)


def speech_at_words(path, tokens, offset, threshold_db=-45.0):
    """Fraction of word starts that land on audible speech in the rendered file."""
    import numpy as np
    audio = transcript.pcm(path, 8000)
    hits = 0
    for t, _ in tokens:
        start = int((t + offset) * 8000)
        segment = audio[start:start + 2000]
        if len(segment) == 0:
            continue
        level = 20 * np.log10(np.sqrt(np.mean(segment ** 2)) + 1e-9) - 90.3
        hits += level > threshold_db
    return hits / max(1, len(tokens))


def contact_sheet(project, clip, fmt, out_path):
    meta = json.load(open(os.path.join(project.clip_work(clip), 'meta.json')))
    path = os.path.join(project.output, f"{clip['id']}-{fmt}.mp4")
    lead = meta.get('hook_lead', 0.0) if fmt == '9x16' else 0.0
    width = 240 if fmt == '9x16' else 480
    times = []
    if fmt == '9x16' and meta.get('hook'):
        times.append(lead * 0.6)
    for event in meta['events']:
        length = min(event['end'], meta['video_duration']) - event['start']
        times += [lead + event['start'] + 0.25, lead + event['start'] + length * 0.75]
    times.append(lead + meta['video_duration'] + 2.5)
    tmp = out_path + '.tmp.png'
    tiles = [grab(path, t, width, tmp) for t in times]
    os.remove(tmp)
    columns = min(6, len(tiles))
    rows = (len(tiles) + columns - 1) // columns
    w, h = tiles[0].size
    sheet = Image.new('RGB', (columns * (w + 4), rows * (h + 4)), (60, 60, 60))
    for index, tile in enumerate(tiles):
        sheet.paste(tile, ((index % columns) * (w + 4), (index // columns) * (h + 4)))
    sheet.save(out_path)
    return out_path


def check(project, clips, formats):
    """Returns report rows and writes contact sheets to work/qa/."""
    folder = os.path.join(project.work, 'qa')
    os.makedirs(folder, exist_ok=True)
    report = []
    for clip in clips:
        meta_path = os.path.join(project.clip_work(clip), 'meta.json')
        if not os.path.exists(meta_path):
            report.append({'clip': clip['id'], 'error': 'not rendered'})
            continue
        meta = json.load(open(meta_path))
        for fmt in formats:
            path = os.path.join(project.output, f"{clip['id']}-{fmt}.mp4")
            if not os.path.exists(path):
                continue
            offset = meta.get('hook_lead', 0.0) if fmt == '9x16' else 0.0
            sync = speech_at_words(path, meta['tokens'], offset)
            report.append({'clip': clip['id'], 'format': fmt, 'duration': round(duration(path), 1),
                           'lufs': loudness(path), 'words_on_speech': round(sync, 2), 'cuts': meta['cuts'],
                           'sheet': contact_sheet(project, clip, fmt, os.path.join(folder, f"{clip['id']}-{fmt}.png"))})
    return report
