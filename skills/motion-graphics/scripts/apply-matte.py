"""Cuts the speaker and the burned-in captions out of graphics that sit 'behind' them.

For every frame inside a scene's `behind` range, the frame's alpha is multiplied by the matte in <mattesDir>/behind.
Usage: apply-matte.py <framesDir> <mattesDir> <fps>             (rendered frames f_XXXXX.png, scenes.json beside them)
       apply-matte.py --stills <stillsDir> <mattesDir> <fps>    (still_T.png files)
"""
import json
import math
import sys
from multiprocessing import Pool
from pathlib import Path

import numpy as np
from PIL import Image

stills = sys.argv[1] == '--stills'
args = sys.argv[2:] if stills else sys.argv[1:]
frames_dir, mattes_dir, fps = Path(args[0]), Path(args[1]) / 'behind', float(args[2])
ranges = [scene['behind'] for scene in json.load(open(frames_dir / 'scenes.json')) if scene.get('behind')]


def covered(time):
    return any(start <= time < end for start, end in ranges)


def apply(job):
    path, frame = job
    matte_path = mattes_dir / f'f_{frame:05d}.png'
    if not matte_path.exists() or path.is_symlink():
        return 0

    image = Image.open(path).convert('RGBA')
    matte = Image.open(matte_path).convert('L').resize(image.size, Image.BILINEAR)
    pixels = np.asarray(image, dtype=np.float32)
    keep = np.asarray(matte, dtype=np.float32) / 255
    pixels[..., 3] *= keep
    Image.fromarray(pixels.round().clip(0, 255).astype(np.uint8), 'RGBA').save(path)

    return 1


if __name__ == '__main__':
    jobs = []
    if stills:
        for path in frames_dir.glob('still_*.png'):
            time = float(path.stem.split('_')[1])
            if covered(time):
                jobs.append((path, round(time * fps)))
    else:
        for path in frames_dir.glob('f_*.png'):
            frame = int(path.stem.split('_')[1])
            if covered(frame / fps):
                jobs.append((path, frame))
    with Pool(8) as pool:
        print('matted', sum(pool.map(apply, jobs)))
