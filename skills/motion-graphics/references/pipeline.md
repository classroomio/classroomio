# Pipeline

## Contents

1. Project layout
2. Engine API
3. Rendering
4. Motion blur
5. Behind-the-speaker mattes
6. Live footage inside graphics
7. Encoding and colour
8. Performance and disk

## 1. Project layout

`mg init <dir> <source>` creates:

```
motion.json      source path, fps, frame count, duration, source size, design canvas (1920×1080 or 1080×1920)
project.js       the same values for the browser (window.PROJECT) and the canvas CSS size
index.html       loads lib/, img/manifest.js and one <script> per scene file
lib/             engine.js, cinema.js, styles.css (copied, so old projects never break when the skill changes)
scenes/          your cues (example.js shows a full-frame cue and a behind cue)
sfx.py           sound cues → renders/sfx-stem.wav
fonts/           Geist, Geist Mono, Instrument Serif (all OFL)
img/             image folders + manifest.js; img/footage links to footage-tiles/
transcript/      words.txt, words.tsv, segments.srt, whisper.json
mattes/          src/ (frames), person/ (Vision), behind/ (final mattes), scenes.json
renders/         frames-<height>p/, sfx-stem.wav, previews
```

Design at the canvas size (1920×1080 for landscape). Rendering at `--scale 2` gives 3840×2160 with the same layout.

## 2. Engine API (`lib/engine.js`, `lib/cinema.js`)

```js
scene({
  id: 'K-public-api',
  in: 76.45,                  // seconds in the source
  out: 80.75,                 // the scene is mounted for in <= T < out
  behind: [76.45, 79.0],      // optional: cut out the speaker and captions in this range
  build(root, def) { return state },        // create DOM once
  update({ T, t, d, toOut, s, root, def }), // set every style from T; no memory of previous frames
  prepare(T, state, def)                    // optional async work awaited before each frame (footage)
});
```

- **Timing helpers**:
  - `prog(T, a, b)`: 0 → 1 between two times;
  - `ep(T, a, b, ease.x)`: the same, eased;
  - `spring(T, a, freq, damping)`: damped settle;
  - `kick(T, a, decay)`: a decaying hit, 1 at `a`;
  - `lerp`, `clamp`;
  - eases: `inCubic`, `outCubic`, `outQuint`, `outExpo`, `inOutCubic`, `inExpo`, `outBack`.
- **DOM helpers**:
  - `el(tag, class, parent, html)`;
  - `css(node, styles)`;
  - `letters(parent, text)` and `lettersIn(spans, T, start, opts)`;
  - `typed`, `caretOn`, `scramble(text, T, start, settle, seed)`;
  - `glow(rgb, strength)`;
  - `seeded(seed)` for deterministic randomness. Never use `Math.random()`: every frame must come out the same on every run and in every process.
- **Cinema helpers**:
  - `cinematicPanel(root, { background, grain, vignette })` and `updateCinematic(handles, T, { start, cut, inkDuration, inks, flashOut, hardCut, flashIn, effects })`. The ink reveal uses `img/ink/ink1_*.png` and `ink2_*.png` when present, and a soft disc otherwise;
  - `svgLayer(parent, filterId)`, `makeTrail(svg, d, color, filterId)`, `updateTrail(trail, T, start, duration)`;
  - `plate(parent, src, { blend })` for screen-blended light and dust;
  - `asset(folder, index)` (wraps around the folder);
  - `brandLogo(name, size, fill)` (needs `img/logos.js` with `window.LOGO_PATHS_SI`);
  - `preload(src)`, `footageClip(first, last)`, `drawFootage(canvas, image, w, h, scale)`.
- Constants `FPS`, `W` and `H` come from `project.js`.
- `full: true` scenes get the brand wipe (blue then paper). The cinematic look uses `cinematicPanel` instead.

## 3. Rendering

`mg render` splits the time range into `--jobs` equal parts and runs one headless Chromium per part. Each part:
1. Serves the project over a local HTTP server, so canvas `getImageData` isn't blocked by file:// rules.
2. Waits for fonts and `window.assetsReady`.
3. For every frame, awaits `prepareAt(t)`, runs `renderAt(t)` and screenshots with a transparent background.

Frames with no active scene become symlinks to `blank.png`. Frames are named by source frame number (`f_03023.png`), so a partial re-render (`--from`/`--to`) overwrites only its range.

`mg check` renders stills, applies the mattes, composites them over the exact source frames and tiles the results into `check/sheet.jpg`. Use it constantly.

## 4. Motion blur

With `--subframes 4` (the default), each active frame is captured 4 times across a 180° shutter (`SHUTTER=0.5` of a frame). `blur.py` then averages the captures with premultiplied alpha, so edges don't go dark, and deletes them. Fast camera moves look filmed instead of strobed. Use `--subframes 1` for quick tests.

## 5. Behind-the-speaker mattes

`mg mattes`:
1. Reads each scene's `behind` range.
2. Extracts those source frames at the canvas size.
3. Runs `person-matte` (Apple Vision `VNGeneratePersonSegmentationRequest`, accurate quality, compiled once with swiftc into the cache).
4. Runs `behind-matte.py`.

The final matte is `1 − max(person, caption)`. `mg render` and `mg check` then multiply the graphics' alpha by it inside behind ranges, and upscale the mattes automatically for 4K.

**Caption detection.** Captions are found as near-pure-white pixels. Tune them with environment variables:

| Variable | Default | Meaning |
|---|---|---|
| `MG_CAPTION_MIN` | 222 | minimum channel value for "white" |
| `MG_CAPTION_SPREAD` | 24 | max − min channel spread (keeps out tinted highlights) |
| `MG_CAPTION_DILATE` | 13 | pixels added around detected letters (outlines, shadows) |
| `MG_SKY_ROWS` | 0.3 | white regions connected to the top edge within this fraction of the height count as sky and are kept |
| `MG_TOP_ROWS` | 0.26 | ignore everything above this fraction of the height (set to where captions start, e.g. 0.55) |

Use `--no-captions` when the video has none. For coloured captions, either change the white test in `behind-matte.py` or treat the cue as full frame.

## 6. Live footage inside graphics

`mg footage <project> <from> <to>` extracts full-resolution JPGs into `footage-tiles/` and links them to `img/footage`. In a scene:
- Create `const clip = footageClip(firstFrame, lastFrame)`.
- In `prepare`, call `await clip.prepare(T)`.
- In `update`, call `drawFootage(canvas, clip.imageAt(T), cssW, cssH, onScreenScale)`.

When the tile fills the frame exactly (scale = canvasWidth / tileWidth), the cut from real footage into the graphic is invisible.

## 7. Encoding and colour

- **Colour conversion.** Graphics PNGs are RGB. Convert them to YUV with the **bt709** matrix (`scale=out_color_matrix=bt709:out_range=tv`) and overlay in yuv444. Converting with ffmpeg's default bt601 matrix shifts graphic colours and makes live-footage tiles not match the real shot. All `mg` encode commands do this.
- **`preview`.** Downscales the source to the canvas size, overlays the graphics and encodes H.264 CRF 17.
  - Without `--sfx`, the audio stream is copied bit for bit.
  - With `--sfx`, it mixes `[0:a][sfx] amix=normalize=0`, so the voice stays at unity gain.
- **`final`.** Composites at full source resolution (render with `--scale 2` for 4K) and encodes HEVC CRF 14 with the `hvc1` tag (plays natively on Apple devices), tagged bt709. Audio is AAC 320k with the effects mixed in, or copied with `--no-sfx`. The picture is re-encoded once, which overlays require. Nothing else is adjusted.
- **`layers`.** Writes ProRes 4444 with alpha (`yuva444p10le`), one clip per scene, named `<id>__at_MMmSS.SSs.mov`, with a matching timecode.
- **Verify before delivering.**
  - Frame count equals the source's.
  - The original-audio preview's audio matches the source (`cmp` on extracted streams).
  - A frame with no graphics is visually identical to the source (mean difference under 1).

## 8. Performance and disk

These are measured on an Apple-silicon laptop.

| Setting | Cost per active frame, per process |
|---|---|
| 1080p, 4 sub-frames | 2–4 s |
| 4K, 4 sub-frames | 4–9 s (heavy canvas and 3D scenes are slowest) |

With 4 jobs, a 2-minute film with half its runtime as graphics takes about 20–40 min at 1080p and 1–2 h at 4K.

Disk: about 8 GB of 1080p frames and about 30 GB at 4K, plus sub-frames while a render runs (4× the active frames, deleted by `blur.py`).
