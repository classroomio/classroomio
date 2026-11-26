"""Paints the printed logo off her T-shirt, frame by frame, keeping her hands in front of it.

Usage: ffmpeg … -pix_fmt rgb48le - | delogo.py <reference.png> <personMatteDir> <pose.jsonl> [--debug dir] | ffmpeg -f rawvideo -pix_fmt rgb48le …
Input is the graded footage (cut/master-sdr.mov, footage frames only). <reference.png> is footage frame 38 as a
16-bit PNG: the one frame where no hand covers the print.

The print is rigid on her chest, so it is tracked rather than detected:
- Reference: the logo's pixels (bright or warm, unlike the dark purple shirt) and their colours.
- Each frame: the reference is scaled with the shot's punch-in, then slid to the best match; a hand in front only adds
  a capped error, so it never drags the match.
- Paint: template pixels that still match the logo, or look like ink, outside her hands. Inside her hands (Apple Vision hand
  joints, tools/pose.swift → look/pose.jsonl) only a close colour match is painted, so fingers in front of the print stay.
- Fill: the shirt's own shading, interpolated from the surrounding purple (normalised convolution), with grain on top.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

sys.path.insert(0, str(Path(__file__).parent))
from reframe import ANCHOR, zoom_at  # noqa: E402

WIDTH, HEIGHT = 1920, 1080
REFERENCE_FRAME = 38
LOGO_BOX = (690, 715, 1020, 935)
SEARCH = 36
MATCH = 0.12
GRAIN = 0.011
EDGE = 13
SLACK = 3
RING_MATCH = 0.08
HAND_MARGIN = 16
JOINT_CONFIDENCE = 0.2
LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)
rng = np.random.default_rng(3)


def logo_pixels(rgb):
    red, blue = rgb[..., 0], rgb[..., 2]

    return ((red - blue > 0.1) & (red > 0.38)) | (rgb @ LUMA > 0.3)


def grow(mask, size):
    return np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.MaxFilter(size))) > 0


def scale_about_anchor(image, factor, resample):
    """Scales a full-frame image about the punch-in anchor, keeping the frame size. Works for zooming in or out."""
    if abs(factor - 1) < 1e-4:
        return image

    inverse = 1 / factor
    coefficients = (inverse, 0, ANCHOR[0] * (1 - inverse), 0, inverse, ANCHOR[1] * (1 - inverse))

    return image.transform((WIDTH, HEIGHT), Image.AFFINE, coefficients, resample)


class Reference:
    def __init__(self, rgb):
        left, top, right, bottom = LOGO_BOX
        template = np.zeros((HEIGHT, WIDTH), bool)
        template[top:bottom, left:right] = logo_pixels(rgb[top:bottom, left:right])
        self.template = template
        self.rgb = rgb
        self.cache = {}

    def at_zoom(self, factor):
        key = round(factor, 4)
        if key not in self.cache:
            channels = [np.asarray(scale_about_anchor(Image.fromarray(self.rgb[..., index]), factor, Image.BILINEAR)) for index in range(3)]
            template = np.asarray(scale_about_anchor(Image.fromarray((self.template * 255).astype(np.uint8)), factor, Image.BILINEAR)) > 127
            self.cache = {key: (np.stack(channels, -1), template, grow(template, 9))}

        return self.cache[key]


def best_shift(frame, plate, template):
    """Integer shift that best aligns the plate's logo with this frame, with capped errors so hands don't pull it."""
    ys, xs = np.nonzero(template)
    ys, xs = ys[::7], xs[::7]
    expected = plate[ys, xs]
    best, best_error = (0, 0), np.inf
    for step, radius, recentre in ((4, SEARCH, False), (1, 4, True)):
        origin = best if recentre else (0, 0)
        for dy in range(origin[1] - radius, origin[1] + radius + 1, step):
            for dx in range(origin[0] - radius, origin[0] + radius + 1, step):
                y, x = np.clip(ys + dy, 0, HEIGHT - 1), np.clip(xs + dx, 0, WIDTH - 1)
                error = np.minimum(np.sum((frame[y, x] - expected) ** 2, -1), 0.06).mean()
                if error < best_error:
                    best, best_error = (dx, dy), error

    return best


def shifted(array, dx, dy):
    out = np.zeros_like(array)
    source = array[max(0, -dy):HEIGHT - max(0, dy), max(0, -dx):WIDTH - max(0, dx)]
    out[max(0, dy):max(0, dy) + source.shape[0], max(0, dx):max(0, dx) + source.shape[1]] = source

    return out


def gaussian_blur(array, sigma):
    """Separable Gaussian blur in float, along the first two axes."""
    radius = int(sigma * 3)
    taps = np.exp(-0.5 * (np.arange(-radius, radius + 1) / sigma) ** 2)
    taps /= taps.sum()
    for axis in (0, 1):
        pad = [(0, 0)] * array.ndim
        pad[axis] = (radius, radius)
        padded = np.pad(array, pad, mode='edge')
        array = sum(np.take(padded, range(offset, offset + array.shape[axis]), axis=axis) * weight for offset, weight in enumerate(taps))

    return array


def shirt_fill(rgb, valid):
    """Normalised convolution at quarter size: the nearby shirt colour, smooth like fabric shading."""
    height, width = valid.shape
    small = (max(width // 4, 1), max(height // 4, 1))
    weight = np.asarray(Image.fromarray(valid.astype(np.float32), 'F').resize(small, Image.BILINEAR))[..., None]
    colour = np.stack([np.asarray(Image.fromarray((rgb[..., index] * valid).astype(np.float32), 'F').resize(small, Image.BILINEAR)) for index in range(3)], -1)
    fills = []
    for sigma in (3, 9):
        weight_blur = gaussian_blur(weight, sigma)
        fills.append((gaussian_blur(colour, sigma) / np.maximum(weight_blur, 1e-4), weight_blur))
    (near, near_weight), (far, _) = fills
    trust = np.clip(near_weight / 0.25, 0, 1)
    fill = near * trust + far * (1 - trust)

    return np.stack([np.asarray(Image.fromarray(fill[..., index].astype(np.float32), 'F').resize((width, height), Image.BICUBIC)) for index in range(3)], -1)


def convex_hull(points):
    points = sorted(set(points))
    if len(points) < 3:
        return points

    def cross(origin, first, second):
        return (first[0] - origin[0]) * (second[1] - origin[1]) - (first[1] - origin[1]) * (second[0] - origin[0])

    lower, upper = [], []
    for point in points:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], point) <= 0:
            lower.pop()
        lower.append(point)
    for point in reversed(points):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], point) <= 0:
            upper.pop()
        upper.append(point)

    return lower[:-1] + upper[:-1]


def hand_zone(hands):
    """Her hands as filled, slightly grown convex hulls of the Vision hand joints (drawn at quarter size for speed)."""
    scale = 4
    canvas = Image.new('L', (WIDTH // scale, HEIGHT // scale), 0)
    draw = ImageDraw.Draw(canvas)
    for joints in hands:
        points = [(round(x * WIDTH / scale), round(y * HEIGHT / scale)) for x, y, confidence in joints if confidence > JOINT_CONFIDENCE]
        hull = convex_hull(points)
        if len(hull) >= 3:
            draw.polygon(hull, fill=255)
        for point in points:
            draw.ellipse((point[0] - 2, point[1] - 2, point[0] + 2, point[1] + 2), fill=255)
    grown = canvas.filter(ImageFilter.MaxFilter((HAND_MARGIN // scale) * 2 + 1))

    return np.asarray(grown.resize((WIDTH, HEIGHT), Image.NEAREST)) > 0


def load_hands(pose_path):
    hands = {}
    for line in open(pose_path):
        entry = json.loads(line)
        hands[int(entry['frame'][2:7]) - 1] = entry['hands']

    return hands


def nearest_match(rgb, plate, slack):
    """Per-pixel colour distance to the plate, allowing the print to have slid up to `slack` px (fabric moves)."""
    best = np.full(rgb.shape[:2], np.inf, np.float32)
    height, width = rgb.shape[:2]
    padded = np.pad(plate, ((slack, slack), (slack, slack), (0, 0)), mode='edge')
    for dy in range(-slack, slack + 1):
        for dx in range(-slack, slack + 1):
            moved = padded[slack + dy:slack + dy + height, slack + dx:slack + dx + width]
            best = np.minimum(best, np.sum((rgb - moved) ** 2, -1))

    return np.sqrt(best)


def close_holes(mask, size):
    image = Image.fromarray((mask * 255).astype(np.uint8))

    return np.asarray(image.filter(ImageFilter.MaxFilter(size)).filter(ImageFilter.MinFilter(size))) > 0


def clean(rgb, frame, reference, person, hands):
    factor = zoom_at(frame) / zoom_at(REFERENCE_FRAME)
    plate, template, _ = reference.at_zoom(factor)
    dx, dy = best_shift(rgb, plate, template)
    plate, template = shifted(plate, dx, dy), shifted(template, dx, dy)
    ys, xs = np.nonzero(template)
    if len(ys) == 0:
        return rgb, template, (dx, dy)

    top, bottom = max(ys.min() - EDGE - 40, 0), min(ys.max() + EDGE + 40, HEIGHT)
    left, right = max(xs.min() - EDGE - 40, 0), min(xs.max() + EDGE + 40, WIDTH)
    crop = (slice(top, bottom), slice(left, right))
    region, plate_region, core_template = rgb[crop], plate[crop], template[crop]
    core = grow(core_template, 5)
    ring = grow(core_template, EDGE) & ~core
    near = nearest_match(region, plate_region, 2)
    loose = nearest_match(region, plate_region, SLACK)
    red, green, blue = region[..., 0], region[..., 1], region[..., 2]
    luma = region @ LUMA
    white_ink = (luma > 0.42) & (blue > 0.75 * red) & (green > 0.7 * red)
    warm_ink = (luma > 0.38) & (red > 0.5) & (green < 0.62 * red)
    skin = (red > 1.25 * blue) & (green > 0.9 * blue) & ~warm_ink & ~white_ink
    plate_red, plate_blue = plate_region[..., 0], plate_region[..., 2]
    plate_is_skin_coloured = plate_red > 1.25 * plate_blue
    trusted = ~skin | (plate_is_skin_coloured & (near < MATCH * 0.6))
    in_hand = hands[crop]
    ink = logo_pixels(region)
    inside_hand = in_hand & (((near < MATCH) & trusted) | white_ink | warm_ink)
    outside_hand = ~in_hand & (((near < MATCH) & trusted) | (ink & (~skin | (luma > 0.52))))
    painted = (core & (inside_hand | outside_hand)) | (ring & ~skin & ((loose < RING_MATCH) | (ink & ~skin & ~in_hand)))
    mask = person[crop] & painted
    mask = close_holes(mask, 5) & person[crop] & grow(core_template, EDGE)

    shirt = (luma < 0.4) & (blue >= green) & (red > green) & (blue > 0.8 * red) & ~grow(core_template, EDGE + 4) & person[crop]
    fill = shirt_fill(region, shirt) + rng.normal(0, GRAIN, region.shape[:2] + (1,)).astype(np.float32)
    soft = np.asarray(Image.fromarray((mask * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.6)), np.float32)[..., None] / 255
    out = rgb.copy()
    out[crop] = region * (1 - soft) + fill * soft
    full_mask = np.zeros((HEIGHT, WIDTH), bool)
    full_mask[crop] = mask

    return out, full_mask, (dx, dy)


def read_png16(path):
    pixels = np.asarray(Image.open(path).convert('RGB'))

    return pixels.astype(np.float32) / (65535 if pixels.dtype == np.uint16 else 255)


def main():
    reference = Reference(read_png16(sys.argv[1]))
    mattes = Path(sys.argv[2])
    poses = load_hands(sys.argv[3])
    debug = Path(sys.argv[5]) if len(sys.argv) > 5 and sys.argv[4] == '--debug' else None
    frame_bytes = WIDTH * HEIGHT * 3 * 2
    stdin, stdout = sys.stdin.buffer, sys.stdout.buffer
    frame = 0
    while True:
        raw = stdin.read(frame_bytes)
        if len(raw) < frame_bytes:
            break

        rgb = np.frombuffer(raw, '<u2').reshape(HEIGHT, WIDTH, 3).astype(np.float32) / 65535
        person = grow(np.asarray(Image.open(mattes / f'f_{frame + 1:05d}.png').convert('L')) > 128, 3)
        out, mask, shift = clean(rgb, frame, reference, person, hand_zone(poses.get(frame, [])))
        if debug and frame % 50 == 0:
            view = (out * 255).clip(0, 255).astype(np.uint8)
            Image.fromarray(view[640:1080, 560:1160]).save(debug / f'd_{frame:05d}.jpg', quality=85)
            print(frame, shift, file=sys.stderr)
        stdout.write(np.round(out.clip(0, 1) * 65535).astype('<u2').tobytes())
        frame += 1


if __name__ == '__main__':
    main()
