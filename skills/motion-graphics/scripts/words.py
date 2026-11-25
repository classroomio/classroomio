"""Turns whisper-cli word-level JSON (-ojf -ml 1 -sow) into words.tsv (start, end, word) and a readable words.txt.

Usage: words.py <transcript.json> <outDir>
words.txt reads like "12.77 again 13.10 and 13.22 again", so cue timings can be copied straight from it.
"""
import json
import sys
from pathlib import Path

source, out = Path(sys.argv[1]), Path(sys.argv[2])
data = json.loads(source.read_text(errors='replace'))
words = []
for segment in data.get('transcription', []):
    text = segment.get('text', '').strip()
    if not text:
        continue

    start = segment['offsets']['from'] / 1000
    end = segment['offsets']['to'] / 1000
    continues_word = words and not segment['text'].startswith(' ')
    if continues_word:
        words[-1][2] += text
        words[-1][1] = end
        continue

    words.append([start, end, text])

out.mkdir(parents=True, exist_ok=True)
(out / 'words.tsv').write_text(''.join(f'{start:.2f}\t{end:.2f}\t{word}\n' for start, end, word in words))
lines = []
line = []
for start, _, word in words:
    line.append(f'{start:.2f} {word}')
    if word.endswith(('.', '?', '!')):
        lines.append('  '.join(line))
        line = []
if line:
    lines.append('  '.join(line))
(out / 'words.txt').write_text('\n'.join(lines) + '\n')
print(len(words), 'words ->', out / 'words.txt')
