"""A full-width frosted band across her chest that hides the shirt print; the captions sit inside it.

Usage: ffmpeg … -pix_fmt rgb48le - | band.py | ffmpeg -f rawvideo -pix_fmt rgb48le -s 1920x1080 …
Input is the master with the behind graphics already over it, so the band frosts everything under it.
The band follows each shot's punch-in (it is scaled about the same anchor), so it covers the print in wide and tight shots.
Footage frames only (0–886); the outro passes through untouched.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

sys.path.insert(0, str(Path(__file__).parent))
from reframe import ANCHOR, HEIGHT, SHOTS, WIDTH, zoom_at  # noqa: E402

FOOTAGE_FRAMES = SHOTS[-1][1]
BAND_TOP = 700
BAND_BOTTOM = 955
BLUR_SIGMA = 10
DARKEN = 0.34
TINT = np.array([0.035, 0.027, 0.02], np.float32)
EDGE_SOFTNESS = 1.5
GRAIN = 0.008
rng = np.random.default_rng(5)


def band_rows(frame):
    zoom = zoom_at(frame)
    top = ANCHOR[1] + (BAND_TOP - ANCHOR[1]) * zoom
    bottom = ANCHOR[1] + (BAND_BOTTOM - ANCHOR[1]) * zoom

    return top, min(bottom, HEIGHT)


def gaussian_blur(array, sigma):
    radius = int(sigma * 3)
    taps = np.exp(-0.5 * (np.arange(-radius, radius + 1) / sigma) ** 2)
    taps /= taps.sum()
    for axis in (0, 1):
        pad = [(0, 0)] * array.ndim
        pad[axis] = (radius, radius)
        padded = np.pad(array, pad, mode='edge')
        array = sum(np.take(padded, range(offset, offset + array.shape[axis]), axis=axis) * weight for offset, weight in enumerate(taps))

    return array


def resize(array, size):
    return np.stack([np.asarray(Image.fromarray(np.ascontiguousarray(array[..., index], np.float32), 'F').resize(size, Image.BICUBIC)) for index in range(3)], -1)


def frost(rgb, frame):
    top, bottom = band_rows(frame)
    first, last = max(int(top) - 4 * BLUR_SIGMA * 4, 0), min(int(bottom) + 4 * BLUR_SIGMA * 4, HEIGHT)
    strip = rgb[first:last]
    small = resize(strip, (WIDTH // 4, max((last - first) // 4, 1)))
    blurred = resize(gaussian_blur(small, BLUR_SIGMA), (WIDTH, last - first))
    glass = blurred * DARKEN + TINT + rng.normal(0, GRAIN, blurred.shape[:2] + (1,)).astype(np.float32)
    rows = np.arange(first, last, dtype=np.float32)[:, None, None]
    alpha = np.clip((rows - top) / EDGE_SOFTNESS + 0.5, 0, 1) * np.clip((bottom - rows) / EDGE_SOFTNESS + 0.5, 0, 1)
    out = rgb.copy()
    out[first:last] = strip * (1 - alpha) + glass * alpha

    return out


def main():
    frame_bytes = WIDTH * HEIGHT * 3 * 2
    stdin, stdout = sys.stdin.buffer, sys.stdout.buffer
    frame = 0
    while True:
        raw = stdin.read(frame_bytes)
        if len(raw) < frame_bytes:
            break

        if frame < FOOTAGE_FRAMES:
            rgb = np.frombuffer(raw, '<u2').reshape(HEIGHT, WIDTH, 3).astype(np.float32) / 65535
            raw = np.round(frost(rgb, frame).clip(0, 1) * 65535).astype('<u2').tobytes()
        stdout.write(raw)
        frame += 1


if __name__ == '__main__':
    main()
