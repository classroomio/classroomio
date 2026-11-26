"""Cinematic grade for the HLG iPhone footage, delivered as SDR BT.709.

The grade is a pure function of the HLG RGB signal, so it bakes into a 3D LUT that ffmpeg's lut3d applies:
  grade.py lut <out.cube> [look]              write a 65³ .cube (input: HLG BT.2020 RGB signal, output: graded sRGB)
  grade.py stills <video> <out.jpg> [looks] -- <t1> <t2> ...   compare looks on real frames (neutral, warm, …)
Vignette, grain and sharpening are spatial, so they are applied in ffmpeg after the LUT, not here.
"""
import subprocess
import sys

import numpy as np
from PIL import Image

HLG_A, HLG_B, HLG_C = 0.17883277, 0.28466892, 0.55991073
BT2020_LUMA = np.array([0.2627, 0.6780, 0.0593])
BT2020_TO_BT709 = np.linalg.inv(np.array([
    [0.6274, 0.3293, 0.0433],
    [0.0691, 0.9195, 0.0114],
    [0.0164, 0.0880, 0.8956],
]))
REFERENCE_WHITE = 203 / 1000

LOOKS = {
    'neutral': dict(exposure=1.0, white=1.0, contrast=1.0, pivot=0.45, lift=0.0, saturation=1.0, shadows=(0, 0, 0), highlights=(0, 0, 0), wood=1.0),
    'cine': dict(exposure=0.5, white=0, balance=(0.94, 0.955, 1.1), gamma=0.88, contrast=1.08, pivot=0.42, lift=0.01, saturation=0.92, shadows=(-0.014, 0.004, 0.024), highlights=(0.014, 0.004, -0.012), wood=0.78),
    'cine-deep': dict(exposure=0.44, white=0, balance=(0.9, 0.96, 1.14), gamma=0.9, contrast=1.14, pivot=0.4, lift=0.012, saturation=0.9, shadows=(-0.02, 0.006, 0.03), highlights=(0.018, 0.006, -0.016), wood=0.72),
    'film': dict(exposure=0.66, white=0, contrast=1.04, pivot=0.45, lift=0.008, saturation=1.02, shadows=(-0.008, 0.002, 0.014), highlights=(0.012, 0.004, -0.016), wood=0.9),
    'film-warm': dict(exposure=0.62, white=0, contrast=1.1, pivot=0.42, lift=0.012, saturation=1.0, shadows=(-0.016, 0.004, 0.026), highlights=(0.024, 0.008, -0.03), wood=0.84),
}


def hlg_to_display(signal):
    """HLG signal (BT.2020) → display-linear BT.709 RGB where 1.0 is SDR reference white (203 cd/m², BT.2408)."""
    signal = np.clip(signal, 0, 1)
    scene = np.where(signal <= 0.5, signal ** 2 / 3, (np.exp((signal - HLG_C) / HLG_A) + HLG_B) / 12)
    luma = np.maximum(scene @ BT2020_LUMA, 1e-7)
    display = scene * luma[..., None] ** 0.2 / REFERENCE_WHITE
    return np.maximum(display @ BT2020_TO_BT709.T, 0)


def srgb_encode(linear):
    linear = np.clip(linear, 0, 1)
    return np.where(linear <= 0.0031308, 12.92 * linear, 1.055 * linear ** (1 / 2.4) - 0.055)


def grade(signal, look):
    settings = LOOKS[look]
    linear = hlg_to_display(signal) * settings['exposure'] * np.array(settings.get('balance', (1, 1, 1)))
    white = settings['white']
    if white == 0:
        linear = np.clip(linear * (2.51 * linear + 0.03) / (linear * (2.43 * linear + 0.59) + 0.14), 0, 1)
    elif white > 1:
        linear = linear * (1 + linear / white ** 2) / (1 + linear)
        linear = linear / ((1 + 1 / white) / (1 + white) * white)
    encoded = srgb_encode(linear) ** settings.get('gamma', 1.0)

    luma = encoded @ np.array([0.2126, 0.7152, 0.0722])
    chroma = encoded - luma[..., None]
    hue_warm = np.clip((encoded[..., 0] - encoded[..., 2]) * 2.2, 0, 1) * np.clip(luma * 1.6, 0, 1)
    chroma = chroma * (settings['saturation'] * (1 - (1 - settings['wood']) * hue_warm * (1 - np.clip((luma - 0.35) * 3, 0, 1))))[..., None]

    pivot = settings['pivot']
    curved = pivot + (luma - pivot) * settings['contrast']
    curved = np.where(curved < pivot, pivot * (curved / pivot).clip(0, None) ** 1.0, curved)
    curved = settings['lift'] + curved * (1 - settings['lift'])
    shadow_weight = np.clip(1 - curved / 0.5, 0, 1) ** 1.5
    highlight_weight = np.clip((curved - 0.5) / 0.5, 0, 1) ** 1.2
    out = curved[..., None] + chroma
    out = out + shadow_weight[..., None] * np.array(settings['shadows']) + highlight_weight[..., None] * np.array(settings['highlights'])
    knee = 0.82
    rolled = knee + (1 - knee) * (1 - np.exp(-(out - knee) / (1 - knee)))
    out = np.where(out > knee, rolled, out)

    return np.clip(out, 0, 1)


def write_lut(path, look, size=65):
    axis = np.linspace(0, 1, size)
    blue, green, red = np.meshgrid(axis, axis, axis, indexing='ij')
    grid = np.stack([red, green, blue], -1).reshape(-1, 3)
    out = grade(grid, look)
    with open(path, 'w') as handle:
        handle.write(f'TITLE "teach-once {look}"\nLUT_3D_SIZE {size}\n')
        handle.writelines(f'{r:.6f} {g:.6f} {b:.6f}\n' for r, g, b in out)


def frame_signal(video, time):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-ss', str(time), '-i', video, '-frames:v', '1',
                          '-vf', 'scale=960:540:in_color_matrix=bt2020:in_range=tv,format=rgb48le', '-f', 'rawvideo', '-'],
                         capture_output=True, check=True).stdout
    return np.frombuffer(raw, dtype='<u2').reshape(540, 960, 3).astype(np.float64) / 65535


def vignette(height, width, strength=0.28, centre=(0.44, 0.45)):
    ys, xs = np.mgrid[0:height, 0:width]
    dx = (xs / width - centre[0]) * 1.4
    dy = (ys / height - centre[1])
    radius = np.sqrt(dx ** 2 + dy ** 2)
    return 1 - strength * np.clip((radius - 0.35) / 0.55, 0, 1) ** 1.6


def stills(video, out, looks, times):
    rows = []
    shade = vignette(540, 960)[..., None]
    for time in times:
        signal = frame_signal(video, time)
        tiles = []
        for look in looks:
            image = grade(signal, look)
            if look != 'neutral':
                image = image * shade
            tiles.append((image * 255).round().astype(np.uint8))
        rows.append(np.concatenate(tiles, 1))
    Image.fromarray(np.concatenate(rows, 0)).save(out, quality=88)


if __name__ == '__main__':
    if sys.argv[1] == 'lut':
        write_lut(sys.argv[2], sys.argv[3] if len(sys.argv) > 3 else 'cine')
    else:
        split = sys.argv.index('--')
        stills(sys.argv[2], sys.argv[3], sys.argv[4:split] or ['neutral', 'cine'], [float(t) for t in sys.argv[split + 1:]])
