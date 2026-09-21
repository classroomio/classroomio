# design-sync notes — ClassroomIO Brand System

## Shape

Off-script. This repo's marketing system is **CSS-first**: custom properties, classes and
static compositions. There are no compiled components, so there is no `_ds_bundle.js` and
no `.d.ts` prop contracts — `.chip` is a class, not a `<Chip>`. The design agent composes
with the class vocabulary, which is why `conventions.md` carries the full class and token
tables rather than a short pointer.

`_ds_sync.json` is deliberately omitted: the anchor's key recipe assumes the package or
storybook shapes. Without it, the next sync re-verifies and re-uploads everything, which
is correct and cheap at this size (29 files).

## Do not sync packages/ui here

`packages/storybook/.storybook/main.ts` exists and drives `@cio/ui`, the **product** Svelte
library. That is a separate design system with a different ground (pure white) and a
different blue (`oklch(0.488 0.243 264.376)` vs `#0233BD`). It is deliberately not synced
into this project. If it is ever wanted in Claude Design it belongs in its own project.

## Traps hit during the first sync

- **`@import` must precede every other rule in a stylesheet.** `styles.css` originally had
  `@font-face` above the imports, which silently invalidated all of them — every card
  rendered with unresolved tokens in a serif fallback. Rendering a card is the only way
  this shows up; the file parses fine and nothing errors.
- Designs receive only `styles.css`'s transitive `@import` closure, so any real CSS must be
  reachable from it. There is a closure check in the build steps below.

## Rebuilding the bundle

The bundle is assembled from `skills/brand-system/`:

- `styles.css` — imports first, then `@font-face`, then base `body` rules
- `tokens/` — tokens, motion, components, stage CSS copied verbatim
- `components/{foundations,components,compositions}/<Name>/<Name>.html` — each with
  `<!-- @dsCard group="…" -->` as its literal first line
- `_preview/*.png` — compositions rendered via `skills/brand-system/render.py`, resized to
  1400px wide
- `fonts/geist-latin.woff2` from `apps/dashboard/static/fonts/geist/`

Verify before uploading: render every card headless and check it is not blank or
fallback-serif, and confirm every token and class named in `conventions.md` exists in the
built CSS.
