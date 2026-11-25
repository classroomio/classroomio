"""Writes img/manifest.js (window.ASSETS = {folder: [files]}) for every image folder in a project's img/.

Usage: manifest.py <projectDir>
Scenes pick images with asset('faces', index), so adding files to a folder needs only a re-run of this script.
"""
import json
import sys
from pathlib import Path

img = Path(sys.argv[1]) / 'img'
img.mkdir(exist_ok=True)
manifest = {}
for folder in sorted(path for path in img.iterdir() if path.is_dir() and path.name != 'footage'):
    manifest[folder.name] = sorted(path.name for path in folder.iterdir() if path.suffix.lower() in {'.jpg', '.jpeg', '.png', '.webp'})
(img / 'manifest.js').write_text('window.ASSETS = ' + json.dumps(manifest) + ';\n')
print({name: len(files) for name, files in manifest.items()})
