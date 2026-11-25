"""Builds 'behind the speaker' mattes: white where graphics may show, black over the person and over burned-in captions.

Captions are the pure-white text in the frame. Blown-out sky is also pure white, but it always connects to the top edge,
so white regions reachable from the top row are kept as background.
Usage: behind-matte.py <mattesRoot> [--no-captions]
Reads <mattesRoot>/src/*.jpg and <mattesRoot>/person/*.png, writes <mattesRoot>/behind/*.png.
Tune with env: MG_CAPTION_MIN (222), MG_CAPTION_SPREAD (24), MG_CAPTION_DILATE (13), MG_SKY_ROWS (0.3), MG_TOP_ROWS (0.26).
"""
import os
import sys
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

root = Path(sys.argv[1])
with_captions = '--no-captions' not in sys.argv
CAPTION_MIN = int(os.environ.get('MG_CAPTION_MIN', 222))
CAPTION_SPREAD = int(os.environ.get('MG_CAPTION_SPREAD', 24))
CAPTION_DILATE = int(os.environ.get('MG_CAPTION_DILATE', 13))
SKY_ROWS = float(os.environ.get('MG_SKY_ROWS', 0.3))
TOP_ROWS = float(os.environ.get('MG_TOP_ROWS', 0.26))
out = root / 'behind'
out.mkdir(exist_ok=True)


def dilate(mask, radius):
    grown = mask.copy()
    for shift in range(1, radius + 1):
        grown[shift:, :] |= mask[:-shift, :]
        grown[:-shift, :] |= mask[shift:, :]
    result = grown.copy()
    for shift in range(1, radius + 1):
        result[:, shift:] |= grown[:, :-shift]
        result[:, :-shift] |= grown[:, shift:]

    return result


def connected_to_top(mask):
    region = np.zeros_like(mask)
    region[0, :] = mask[0, :]
    while True:
        grown = dilate(region, 1) & mask
        if (grown == region).all():
            return region
        region = grown


def build(name):
    frame = np.asarray(Image.open(root / 'src' / name).convert('RGB')).astype(np.int16)
    low = frame.min(axis=2)
    high = frame.max(axis=2)
    height, width = low.shape
    caption_alpha = np.zeros((height, width), dtype=np.float32)
    if with_captions:
        white = (low >= CAPTION_MIN) & ((high - low) <= CAPTION_SPREAD)
        small = np.asarray(Image.fromarray((white * 255).astype(np.uint8)).resize((width // 4, height // 4), Image.BILINEAR)) > 40
        small[int(small.shape[0] * SKY_ROWS):, :] = False
        sky_small = connected_to_top(small)
        sky = np.asarray(Image.fromarray((dilate(sky_small, 2) * 255).astype(np.uint8)).resize((width, height), Image.NEAREST)) > 0
        upper = np.zeros_like(white)
        upper[: int(height * TOP_ROWS), :] = True
        caption = dilate(white & ~sky & ~upper, CAPTION_DILATE)
        caption_alpha = np.asarray(Image.fromarray((caption * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(2.5)), dtype=np.float32) / 255

    person = Image.open(root / 'person' / name.replace('.jpg', '.png')).convert('L').filter(ImageFilter.GaussianBlur(1.2))
    person_alpha = np.asarray(person, dtype=np.float32) / 255
    keep = (1 - np.maximum(person_alpha, caption_alpha)) * 255
    Image.fromarray(keep.clip(0, 255).astype(np.uint8)).save(out / name.replace('.jpg', '.png'))


if __name__ == '__main__':
    names = sorted(path.name for path in (root / 'src').glob('f_*.jpg'))
    with Pool(8) as pool:
        pool.map(build, names)
    print('mattes', len(names))
