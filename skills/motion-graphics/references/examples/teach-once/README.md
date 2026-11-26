# Example: "Teach once" product video (2026-11)

A 33-second iPhone talking-head (HLG), cut from raw footage, graded to SDR and delivered at 1080p. It has:
- story graphics behind the speaker;
- captions both behind and in front of her;
- a product UI scene;
- original music;
- a caption band hiding a third-party logo on her T-shirt.

Read it and adapt it; nothing here runs as is. The project's `img/`, fonts, transcript and footage are not included.

## Picture

| File | What it does |
|---|---|
| `tools/grade.py` | Bakes a cinematic grade for HLG BT.2020 footage into a 65³ `.cube` that ffmpeg's `lut3d` applies. `stills` mode compares looks on real frames. |
| `tools/reframe.py` | Punch-ins and a slow push per shot (`SHOTS`: frame range, start zoom, end zoom), anchored on the face, plus a vignette. Every other shot is tighter, which hides the jump cuts. `zoom_at(frame)` is reused by the band and the captions. |
| `tools/master.sh` | HLG cut → LUT → reframe → light video denoise, sharpen and grain → ProRes, then appends the outro. |
| `tools/final-sdr.sh` | Master + behind PNGs + front PNGs + voice + music + effects → H.264. `MASTER`, `FRONT` and `BEHIND=none` pick between versions. |

## Hiding a logo on clothing

Two approaches were built. The user chose the band.

| File | What it does |
|---|---|
| `tools/band.py`, `tools/band.sh` | **Caption band (chosen).** A full-width frosted, darkened band over the chest, from rows 700 to 955, scaled with each shot's zoom so it still covers the print in tight shots. Captions sit inside it: see `CAPTION_BAND` in `scenes/captions.js`, and render a third project whose `index.html` sets `window.LAYER = 'front'; window.CAPTION_BAND = true;`. The logo is gone in every frame. The cost is a dark stripe over a quarter of the frame that also covers her hands. |
| `tools/delogo.py`, `tools/delogo.sh`, `tools/pose.swift` | **Paint-out (alternative).** A template of the print from one reference frame, scaled per frame and matched by shift. Shirt-colour fill uses normalised convolution. The mask is guarded by: the person matte; skin-colour rules; hand zones from Apple Vision hand joints (`pose.swift` → `pose.jsonl`). It looks natural, but leaves small flecks next to fast, motion-blurred hands. About 0.55 s per frame. |

## Graphics

| Scene | Use it for |
|---|---|
| `A-same-question` | Notifications asking the same question pile up in an inbox. Use for repetition. |
| `B-onboarding-week` | A week sheet fills with onboarding calls. |
| `D-onboarding-loop` | A checklist ticks, rewinds and starts over. |
| `E-break-the-loop` | A loop draws around the speaker and snaps open. |
| `F-knowledge-to-training` | Documents snap into course blocks. |
| `F2-course-ui` | The ClassroomIO lesson page: Mark as Complete is clicked, a 24/7 pill appears, then Next lesson. Use for "people can access it whenever they need it". |
| `G-logo` | The logo lands before the payoff word. |

All of them sit behind the speaker in the light ClassroomIO block language of the outro: paper, sand, tint, brand blue. That is a calmer register than the dark cinematic launch film.

`scenes/captions.js` renders both caption layers from one file: `window.LAYER` is `'behind'` or `'front'`. In band mode the caption line follows `zoom_at` so it stays inside the band.

## Sound

| File | What it does |
|---|---|
| `sfx.py` | Soft UI sounds (pops, ticks, whooshes, rewinds, chimes) at −24 to −35 dB. |
| `tools/music.py`, `tools/music.sh` | Original score, all synthesised:<br>• warm FM electric piano, pad, Karplus-Strong plucks, light drums, round bass;<br>• the bar length is set so bar 12 lands exactly on the payoff word;<br>• the drums drop on the turning-point line and come back on the next;<br>• the chords resolve to the tonic on the payoff.<br>`music.sh` sets it about 17 dB under the voice and brings it up over the end screen. |
