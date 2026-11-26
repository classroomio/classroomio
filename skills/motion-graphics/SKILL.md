---
name: motion-graphics
description: Design and render cinematic motion graphics on top of an existing video (launch films, product announcements, talking-head explainers, ads), leaving the footage and voice untouched unless the user asks (it asks before any audio edit). Covers cue planning from word-level transcripts, HTML/CSS/canvas scenes rendered frame by frame with headless Chromium, motion blur, 3D camera moves, ink reveals, light flashes, particle dissolves, graphics that sit behind the speaker (Apple Vision person matte plus a burned-in-caption matte), live footage inside graphics, synthesised sound effects and original music mixed under the voice, cuts, grade and punch-ins on raw iPhone footage, hiding a third-party logo on the speaker's clothing, 1080p previews, a full-resolution final and ProRes 4444 alpha layers for an editor. Use this skill whenever the user wants motion graphics, animated overlays, kinetic type, explainer animations, "magical" or "cinematic" visuals, VFX-style inserts or sound design added to a video, or wants to replicate the ClassroomIO launch-video graphics — even if they only say "make this video pop" or "add graphics to my video".
user-invocable: true
---

# Motion graphics on an existing video

Turn a finished recording into a film with graphics that feel designed, not templated. The graphics are web pages rendered one frame at a time, so anything a browser can draw (3D transforms, canvas particles, SVG light trails, real photos, real logos) can be animated with exact, repeatable timing. A command-line tool, `scripts/mg`, runs the whole pipeline.

This skill mainly adds graphics and sound. When the user hands over raw footage and asks for the edit as well (cuts, grade, punch-ins, original music, removing a logo), see `references/raw-footage.md`.

## What the user cares about

These come straight from the person this skill was built with. Treat them as the brief unless told otherwise.

- **Leave the source alone unless asked.** By default, graphics go on top of the untouched picture and audio. Picture edits (cuts, grade, punch-ins) happen only when the user asks for them.
- **Ask before touching the audio.** Before any audio work, ask whether the user wants the audio edited at all: noise removal, cutting off-camera voices, a quiet or humming first second. Make no audio change without a yes. Even then, the voice is never ducked, compressed, EQ'd or loudness-normalised. Sound effects and music are separate stems mixed at unity gain under it.
- **Graphics may replace the picture.** A full-frame graphic can cover the speaker while their audio keeps playing. Roughly half the film as graphics was welcome.
- **Extraordinary, not basic.** A first pass of flat cards on brand colours was rejected as "nothing wow, not magical". What landed:
  - dark cinematic panels with grain, vignette and ink reveals;
  - real photos of real-looking people (Unsplash);
  - real product and tool logos (Simple Icons);
  - an editorial serif italic for the payoff word;
  - 3D camera moves;
  - motion blur;
  - light, particles and sound design.
  Brand colour is an accent, not the whole palette.
- **Explore widely, then propose.** For every moment, sketch several graphic ideas yourself before showing anything. Discard the weak ones and show the user only the strongest two or three per cue, each with what happens on screen. Ask which ones they want, and wait for a go-ahead before rendering. Taste calls belong to the user.
- **Keep every version.** Never overwrite earlier renders.
  - Deliverables go in the project folder: `Original.MOV`, `1080p.mp4`, `1080p (no sound effects).mp4`, `4K.mov`.
  - Alternatives for the user to compare go in the same folder with clear names, like `1080p (caption band).mp4`. Don't put them in a subfolder.
  - Once the user picks one, move the old main files into `previous/<n> <what it was>/` and rename the pick to `1080p.mp4`.
- **Ask before deleting anything.** When the work is done, list the intermediate files with their sizes and ask which ones to delete. Delete only what the user picks, and delete it permanently with `rm`, not `trash`: the session can't empty the macOS Trash afterwards.
- **No third-party brands.** A logo on the speaker's clothing or in the room that belongs to another company has to go. Spot it during the first look, raise it before building, and offer the fixes in `references/raw-footage.md`.
- **Work around burned-in captions.** Behind-the-speaker graphics must leave both the speaker and the captions in front.
- **Never drop the sign-off.** If the speaker says a URL or call to action at the end, it gets a hero moment that hands off cleanly to the end card.

## Requirements

Run `scripts/mg doctor`. It checks every item below and says how to fix anything missing.

- **ffmpeg 6+.**
- **Node 18+ and Playwright with Chromium.** It is found in any `node_modules`, including pnpm's store, above the project or the skill. You can also set `MG_PLAYWRIGHT`.
- **Python 3 with numpy and pillow.** A venv is created in `~/.cache/motion-graphics` if needed, or set `MG_PYTHON`.
- **`whisper-cli`** (whisper.cpp) and a model, for word timings. Set the model with `MG_WHISPER_MODEL`.
- **macOS `swiftc`**, for behind-the-speaker person mattes (Apple Vision). Without it, skip behind cues or treat them as full-frame cues.

## Steps

### 1. Set up and study the footage

```bash
MG=skills/motion-graphics/scripts/mg
$MG init ~/Videos/marketing/<slug>/motion /path/to/source.mov   # project folder + motion.json
$MG transcribe <project>                                         # transcript/words.txt
$MG look <project> 5 20 45 90                                    # framing, captions, end card
```

Read `transcript/words.txt` end to end. Then note:
- where the speaker sits;
- where the captions are and what colour they are;
- what the background looks like (white walls and sky matter, see step 4);
- where the end card starts;
- any third-party logo on clothing, a mug or a screen;
- off-camera voices, hum or a noisy first second in the audio.

Then ask whether the user wants the audio edited at all, before doing any audio work.

### 2. Plan cues and get approval

Read `references/craft.md` before planning. For each moment, sketch several graphic ideas, at least four or five in different directions:
- a literal illustration of the line;
- a metaphor;
- the real product UI doing the thing;
- data or a counter;
- type alone.

Pick the strongest two or three for each moment. When a line describes something the product does, one option should show the real product UI doing it, like the course page in `references/examples/teach-once/`.

List the cues as a table with these columns:
- id;
- in → out, in seconds, taken from word timings;
- the line being said;
- what happens;
- type: full frame, behind the speaker, beside the speaker, or transition.

Tie every beat to a word. Show the options per cue and ask which ones the user wants, then wait for a yes. When the user asks for more moments, explore and suggest them first, then build.

### 3. Build scenes

- **Where scenes live.** Each cue is a `scene({ id, in, out, behind?, build, update, prepare? })` in `scenes/*.js`. Add one `<script>` per file in `index.html`.
- **Timing.** `update` must be a pure function of time `T`, so any frame can be rendered alone, in any order, by any of several processes. Use `ep`, `spring`, `kick`, `lettersIn` and `scramble`, never CSS animations or timers.
- **The cinematic look.** Use `cinematicPanel` plus `updateCinematic` for the ink reveal, grain, vignette and flash exit.
- **Recipes.** `references/recipes.md` maps each recipe (call wall, particle dissolve, glass card, 3D browser with callouts, terminal, light trails, server corridor, click-ripple ending and more) to working code in `references/examples/classroomio-launch/`.
- **Images.** Put images in `img/<folder>/` and run `$MG manifest <project>`. `references/assets.md` covers faces, logos, ink and licences.
- **Live footage inside a graphic.** Run `$MG footage <project> <from> <to>` and use `footageClip` with `drawFootage`.

Check every cue with contact sheets, not by imagination:

```bash
$MG check <project> 12.8 13.4 14.0 15.6 16.5 17.4   # composited over the real frames → check/sheet.jpg
```

Look at the sheet yourself. Check that text is readable, nothing covers the speaker's face by accident, transitions start and end cleanly, and the composition holds at every sampled time.

### 4. Behind-the-speaker cues

Give the scene `behind: [from, to]`, then run `$MG mattes <project>`. This extracts those frames and builds a person matte (Apple Vision) plus a caption matte (pure-white text). Graphics are then cut away wherever either matte is.

White objects in the background can be mistaken for captions and punch holes in the graphic. Restrict caption detection to the band where captions live, for example with `MG_TOP_ROWS=0.55 $MG mattes <project>`. Use `--no-captions` when there are no captions. `references/pipeline.md` lists every knob.

### 5. Sound

Edit `sfx.py` in the project and place sounds from `scripts/sfxlib.py` on the frame where each visual happens. Available sounds:
- whoosh, riser, impact, tick, pop, chime, shimmer;
- glitch, shatter, stamp, keys, swell, rewind, thunk;
- `flash_whoosh(cut)` for flash exits.

Then run `$MG sfx <project>`. `references/sound.md` covers levels and taste.

For music, compose an original score timed to the words; `references/sound.md` covers how. Never use a track from the user's Downloads or any licensed music without asking.

### 6. Preview and get feedback

```bash
$MG render <project>                              # 1080p, 4 parallel jobs, motion blur, mattes
$MG preview <project> --sfx <out-with-sfx.mp4>
$MG preview <project> <out-original-audio.mp4>    # audio stream copied bit for bit
open <out-with-sfx.mp4>
```

For one changed cue, re-render only its range: `$MG render <project> --from 100.6 --to 104.1 --jobs 2`. Other frames are kept.

### 7. Deliver

Run these only after the user approves the preview. A 4K render takes 1–2 hours for a 2-minute film, so say so before you start.

```bash
$MG render <project> --scale 2                          # 3840×2160 graphics
$MG final <project> "<source folder>/<Name>/4K.mov"      # source + graphics + effects, HEVC, bt709
$MG layers <project> <dir>                              # optional: per-scene ProRes 4444 alpha clips
```

Organise the deliverables:
- Move the source into `<Name>/Original.<ext>`. If a render is still reading the source, leave a temporary symlink at the old path and remove it afterwards.
- Copy the previews in as `1080p.mp4` and `1080p (no sound effects).mp4`.
- Report what changed, where everything is, and what was done to the audio: nothing, or only what the user approved.

### 8. Clean up

A project can grow to many gigabytes: ProRes masters, PNG frames, mattes, old versions. Once the user is happy, list what is left in groups with their sizes:
- leftovers nothing uses any more;
- old versions in `previous/`;
- files needed to rebuild the video.

Say what deleting each group costs, for example "any further change means re-rendering from the source". Ask which ones to delete, then `rm` only those.

## References

| Need | File |
|---|---|
| Creative direction: what makes it feel cinematic, cue planning, timing to words, type, colour, pacing | `references/craft.md` |
| Recipe → working code in the launch-film and teach-once examples | `references/recipes.md` |
| Raw footage: audio question, cuts, grade, punch-ins, hiding third-party logos | `references/raw-footage.md` |
| Engine API, render pipeline, motion blur, mattes, encoding and colour, performance | `references/pipeline.md` |
| Bugs already paid for (3D opacity, masks, glass legibility, ffmpeg flags…) | `references/gotchas.md` |
| Sound-effects design and mixing | `references/sound.md` |
| Faces, logos, ink, fonts, licences and credits | `references/assets.md` |
