"""Writes one ProRes 4444 (alpha) clip per scene from rendered frames, named and timecoded by source position.

Usage: layers.py <framesDir> <outDir> <fps>
An editor drops each clip on a track above the footage at its timecode.
"""
import json
import math
import subprocess
import sys

frames, out, fps = sys.argv[1], sys.argv[2], int(round(float(sys.argv[3])))
scenes = json.load(open(f'{frames}/scenes.json'))
for scene in scenes:
    start = math.floor(scene['in'] * fps)
    end = math.ceil(scene['out'] * fps)
    seconds = start / fps
    stamp = f"{int(seconds // 60):02d}m{seconds % 60:05.2f}s"
    name = f"{out}/{scene['id']}__at_{stamp}.mov"
    timecode = f"00:{int(seconds // 60):02d}:{int(seconds % 60):02d}:{start % fps:02d}"
    subprocess.run([
        'ffmpeg', '-y', '-v', 'error', '-framerate', str(fps), '-start_number', str(start),
        '-i', f'{frames}/f_%05d.png', '-frames:v', str(end - start),
        '-c:v', 'prores_ks', '-profile:v', '4', '-pix_fmt', 'yuva444p10le', '-vendor', 'apl0',
        '-timecode', timecode, name
    ], check=True)
    print(name)
