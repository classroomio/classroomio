"""Punch-ins and a slow push on the graded cut, streamed as rgb48le frames.

Usage: ffmpeg … -f rawvideo -pix_fmt rgb48le - | reframe.py | ffmpeg -f rawvideo -pix_fmt rgb48le -s 1920x1080 -i - …
A soft vignette is applied here too. Every other cut is a tighter shot, which hides the jump cuts; every shot creeps in a few percent.
The zoom is anchored on her face, so the face stays put and only the framing changes.
"""
import sys

import numpy as np
from PIL import Image

WIDTH, HEIGHT, FPS = 1920, 1080, 30
ANCHOR = (830, 420)
VIGNETTE_STRENGTH = 0.24
SHOTS = [
    (0, 150, 1.0, 1.04),
    (150, 241, 1.14, 1.16),
    (241, 505, 1.0, 1.05),
    (505, 557, 1.17, 1.19),
    (557, 793, 1.0, 1.05),
    (793, 887, 1.12, 1.15),
]


def zoom_at(frame):
    for first, end, start_zoom, end_zoom in SHOTS:
        if first <= frame < end:
            progress = (frame - first) / max(end - first - 1, 1)
            return start_zoom + (end_zoom - start_zoom) * progress

    return 1.0


def reframe(rgb, zoom):
    if zoom == 1.0:
        return rgb

    box_width, box_height = WIDTH / zoom, HEIGHT / zoom
    left = ANCHOR[0] - ANCHOR[0] / zoom
    top = ANCHOR[1] - ANCHOR[1] / zoom
    box = (left, top, left + box_width, top + box_height)
    channels = [np.asarray(Image.fromarray(rgb[..., index].astype(np.float32), 'F').resize((WIDTH, HEIGHT), Image.LANCZOS, box=box))
                for index in range(3)]
    return np.clip(np.stack(channels, -1), 0, 65535)


def vignette():
    """Soft darkening towards the edges, centred a little left of frame where she sits."""
    ys, xs = np.mgrid[0:HEIGHT, 0:WIDTH]
    radius = np.sqrt(((xs / WIDTH - 0.44) * 1.4) ** 2 + (ys / HEIGHT - 0.45) ** 2)
    falloff = np.clip((radius - 0.35) / 0.6, 0, 1) ** 1.7
    return (1 - VIGNETTE_STRENGTH * falloff)[..., None].astype(np.float32)


def main():
    frame_bytes = WIDTH * HEIGHT * 3 * 2
    stdin, stdout = sys.stdin.buffer, sys.stdout.buffer
    shade = vignette()
    frame = 0
    while True:
        raw = stdin.read(frame_bytes)
        if len(raw) < frame_bytes:
            break

        rgb = np.frombuffer(raw, '<u2').reshape(HEIGHT, WIDTH, 3)
        out = reframe(rgb, zoom_at(frame)) * shade
        stdout.write(np.round(out).astype('<u2').tobytes())
        frame += 1


if __name__ == '__main__':
    main()
