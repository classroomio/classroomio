"""Averages motion-blur sub-frames (premultiplied alpha) into RGBA f_XXXXX.png and fills gaps with blank symlinks.
Usage: blur.py <framesDir> <totalFrames>   (run with the cio-video venv python, which has numpy)"""
import glob, os, re, sys
from multiprocessing import Pool
import numpy as np
from PIL import Image

frames_dir, total = sys.argv[1], int(sys.argv[2])
sub_dir = os.path.join(frames_dir, 'sub')


def average(frame):
    parts = sorted(glob.glob(os.path.join(sub_dir, f'f_{frame:05d}_*.png')))
    accum = None
    for part in parts:
        rgba = np.asarray(Image.open(part).convert('RGBA'), dtype=np.float32) / 255.0
        rgba[..., :3] *= rgba[..., 3:4]
        accum = rgba if accum is None else accum + rgba
    accum /= len(parts)
    alpha = accum[..., 3:4]
    rgb = np.where(alpha > 1e-5, accum[..., :3] / np.maximum(alpha, 1e-5), 0)
    out = np.concatenate([rgb, alpha], axis=2)
    target = os.path.join(frames_dir, f'f_{frame:05d}.png')
    if os.path.islink(target):
        os.remove(target)
    Image.fromarray((np.clip(out, 0, 1) * 255 + 0.5).astype(np.uint8), 'RGBA').save(target, compress_level=1)
    for part in parts:
        os.remove(part)
    return frame


if __name__ == '__main__':
    frames = sorted({int(re.search(r'f_(\d{5})_', name).group(1)) for name in os.listdir(sub_dir)}) if os.path.isdir(sub_dir) else []
    with Pool(8) as pool:
        for count, _ in enumerate(pool.imap_unordered(average, frames, chunksize=4)):
            if count % 200 == 0:
                print('averaged', count, '/', len(frames), flush=True)
    for frame in range(total):
        target = os.path.join(frames_dir, f'f_{frame:05d}.png')
        if not os.path.exists(target) and not os.path.islink(target):
            os.symlink('blank.png', target)
    print('done', len(frames), 'blurred frames')
