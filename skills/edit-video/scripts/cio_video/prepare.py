"""Clip windows, pause trimming and noise removal. Produces work/<clip>/trimmed.mov plus a timed transcript."""
import hashlib
import json
import os
import re
import subprocess
import urllib.request

from . import brand, transcript

MODEL_URL = 'https://raw.githubusercontent.com/richardpl/arnndn-models/master/sh.rnnn'


def run(command):
    result = subprocess.run(command, capture_output=True, text=True)
    if result.returncode != 0:
        raise RuntimeError(f"{' '.join(command[:6])}…\n{result.stderr[-2500:]}")
    return result


def denoise_model():
    """RNNoise 'sh' model (speech recorded in noisy rooms) from the public arnndn-models repo."""
    path = os.path.join(brand.CACHE_DIR, 'models', 'sh.rnnn')
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        urllib.request.urlretrieve(MODEL_URL, path)
    return path


def denoise_filter():
    return f'arnndn=m={denoise_model()},afftdn=nf=-35'


def master_filter(loudness):
    return ('highpass=f=80,lowpass=f=14000,acompressor=threshold=-22dB:ratio=3:attack=5:release=120:makeup=2,'
            f'loudnorm=I={loudness}:TP=-1.5:LRA=9')


def resolve_window(project, clip, words):
    """Sets clip['start'] and clip['end'] in source seconds from seconds, a pre-cut file, or phrases."""
    offsets_path = os.path.join(project.work, 'offsets.json')
    offsets = json.load(open(offsets_path)) if os.path.exists(offsets_path) else {}
    if 'start' not in clip and clip.get('file'):
        if clip['id'] not in offsets:
            offset, score = transcript.align_clip_file(project.source, clip['file'], project.work)
            if score < 0.6:
                raise RuntimeError(f"Could not align {clip['file']} (score {score:.2f}); set 'start' by hand")
            offsets[clip['id']] = round(offset, 3)
            json.dump(offsets, open(offsets_path, 'w'), indent=1)
        clip['start'] = offsets[clip['id']] + clip.get('trim_start', 0.0)
    if 'start' not in clip and clip.get('start_phrase'):
        start, _ = transcript.find_source_phrase(words, clip['start_phrase'], clip.get('search_from', 0.0))
        if start is None:
            raise RuntimeError(f"start_phrase not found for {clip['id']}: {clip['start_phrase']}")
        clip['start'] = start - 0.1
    if 'end' not in clip and clip.get('end_phrase'):
        _, last = transcript.find_source_phrase(words, clip['end_phrase'], clip['start'])
        if last is None:
            raise RuntimeError(f"end_phrase not found for {clip['id']}: {clip['end_phrase']}")
        clip['end'] = last + 0.05
    if 'end' not in clip and clip.get('duration'):
        clip['end'] = clip['start'] + clip['duration']
    if 'start' not in clip or 'end' not in clip:
        raise RuntimeError(f"Clip {clip['id']} needs start/end, file, or start_phrase/end_phrase")


def detect_pauses(source, seek, duration, threshold_db, minimum):
    result = subprocess.run(['ffmpeg', '-hide_banner', '-ss', f'{seek:.3f}', '-t', f'{duration:.3f}', '-i', source, '-vn',
                             '-af', f'silencedetect=noise={threshold_db}dB:d={minimum}', '-f', 'null', '-'],
                            capture_output=True, text=True)
    starts = [float(v) for v in re.findall(r'silence_start: (-?[\d.]+)', result.stderr)]
    ends = [float(v) for v in re.findall(r'silence_end: ([\d.]+)', result.stderr)]
    return list(zip(starts, ends))


def plan_cuts(pauses, tokens, duration, pad_before, pad_after):
    """Removed [start, end) ranges inside silences, never covering a word start."""
    word_starts = [t for t, _ in tokens]
    removed = []
    for silence_start, silence_end in pauses:
        cut_start = max(0.0, silence_start + pad_before)
        cut_end = min(duration, silence_end - pad_after)
        inside = [t for t in word_starts if cut_start - 0.05 < t < cut_end + 0.05]
        if inside:
            cut_end = min(cut_end, inside[0] - 0.12)
        if cut_end - cut_start >= 0.2:
            removed.append((round(cut_start, 3), round(cut_end, 3)))
    return removed


def keep_segments(removed, duration):
    segments, cursor = [], 0.0
    for start, end in removed:
        if start > cursor:
            segments.append((cursor, start))
        cursor = end
    if duration > cursor:
        segments.append((cursor, duration))
    return segments


def remap(t, removed):
    shift = 0.0
    for start, end in removed:
        if t >= end:
            shift += end - start
        elif t > start:
            shift += t - start
    return t - shift


def write_trimmed(source, seek, duration, segments, denoise, fps, path):
    """Two passes: clean audio to WAV, then select/aselect the kept segments (no split branches, which buffer frames)."""
    clean_audio = path.rsplit('.', 1)[0] + '-clean.wav'
    audio_filter = ['-af', denoise_filter()] if denoise else []
    run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{seek:.3f}', '-t', f'{duration:.3f}', '-i', source, '-vn', *audio_filter,
         '-ar', '48000', '-c:a', 'pcm_s16le', clean_audio])
    keep = '+'.join(f'between(t,{start:.3f},{end:.3f})' for start, end in segments)
    graph = (f"[0:v]fps={fps},scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,"
             f"setsar=1,select='{keep}',setpts=N/FRAME_RATE/TB[v];[1:a]aselect='{keep}',asetpts=N/SR/TB[a]")
    run(['ffmpeg', '-y', '-v', 'error', '-ss', f'{seek:.3f}', '-t', f'{duration:.3f}', '-i', source, '-i', clean_audio,
         '-filter_complex', graph, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-crf', '14', '-preset', 'fast',
         '-r', str(fps), '-c:a', 'pcm_s16le', path])


def prepare(project, clip):
    """Returns the clip timeline: tokens, duration, cuts and the trimmed source path. Cached per settings."""
    words = transcript.load_words(project.transcript, project.work)
    resolve_window(project, clip, words)
    clip.setdefault('drop_words', project.data['drop_words'])
    tokens, raw_duration = transcript.clip_words(words, clip)
    audio = project.audio
    work = project.clip_work(clip)
    fingerprint = hashlib.sha1(json.dumps([clip['start'], clip['end'], audio], sort_keys=True).encode()).hexdigest()[:12]
    cache_path = os.path.join(work, 'timeline.json')
    trimmed = os.path.join(work, 'trimmed.mov')
    if os.path.exists(cache_path) and os.path.exists(trimmed):
        cached = json.load(open(cache_path))
        if cached['fingerprint'] == fingerprint:
            removed = [tuple(item) for item in cached['removed']]
            return timeline_info(clip, tokens, raw_duration, removed, trimmed)
    removed = []
    if audio['trim_pauses']:
        pauses = detect_pauses(project.source, clip['start'], raw_duration, audio['pause_db'], audio['pause_min'])
        removed = plan_cuts(pauses, tokens, raw_duration, audio['pad_before'], audio['pad_after'])
    write_trimmed(project.source, clip['start'], raw_duration, keep_segments(removed, raw_duration), audio['denoise'],
                  project.fps, trimmed)
    json.dump({'fingerprint': fingerprint, 'removed': removed}, open(cache_path, 'w'))
    return timeline_info(clip, tokens, raw_duration, removed, trimmed)


def timeline_info(clip, tokens, raw_duration, removed, trimmed):
    return {
        'tokens': [(round(remap(t, removed), 3), w) for t, w in tokens],
        'duration': remap(raw_duration, removed),
        'raw_duration': raw_duration,
        'cuts': [remap(start, removed) for start, _ in removed],
        'removed': removed,
        'trimmed': trimmed,
    }


def mix_audio(trimmed, hook, duration, total, loudness, out_path):
    """Hook (optional) + main audio, mastered, faded out at the end and padded to `total`."""
    lead = 0.0 if hook is None else hook['end'] - hook['start']
    parts, labels = [], []
    if hook:
        parts.append(f"[0:a]atrim={hook['start']:.3f}:{hook['end']:.3f},asetpts=PTS-STARTPTS,"
                     f"afade=t=in:d=0.02,afade=t=out:st={max(0.0, lead - 0.06):.3f}:d=0.06[h];")
        labels.append('[h]')
    parts.append('[0:a]asetpts=PTS-STARTPTS,afade=t=in:d=0.03[m];')
    labels.append('[m]')
    graph = (''.join(parts) + ''.join(labels) + f'concat=n={len(labels)}:v=0:a=1,{master_filter(loudness)},'
             f'afade=t=out:st={lead + duration - 0.6:.3f}:d=0.6,apad=whole_dur={total:.3f}[a]')
    run(['ffmpeg', '-y', '-v', 'error', '-i', trimmed, '-filter_complex', graph, '-map', '[a]', '-ar', '48000',
         '-c:a', 'pcm_s16le', out_path])
    return lead
