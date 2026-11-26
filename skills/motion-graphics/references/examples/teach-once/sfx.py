"""Soft UI sounds on the frame each graphic moves. Mixed at unity gain under the voice; the voice is never touched.
Levels sit well under speech (her peaks are around -3 dBFS): pops and ticks -24 to -28, beds -32 and lower.
`mg sfx <projectDir>` writes renders/sfx-stem.wav.
"""
import sys

from sfxlib import *

begin(34.567)

# A — the same question arrives five times: a soft notification pop each, panned right where the inbox is.
for index, at in enumerate([2.0, 2.62, 3.2, 3.92, 4.4]):
    place(at - 0.02, pop(520 + index * 22, 1180 + index * 30, 0.08), -25, 0.35)

# B — the week sheet lands, then each onboarding call drops in with a tick.
place(5.1, whoosh(0.32, 400, 3200, peak=0.5), -32, 0.3)
for index, at in enumerate([5.58, 5.98, 6.36, 6.72, 7.14, 7.52, 7.74]):
    place(at, tick(1500 + index * 60, 0.035), -24, 0.35)

# C — important.
place(9.55, pop(320, 780, 0.1), -26, 0.35)

# D — succeed, then the checklist ticks, rewinds and starts over.
place(13.47, pop(340, 820, 0.1), -26, 0.35)
place(14.24, whoosh(0.3, 400, 3000, peak=0.5), -32, 0.3)
for round_ticks in ([14.42, 14.62, 14.82, 15.02], [15.7, 15.82, 15.94, 16.06], [16.42, 16.52, 16.62, 16.72]):
    for index, at in enumerate(round_ticks):
        place(at, tick(1900 + index * 120, 0.03), -26, 0.35)
place(15.3, rewind(0.3), -33, 0.35)
place(16.1, rewind(0.24), -33, 0.35)

# E — the loop draws around her, then snaps open on "break".
place(16.95, whoosh(0.55, 250, 2400, peak=0.7), -31, -0.2, 1)
place(17.58, thunk(150), -26, 0)
place(17.58, pop(700, 300, 0.12), -28, 0.15)

# F — documents snap into course blocks; then the lesson page: click Mark as Complete, the 24/7 pill, click Next.
for index, at in enumerate([19.36, 19.62, 19.88]):
    place(at - 0.02, pop(440 + index * 40, 900 + index * 40, 0.08), -27, 0.35)
place(20.4, whoosh(0.4, 300, 2600, peak=0.6), -32, 0.3)
for index, at in enumerate([20.6, 20.86, 21.12]):
    place(at + 0.24, thunk(170 + index * 30), -27, 0.35)
place(21.12 + 0.3, chime(1318.5, 1.0), -34, 0.35, 1)
place(21.84, whoosh(0.32, 400, 3000, peak=0.5), -32, 0.3)
place(22.92, tick(3200, 0.02), -24, 0.35)
place(22.95, chime(1568.0, 0.8), -35, 0.35, 1)
place(23.22, pop(600, 1250, 0.08), -26, 0.35)
place(23.8, tick(3000, 0.02), -24, 0.35)
place(23.85, whoosh(0.3, 600, 4000, peak=0.5), -34, 0.4)

# G — the logo lands.
place(24.62, pop(300, 700, 0.12), -26, 0.3)
place(24.84, shimmer(0.6, density=50), -38, 0.3, 1)

# once.
place(29.13, pop(260, 640, 0.12), -25, 0.3)
place(29.13, shimmer(0.7, density=60), -35, 0.3, 1)

finish(sys.argv[1])
