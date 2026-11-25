"""Sound-effects cues for this project. `mg sfx <projectDir>` runs it and writes renders/sfx-stem.wav.

Place every sound on the frame its visual happens, a few dB under the voice. The voice itself is never touched:
the stem is mixed on top at unity gain. Library: skills/motion-graphics/scripts/sfxlib.py.
"""
import sys

from sfxlib import *

begin(10.0)

# example-once
place(2.0, whoosh(0.5, 300, 3500, peak=0.5), -28)
place(2.6, impact(0.8, 55), -16)
place(2.6, shimmer(0.9), -28, 0, 1)
flash_whoosh(5.0)

# example-behind
place(6.0, whoosh(0.4, 600, 5000, peak=0.5), -30, 0.5)
for index in range(8):
    place(6.5 + index * 0.13, tick(1800 + index * 90), -32, 0.5)

finish(sys.argv[1])
