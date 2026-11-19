"""Word-timed transcripts: parsing, clip alignment and caption cleanup."""
import html
import json
import os
import re
import subprocess

PUNCTUATION = '.,?!;:'


def timestamp(value):
    value = value.replace(',', '.')
    parts = value.split(':')
    seconds = float(parts[-1])
    minutes = int(parts[-2]) if len(parts) > 1 else 0
    hours = int(parts[-3]) if len(parts) > 2 else 0
    return hours * 3600 + minutes * 60 + seconds


def spread(start, end, text):
    words = text.split()
    if not words:
        return []
    step = (end - start) / len(words)
    return [[round(start + step * index, 3), word] for index, word in enumerate(words)]


def parse_vtt(text):
    """YouTube auto-captions carry per-word <timestamps>; plain VTT cues are spread evenly across the cue."""
    words = []
    word_level = '<c>' in text
    for block in text.split('\n\n'):
        lines = block.strip('\n').split('\n')
        timing = [line for line in lines if '-->' in line]
        if not timing:
            continue
        start, end = timing[0].split(' --> ')
        start, end = timestamp(start.strip()), timestamp(end.strip().split()[0])
        if word_level:
            if end - start < 0.05 or not lines[-1].strip():
                continue
            cursor = start
            for index, part in enumerate(re.split(r'<(\d\d:\d\d:\d\d\.\d+)>', lines[-1])):
                if index % 2 == 1:
                    cursor = timestamp(part)
                    continue
                for word in clean_markup(part).split():
                    words.append([round(cursor, 3), word])
        else:
            body = ' '.join(clean_markup(line) for line in lines[lines.index(timing[0]) + 1:])
            words.extend(spread(start, end, body))
    return words


def clean_markup(text):
    return html.unescape(re.sub(r'</?c[^>]*>|<[^>]+>', '', text)).replace('>>', '').strip()


def parse_srt(text):
    words = []
    for block in re.split(r'\n\s*\n', text.strip()):
        lines = block.strip().split('\n')
        timing = [line for line in lines if '-->' in line]
        if not timing:
            continue
        start, end = (timestamp(part.strip()) for part in timing[0].split('-->'))
        body = ' '.join(clean_markup(line) for line in lines[lines.index(timing[0]) + 1:])
        words.extend(spread(start, end, body))
    return words


def load_words(path, cache_dir):
    """Returns [[seconds, word], ...] for the whole source, cached as JSON."""
    cache = os.path.join(cache_dir, 'words.json')
    if os.path.exists(cache) and os.path.getmtime(cache) >= os.path.getmtime(path):
        return json.load(open(cache))
    text = open(path, encoding='utf-8').read()
    if path.endswith('.json'):
        words = json.loads(text)
    elif path.endswith('.srt'):
        words = parse_srt(text)
    else:
        words = parse_vtt(text)
    words.sort(key=lambda item: item[0])
    json.dump(words, open(cache, 'w'))
    return words


def pcm(path, rate=4000, seek=None, duration=None):
    import numpy as np
    command = ['ffmpeg', '-v', 'error']
    if seek is not None:
        command += ['-ss', f'{seek:.3f}']
    if duration is not None:
        command += ['-t', f'{duration:.3f}']
    command += ['-i', path, '-vn', '-ac', '1', '-ar', str(rate), '-f', 's16le', '-']
    data = subprocess.run(command, capture_output=True, check=True).stdout
    return np.frombuffer(data, dtype=np.int16).astype(np.float32)


def align_clip_file(source, clip_file, cache_dir, rate=4000):
    """Finds where a pre-cut clip starts in the source by cross-correlating 10s of its audio. Returns (offset, score)."""
    import numpy as np
    source_cache = os.path.join(cache_dir, f'source-{rate}.npy')
    if os.path.exists(source_cache):
        source_audio = np.load(source_cache)
    else:
        source_audio = pcm(source, rate)
        np.save(source_cache, source_audio)
    snippet = pcm(clip_file, rate)[rate * 2:rate * 12]
    size = 1 << int(np.ceil(np.log2(len(source_audio) + len(snippet))))
    correlation = np.fft.irfft(np.fft.rfft(source_audio, size) * np.conj(np.fft.rfft(snippet, size)), size)[:len(source_audio)]
    index = int(np.argmax(correlation))
    window = source_audio[index:index + len(snippet)]
    score = float(correlation[index] / (np.linalg.norm(snippet) * np.linalg.norm(window) + 1e-9))
    return index / rate - 2.0, score


def core(word):
    return word.lower().strip(PUNCTUATION + '"“”‘’')


def trailing(word):
    match = re.search(r'[' + re.escape(PUNCTUATION) + r']+$', word)
    return match.group(0) if match else ''


def apply_phrases(tokens, phrases):
    if not phrases:
        return tokens
    patterns = sorted(((key.split(), value) for key, value in phrases.items()), key=lambda item: -len(item[0]))
    result, index = [], 0
    while index < len(tokens):
        for words, replacement in patterns:
            window = tokens[index:index + len(words)]
            if len(window) == len(words) and [core(w) for _, w in window] == words:
                result.append((window[0][0], replacement + trailing(window[-1][1])))
                index += len(words)
                break
        else:
            result.append(tokens[index])
            index += 1
    return result


def apply_corrections(word, corrections):
    stem = word.rstrip(PUNCTUATION)
    tail = word[len(stem):]
    for key in (stem, stem.lower()):
        if key in corrections:
            return corrections[key] + tail
    return word


def clip_words(words, clip):
    """Words inside a clip's source window, cleaned for captions. Returns (tokens relative to start, duration)."""
    start = clip['start']
    end = clip['end']
    raw = [(t, w) for t, w in words if start - 0.05 <= t < end]
    if not raw:
        raise ValueError(f"No transcript words between {start:.2f}s and {end:.2f}s for clip {clip['id']}")
    last = raw[-1][0]
    following = [t for t, _ in words if t > last + 0.01]
    next_start = following[0] if following else last + 1.0
    cut_end = min(next_start, last + 1.0) + 0.25

    drop = {core(word) for word in clip.get('drop_words', [])}
    tokens = [(t, w) for t, w in raw if core(w) not in drop]
    tokens = apply_phrases(tokens, clip['phrase_corrections'])
    cleaned = []
    for t, w in tokens:
        w = apply_corrections(w, clip['corrections'])
        if not w:
            continue
        if cleaned and core(cleaned[-1][1]) == core(w) and len(core(w)) > 1:
            continue
        for part in w.split(' '):
            cleaned.append((round(t - start, 3), part))
    cleaned[0] = (cleaned[0][0], cleaned[0][1][:1].upper() + cleaned[0][1][1:])
    if cleaned[-1][1][-1] not in '.?!':
        cleaned[-1] = (cleaned[-1][0], cleaned[-1][1].rstrip(',;:') + '.')
    return cleaned, cut_end - start


def find_phrase(tokens, phrase, after=0.0):
    """First occurrence of `phrase` starting at or after `after`. Returns (start_time, index_of_last_word)."""
    target = [core(w) for w in phrase.split() if core(w)]
    cores = [core(w) for _, w in tokens]
    for index in range(len(cores) - len(target) + 1):
        if tokens[index][0] + 0.001 < after:
            continue
        if cores[index:index + len(target)] == target:
            return tokens[index][0], index + len(target) - 1
    return None, None


def find_source_phrase(words, phrase, after=0.0):
    tokens = [(t, w) for t, w in words if t >= after]
    start, last = find_phrase(tokens, phrase, after)
    return (start, tokens[last][0]) if start is not None else (None, None)
