# Raw footage: the edit around the graphics

Sometimes the user hands over a raw phone recording and wants the whole film, not only graphics. Everything here happens only when the user asks for it. Working code is in `examples/teach-once/`.

## Audio: ask first

Before any audio work, ask whether the user wants the audio edited at all. Say what you heard, then let them choose. For example: "There's an off-camera voice in the first 0.1 s and some room hum. Should I clean the audio, or leave it as recorded?"

If they say yes:
- **Noise removal** is the only processing allowed on the voice. Never duck, compress, EQ or loudness-normalise it.
- **Start on the speaker.** Cut an off-camera voice or a humming first second by trimming the start of the film. Don't fade it, because a fade still lets the noise through.
- **Check the first 0.2–4 s by ear and by level.** A quiet or noisy opening was reported three times on this project before it was right.
- Effects and music stay separate stems, mixed at unity gain under the voice (`amix=normalize=0`).

## Picture

| Step | How | Code |
|---|---|---|
| Cut the pauses | Cut from word timings: end each segment on a word and keep breaths short. End the film on the payoff word, then the outro. | `master.sh` |
| Grade an iPhone HLG clip | Bake the look into a 3D LUT that ffmpeg's `lut3d` applies. Compare looks on stills before choosing. Deliver SDR BT.709. | `grade.py` |
| Hide jump cuts | Make every other shot a punch-in (1.12–1.19×) anchored on the face, and push every shot in a few percent. | `reframe.py` |
| Keep graphics aligned with punch-ins | Anything pinned to the body (captions, a band, a paint-out) is scaled about the same anchor with `zoom_at(frame)`. | `band.py`, `captions.js` |

## Third-party logos

Check every look frame for another company's logo on clothing, mugs, screens or the wall. Raise it before building. If it can't be reshot, offer two fixes and render both so the user can compare.

| Fix | Result | Cost |
|---|---|---|
| **Caption band** (`band.py`): a full-width frosted, darkened band over the logo that scales with each shot's zoom. The captions move inside it (`CAPTION_BAND` in `captions.js`). | The logo is gone in every frame. The user chose this one. | A dark stripe over about a quarter of the frame, which also covers hands passing in front of it. |
| **Paint-out** (`delogo.py`): match a template of the logo per frame, then fill with the surrounding fabric colour. Guard the mask with the person matte, skin-colour rules and Apple Vision hand zones (`pose.swift`). | Natural; reads as a plain shirt. | Small flecks or thin lines next to fast, motion-blurred hands. About 0.55 s per frame. Needs a frame-by-frame review. |

Render both as `1080p (caption band).mp4` and `1080p (logo removed).mp4` in the project folder, and let the user choose.
