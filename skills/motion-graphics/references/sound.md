# Sound effects

Sound is half of why the graphics felt "magical". Every effect is synthesised in `scripts/sfxlib.py` from noise, sines and FFT reverb, so there is nothing to license and every hit lands on its exact frame.

## Rules

- **The voice is sacred.** No ducking, compression, EQ or loudness normalisation. Noise removal only if the user said yes when asked (see `raw-footage.md`). The stem is mixed on top with `amix=normalize=0`. Ask before adding effects at all; once the user approves, keep them under the voice.
- **Levels.** Most effects sit between −24 and −34 dB in `place()`. Impacts on hero words can go to −11 to −16. The finished stem peaks around −12 dBFS, and `finish()` pulls it down only if it goes over −6.
- **One sound per visual event.** If nothing moves on screen, nothing makes a sound. Small elements get small sounds: tick, pop.
- **Pan with the picture.** A graphic on the right is panned right (`pan` 0.4–0.7). `width=1` slightly decorrelates the channels for big, airy sounds.

## Vocabulary

| Visual | Sound |
|---|---|
| Ink reveal, a panel arrives | `whoosh(0.4–0.7, 300, 3500)` |
| Flash exit back to the speaker | `flash_whoosh(cut)` (a rising whoosh ending on the cut) |
| Hero word, a counter lands, a big reveal | `impact(size, low)`, often with `shimmer(0.9–1.2)` |
| Build-up before a hit | `riser(duration)` |
| Typing in a URL or terminal | `keys(count, duration)` or one `tick()` per letter |
| Pills, badges, buttons, seats | `pop(start, end)`, with pitch rising through a cascade |
| Success, unique items, lighting up | `chime(note)` (use a scale for sequences) |
| Errors, doubt | `glitch(duration)` |
| Something breaking | `shatter()` |
| Stamping a document | `stamp()` |
| Call ending | `hangup()` |
| Machinery and racks powering on | `thunk(pitch)` in a staggered run |
| Time reversing, a counter rolling back | `rewind(duration)` |
| Warm resolution, the end card | `swell(duration, notes)` |
| Tension under a dark scene | `drone(duration)` |

## Workflow

1. Copy each cue's beat constants into `sfx.py` comments, then place sounds at those times.
2. `mg sfx <project>`, then `mg preview <project> --sfx out.mp4`, then listen through once on speakers and once on headphones.
3. When a cue's timing changes, change its sounds in the same edit.

## Music

Compose it; don't license it. A track from the user's Downloads (an afrobeat loop) was rejected outright with "come up with yours. something that fits". Never use outside music without asking.

`examples/teach-once/tools/music.py` synthesises a full score with nothing to license:
- an FM electric piano;
- a detuned pad;
- Karplus-Strong plucks;
- a kick, snap and hats;
- a round bass.

What made it fit:
- **Bar length from the payoff.** Set `BAR = payoffTime / n` so a downbeat lands exactly on the payoff word. Count bars back from there for the rest of the structure.
- **Structure follows the script.** Bars 0–1 are an intro, then the beat comes in. The drums drop out on the turning-point question and come back on the answer. The chords resolve to the tonic on the payoff word and ring out over the end card.
- **Calm and warm for a product video.** Use a slow major-seventh progression with a light beat, not a launch-trailer build.
- **Level.** The first mix was "a bit louder" than wanted. `music.sh` sets it about 17 dB under the voice while she speaks (−23 dB on a −15 LUFS score) and raises it to about −11 dB over the end card. It is mixed at unity gain, with no ducking.
