# ClassroomIO brand system — marketing

This is the **marketing** system: changelog videos, social cuts, thumbnails, academy
materials, carousels and marketing pages. It is deliberately **not** the product design
system — the app has its own tokens with a different ground and a different blue. Do not
mix them.

There is no component bundle. This is a **class-based CSS system**: compose with the
classes below and the design is on-brand. Read `styles.css` and its imports
(`tokens/tokens.css`, `tokens/components.css`, `tokens/motion.css`) for the full truth.

## Set a field, always

Every asset sits on a **field** — one class that sets every other colour. Put it on the
root element of whatever you build. Without one you inherit the Bone defaults, which is
usually right, but naming it is clearer.

```html
<div class="field-bone">…</div>   <!-- default: warm, quiet -->
<div class="field-dark">…</div>   <!-- feed contrast, hook frames, covers -->
<div class="field-blue">…</div>   <!-- rare; spends the accent -->
```

## Colour: one warm ramp, one blue

Never write a hex value. Use the tokens:

| Purpose | Token |
| --- | --- |
| Field, and its deeper letterbox | `--field`, `--field-deep` |
| Text: primary / secondary / inactive | `--fg`, `--fg-muted`, `--fg-faint` |
| Hairlines and borders | `--line` |
| Accent fill, and text on that fill | `--accent`, `--accent-ink` |
| Accent as letterforms | `--accent-text` |
| Cards lifted off the field | `--surface`, `--surface-fg`, `--surface-line`, `--surface-sunk` |
| Ramp steps | `--paper`, `--bone-100`, `--bone`, `--bone-300`, `--ink-800`, `--ink` |
| Brand blue | `--blue`, `--blue-300` |
| State | `--ok`, `--warn` |

**`--accent` is the real brand blue on every field.** On a dark field the deep blue cannot
carry letterforms, so it carries a *fill* instead — use `.display-mark`, not `em`. That is
what keeps `#0233BD` in the asset rather than a tint of it.

**Blue should be obvious, not ambient.** Every asset needs one blue element big enough to
register at a glance. It must not be the background, and it must not land on every badge,
bar and icon at once.

## Classes

| Class | What it is |
| --- | --- |
| `.kicker` | Mono eyebrow with an accent square; the label at the top of an asset |
| `.display` | The headline. Add `.wrap` to allow line breaks |
| `.display em` | The accent word, as type. Light fields only |
| `.display-mark` | The accent word as a blue fill. Use this on `.field-dark` |
| `.headline` | Secondary heading |
| `.body` | Body copy; `<b>` inside lifts to `--fg` |
| `.mono` | Metadata — uppercase, tracked. Never body copy |
| `.stack` + `li` + `.lit` + `.n` | Stepped list; `.lit` marks the active item |
| `.chip`, `.chip.mono`, `.chip.plain` | Annotation chip. Blue fill by default; `.plain` over imagery |
| `.chip .dot` | The leading dot inside a chip |
| `.leader` | SVG leader line from a chip to the thing it names |
| `.panel`, `.panel-bar` | A product shot composed as one floated panel |
| `.rule`, `.rule.accent` | Hairline; `.accent` is a 5px blue bar |
| `.mark` | The logo lockup |

## Sizing: set the canvas, not the numbers

Nothing is tied to a fixed size. Every dimension is a multiple of `--u`, derived from
`--canvas`. Set the canvas and type, gutter, spacing and travel rescale together.

```html
<body class="brand-web">                  <!-- --canvas tracks the viewport -->
<div style="--canvas: 1080px">            <!-- a carousel slide, a vertical cut -->
```

Sizes are written at their 1920 value — `--size-display-xl` is `228 * --u` — so the numbers
stay legible. Use `--size-display-xl`, `--size-display`, `--size-headline`, `--size-title`,
`--size-body`, `--size-mono` and the `--space-*` scale rather than pixel values.

## Type is the subject

Display type runs large and hard against the left gutter, and may bleed off the right edge.
Nothing is centred. Monospace carries metadata only.

## How much text

There is no single ceiling — it depends on whether the asset is watched or read, and
whether anything other than the screen carries the meaning. Social autoplays muted, so it
needs *more* on-screen text than a film frame with a voiceover, not less.

| Surface | Ceiling |
| --- | --- |
| Thumbnail in a grid | ≤5 words, one idea |
| Frame with voiceover | headline ≤8 words, no sub-paragraph |
| Social, muted autoplay | headline ≤8 words + one sub line ≤12 |
| Carousel slide | headline + ≤25 words |
| Academy material, web section | headline + a short paragraph |

Over the ceiling, **cut the sentence — never shrink the type**. The composition depends on
display type being genuinely large against the field.

## A build snippet

```html
<section class="field-bone" style="--canvas: 1440px; padding: var(--space-8) var(--gutter)">
  <p class="kicker">New in September</p>
  <h1 class="display wrap">YouTube <em>+ AI Chat</em></h1>
  <p class="body">Paste a link. The assistant <b>already knows what the video says.</b></p>
  <div class="rule accent" style="width: 320px; margin-top: var(--space-6)"></div>
</section>
```
