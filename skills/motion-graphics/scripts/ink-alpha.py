"""Converts photos of ink in water (dark ink on a light ground) into RGBA ink mattes for the cinematic ink reveal.

Usage: ink-alpha.py <photosDir> <projectDir>/img/ink
Name the inputs ink1_*.jpg, ink2_*.jpg, ... ; updateCinematic picks plumes by that prefix.
"""
import os
import sys

from PIL import Image, ImageOps

source, target = sys.argv[1], sys.argv[2]
os.makedirs(target, exist_ok=True)
for name in sorted(os.listdir(source)):
    if not name.lower().endswith(('.jpg', '.jpeg', '.png')):
        continue

    gray = ImageOps.autocontrast(ImageOps.grayscale(Image.open(os.path.join(source, name))), cutoff=2)
    alpha = ImageOps.invert(gray).point(lambda value: max(0, min(255, int((value - 70) * 3.2))))
    ink = Image.new('RGBA', gray.size, (8, 9, 12, 0))
    ink.putalpha(alpha)
    ink.save(os.path.join(target, os.path.splitext(name)[0] + '.png'))
    print(name)
