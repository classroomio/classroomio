---
name: brand-system
description: The ClassroomIO marketing brand system — the Bone colour foundation, type scale, motion language and components used for changelog videos, social cuts, YouTube thumbnails, academy materials, marketing carousels and the site. Use this whenever producing ANY ClassroomIO marketing or brand asset, deciding what colour something should be, building an animated video frame or a thumbnail, or designing a marketing page — even if the user doesn't name the design system, and before inventing any colour, type size or animation value of your own.
---

# ClassroomIO brand system

Everything marketing-facing draws from one foundation so that a changelog video, a
carousel and a landing page look like the same company made them. Values live in
`tokens.css` and nothing downstream redefines them.

Consume it, never copy it:

```html
<link rel="stylesheet" href="<skill>/tokens.css" />
<link rel="stylesheet" href="<skill>/motion.css" />
<link rel="stylesheet" href="<skill>/components.css" />
<link rel="stylesheet" href="<skill>/stage.css" />   <!-- fixed-canvas assets only -->
```

`reference.md` is the full written system. `palette.html` is the visual colour reference.
`examples/` holds two working thumbnail templates — read one before building a new asset;
they show the composition that works rather than describing it.

This skill replaces the former `create-thumbnail` skill, which carried a second and
conflicting brand palette (royal-blue gradients, teal and violet accents). Blog covers,
YouTube thumbnails and video frames all come from the foundation here now. If you find an
asset still built on those old gradients, it predates this and should be rebuilt, not
matched.

## The three rules that matter most

**Blue should be obvious, not ambient.** `#0233BD` is the colour people should remember us
by, so every asset needs a blue element big enough to register at a glance — a filled chip,
the key word in a headline, the live state, the CTA. If someone has to hunt for the blue,
there isn't enough of it.

**Blue is a mark, not a ground.** It goes on the thing that carries meaning. It does not go
on the field, and it does not land on every badge, bar and icon in the same frame.

**On a dark field, blue is a fill, not type.** `#0233BD` is too dark to read as letterforms
on Ink, so as type it has to step to `#ADC3FF` — a tint, not the brand colour. Put it behind
white text instead (`.display-mark`, `.chip`) and the real brand blue stays in the asset.
This is why Navy was rejected as a field: nothing on it could be true `#0233BD`.

## Fields

A field is the ground an asset sits on, applied as one class. `--accent` resolves to the
real brand blue on every field.

| Class | Field | Use |
| --- | --- | --- |
| `.field-bone` | `#EFE9DD` | Default. Warm and quiet, so blue means something. |
| `.field-dark` | `#17140F` | Bone's own shadow. Feed contrast, hook frames, covers. |
| `.field-blue` | `#0233BD` | Rare. The one asset in a run that has to shout. |

Alternate Bone and Bone 300 across a sequence or down a page so it breathes. Drop in a dark
or blue field at most once per run.

## Type, space, motion

Type is the subject: display runs 176–228px hard against the 104px gutter and may bleed off
the edge. Nothing is centred. Monospace carries metadata — kickers, annotations, counts —
never body copy.

Motion is entrance only: one easing curve, three durations. Things arrive and stay. Nothing
loops or breathes, because these assets sit under a voiceover or a reader's attention and
competing with either is a bug.

## Animated frames

`stage.css` + `stage.js` give a fixed canvas (any size via `data-w`/`data-h`) whose reveals
are stepped **by hand**, so a frame lands on the spoken word rather than on a timer:

- `data-beat="n"` — hidden until beat n
- `data-beat-until="n"` — fades at beat n but keeps its box
- `m-rise` / `m-left` / `m-still`, staggered with `style="--delay:.1s"`
- Keys: `space` next, `←` back, `R` reset, `T` cycle field, `F` fullscreen, `H` hide HUD
- Params: `?beat=`, `?clean=1`, `?auto=1400`, `?theme=bone|dark|blue`

## Traps worth knowing before you debug them

- `data-beat` is the reveal selector, so nothing else may carry that attribute — including
  `<body>`. Scenes read the beat from `document.body.dataset.currentBeat`.
- A scene rule setting `opacity` on an element that also has `data-beat` outranks
  `[data-beat]{opacity:0}` and the element never hides. Use an alpha colour instead.
- Short generic class names collide with the component layer. `.node` and `.rule` already
  exist; redefining them silently breaks layout. Namespace asset-local classes.
- Don't anchor an element to a fixed bottom offset if it must clear grid cards — cards
  stretch to their tallest sibling and grow into the gap.

## Producing a PNG

`render.py` is the way to get a final image — it inlines the stylesheets and embeds Geist
as base64, so a render can never come out in a fallback face the way a webfont race does.
It hides the operator HUD automatically and reads the canvas size from the stage.

```bash
python3 render.py examples/thumb-youtube.html out.png
python3 render.py "examples/thumb-youtube.html?theme=dark" out-dark.png
python3 render.py "examples/thumb-mobile.html?theme=dark" out-mobile.png 1080x1920
python3 render.py "08b-learning-paths.html?beat=3" frame.png     # a mid-beat film frame
```

No server needed. Render after any edit and look at the result — overflow, a missing
reveal and a collided element are all invisible in the markup and obvious in the PNG.

Two checks worth running after a batch of edits: that every `var(--…)` resolves against
`tokens.css`, and that no asset-local `opacity` rule targets a `data-beat` element (it
outranks the reveal system and the element never hides).

## Surfaces

- **Changelog video** — Bone throughout, one dark frame for cover or sign-off. The version
  is a blue chip; each shipped item takes the blue as it lands.
- **Social video** — dark for the hook frame, Bone for the body.
- **YouTube thumbnails** — see `examples/thumb-youtube.html`. Dark wins in the grid; Bone
  wins when a product screenshot has to read as a separate object.
- **Academy materials** — Bone page, Paper cards, Bone 300 between sections. Blue only on
  the action a learner should take.
- **Carousels** — alternate Bone and Bone 300 slide to slide. Cover on dark, one blue
  element per slide.
- **Site** — fields become page sections. The gutter becomes the page gutter. `.panel` is
  the product-shot treatment, `.chip` + `.leader` the feature annotation. Grain stays.
