# Gotchas

Each of these cost a re-render at least once.

| Symptom | Cause | Fix |
|---|---|---|
| A 3D group (racks, tiles, cards) vanishes or flattens for part of a cue | `opacity` (or `filter`, or `mask`) on a `transform-style: preserve-3d` element flattens it | Fade the leaf elements or the perspective container's children individually. Never set opacity on the `.d3` rig. |
| 3D content shows outside the ink reveal for a few frames | Children of a preserve-3d rig can escape an ancestor's mask while it animates | Keep the rig at `opacity: 0` until the reveal finishes (`ep(T, in + inkDuration, in + inkDuration + 0.12)`). |
| Text on a glass bar becomes unreadable when something lights up behind it | Translucent glass shows bright content through it | Make the surface near-opaque (`rgba(18,16,22,0.97)`), add a dark halo behind it, and dim the background objects. |
| Holes punched in a behind-the-speaker graphic | White background objects (buildings, sky, signs) detected as captions | Raise `MG_TOP_ROWS` to where captions start, or use `--no-captions`. Check with `mg check`. |
| A graphic shows through a caption letter as it fades in | The caption matte only catches near-pure white | Usually acceptable. Otherwise lower `MG_CAPTION_MIN` a little, or move the graphic off the caption band. |
| `getImageData` throws, canvas is "tainted" | The page was loaded from file:// | `render.mjs` serves the project over http. Always render through `mg`. |
| A card or quiz has no background in some frames | `update` set `style.background = ''` on one branch, wiping the CSS | Set an explicit value on every branch. |
| Footage tile is a frame off, or slightly off in colour | Seeking by time instead of frame number, or a bt601 conversion | Use `mg footage` (frame-exact select) and the `mg` encoders (bt709). |
| Ranges come out NaN or a render covers the wrong span | zsh doesn't split `$var` into words (`set -- $r` fails) | Pass explicit arguments, or use `${=var}`. |
| `Unrecognized option 'vsync'` | ffmpeg 7+ removed `-vsync` | Use `-fps_mode passthrough`. |
| ffmpeg drops frames or rebuilds the filter graph mid-encode | Chromium saves fully opaque screenshots as RGB and others as RGBA | Overlay through `format=yuva444p` (as `mg` does), or normalise every PNG to RGBA first. |
| The video starts but the encode stops early | `shortest=1` and a missing frame range | `blur.py` fills gaps with blank symlinks. Re-run it with the total frame count. |
| A render reading the source fails after files were reorganised | The source moved while a long render was running | Leave a symlink at the old path until the render finishes, then remove it. |
| Random-looking particles jump between frames or processes | `Math.random()` | Use `seeded(seed)` and derive everything from `T`. |
| Fonts fall back to Times in the first frames | The screenshot ran before fonts loaded | `render.mjs` waits for `document.fonts.ready` and `assetsReady`. Add every image through `preload`. |
| Huge memory use or slow frames | A canvas sized for the full 4K frame on every tile | Size canvases from their on-screen scale (`drawFootage`), and cache footage frames near `T` only. |
| A matte or template built from a 16-bit PNG comes out empty | Pillow opens some 16-bit RGB PNGs as 8-bit | Check the dtype after `np.asarray` and divide by 255 or 65535 to match. |
| A blur or band turns to NaN or inf | A float64 or non-contiguous array was passed to `Image.fromarray(..., 'F')` | Pass `np.ascontiguousarray(channel, np.float32)`. |
| Blotchy dark patches in a fill or blur | 8-bit normalised convolution quantises the weights | Do the convolution in float (a separable Gaussian in numpy), at quarter size for speed. |
| The whole page fails with `Identifier 'FPS' has already been declared` | Every scene file shares one global scope, and two of them declared the same `const` | Give each file's constants distinctive names (`CUT_FPS`), or wrap the file in a block. |
| PIL `box offset can't be negative` when scaling about an anchor | A crop-box resize fails when the zoom is below 1 | Use an `Image.AFFINE` transform about the anchor instead. |
| Graphics pinned to the body drift off in punch-in shots | The footage was reframed after the graphics were placed | Scale those positions about the same anchor with the same `zoom_at(frame)` as the reframe. |
| Trashed files can't be removed for good | macOS blocks the session from `~/.Trash` ("Operation not permitted") | Delete with `rm` once the user has approved the list; never `trash`. |
