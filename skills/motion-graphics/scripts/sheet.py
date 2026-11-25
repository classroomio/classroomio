"""Tiles labelled images into one contact sheet so a whole cue can be reviewed at a glance.

Usage: sheet.py <out.jpg> <image> [<image> ...]   (labels come from the part of each name after the last '_')
"""
import sys

from PIL import Image, ImageDraw

out, files = sys.argv[1], sys.argv[2:]
images = [Image.open(name).convert('RGB') for name in files]
width, height = images[0].size
columns = 3
rows = (len(images) + columns - 1) // columns
sheet = Image.new('RGB', (width * columns, height * rows))
draw = ImageDraw.Draw(sheet)
for index, (image, name) in enumerate(zip(images, files)):
    x, y = (index % columns) * width, (index // columns) * height
    sheet.paste(image, (x, y))
    draw.text((x + 8, y + 8), name.rsplit('_', 1)[-1].rsplit('.', 1)[0], fill='yellow')
sheet.save(out, quality=82)
print(out)
