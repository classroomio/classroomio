# ClassroomIO design system

One source of truth for colour, type, space, motion and components — used by marketing
assets, animated video frames, and the site.

```
tokens.css      values only: ramp, blue, fields, type scale, space, motion
components.css  components built purely on tokens
motion.css      the motion language and the beat reveal system
stage.css       fixed-canvas runtime for video frames and thumbnails
stage.js        beat stepping, field switching, fit-to-window
```

Consume it as:

```html
<link rel="stylesheet" href="<skill>/tokens.css" />
<link rel="stylesheet" href="<skill>/motion.css" />
<link rel="stylesheet" href="<skill>/components.css" />
```

## Fields

A field is the ground an asset sits on, applied as one class. `--accent` is the real
brand blue on **every** field — on dark it carries a fill rather than type, which is what
keeps `#0233BD` in the asset instead of a tint of it.

| Class | Field | Use |
| --- | --- | --- |
| `.field-bone` | `#EFE9DD` | The default. Warm, quiet, lets blue mean something. |
| `.field-dark` | `#17140F` | Bone's own shadow. Feed contrast, hook frames, covers. |
| `.field-blue` | `#0233BD` | Rare. The one asset in a run that has to shout. |

| Token | Bone | Dark | Blue |
| --- | --- | --- | --- |
| `--accent` (fills) | `#0233BD` | `#0233BD` | white |
| `--accent-ink` (text on fill) | paper | white | `#0233BD` |
| `--accent-text` (blue as type) | `#0233BD` | `#ADC3FF` | white |

## Rules

**Blue should be obvious, not ambient.** Every asset needs a blue element big enough to
register at a glance. If someone has to hunt for it, there is not enough.

**Blue is a mark, not a ground.** It goes on the active item, the number that matters, the
action — not on every badge, bar and icon at once. `.field-blue` is the deliberate
exception, and using it spends the accent: on a blue field the accent resolves to white,
so nothing can be blue to stand out. Use it for an asset that shouts, not one that points.

**Type is the subject.** Display runs 176–228px hard against the gutter and may bleed off
the edge. Nothing is centred.

**Monospace carries metadata.** Kickers, annotations, counts. Never body copy.

**State colour is a dot.** `--ok` and `--warn` as one dot or one number, never a badge plus
a bar plus a tick for the same fact.

**Motion is entrance only.** One easing curve, three durations. Things arrive and stay —
nothing loops or breathes, because these sit under a voiceover or a reader's attention.

## Surfaces

- **Changelog video** — Bone throughout, one dark frame for cover or sign-off. The version
  is a blue chip; each shipped item takes the blue as it lands.
- **Social video** — dark for the hook frame, Bone for the body.
- **Academy materials** — Bone page, Paper cards, Bone 300 to separate sections. Blue only
  on the action a learner should take.
- **Carousels** — alternate Bone and Bone 300 slide to slide. Cover on dark, one blue
  element per slide.
- **Site** — fields become page sections and alternate the same way. The gutter becomes the
  page gutter. `.panel` is the product-shot treatment, `.chip` + `.leader` the feature
  annotation. Grain stays.

## This is not the product design system

Marketing and product are deliberately separate systems, and these tokens stay in this
skill. Do not move them into `packages/ui`, do not import `@cio/ui` tokens here, and do
not "reconcile" the two palettes — they are already different on purpose:

| | Product (`packages/ui`) | Marketing (here) |
| --- | --- | --- |
| Ground | `oklch(1 0 0)` — pure white | Bone `#EFE9DD` |
| Blue | `oklch(0.488 0.243 264.376)` | `#0233BD` |
| Type | dense, functional, small | display type at a quarter of the canvas |
| Job | comprehension in a dense interface, hours at a time | attention at a glance, seconds at a time |

A product UI has to stay quiet while someone works inside it for an hour. A thumbnail has
half a second in a feed. Those are opposing constraints, and a single token set serving
both would either flatten the marketing or shout in the app.

The shared thing is the brand, not the values — same logo, same Geist, same voice.
