---
name: create-thumbnail
description: Generate on-brand ClassroomIO thumbnails (blog posts, changelogs, YouTube videos) as 1920×1080 PNGs. Builds HTML+CSS from the brand token system and renders deterministically via headless Chrome. Use when the user asks to create/make a thumbnail, cover image, or video/blog banner for ClassroomIO.
---

You are producing a **1920×1080 (16:9) ClassroomIO thumbnail** by writing an HTML file that
consumes the brand token CSS in this skill, then rendering it to PNG with `render.py`. The
output must look designed-in-Figma, not templated. The "Self-Host ClassroomIO with Dokploy"
two-tile thumbnail is the **quality bar to match or beat — it is NOT a template to clone.**

## Vary the composition — do not default to one layout

The brand system is fixed (colors, font, tiles, pills, gradients). The **composition is not.**
Every thumbnail must be a deliberate design choice, not a find-and-replace of the last one.

- **Pick the pattern from the content**, not from what you made last time (see the catalog below).
  A release is a hero icon; a guide is editorial; a multi-item feature is a concept map. Only a
  true "X with/via Y" integration should reach for the two-tile connect.
- **When you DO reuse a pattern** (e.g. a series like "self-host with Dokploy / Coolify / Railway"
  where consistency is the point), still vary within it — the focal treatment, the pill copy, the
  headline emphasis, the accent/texture. Series consistency is a choice the user should confirm,
  not your default.
- **Actively avoid** shipping three near-identical images in a row. If the last thumbnail you made
  used a layout, reach for a different one unless the user asked to match a set.
- Treat `template-two-tile.html` as **one** starting point among the patterns, not THE template.
  For other patterns, compose fresh from `thumbnail.css` classes.

If a request is ambiguous about style, propose a pattern (and, for a series, ask whether to match
the existing set) before generating — don't silently reuse the previous layout.

## Why this pipeline produces quality (do not skip these)

1. **Deterministic fonts.** Geist is embedded as base64 `@font-face`. A Google Fonts `<link>`
   does NOT load before the headless screenshot — the headline silently falls back to system
   sans and looks off-brand. This is the single biggest failure mode. `render.py` handles it.
2. **Real assets, recolored.** ClassroomIO logo = the actual `apps/website/static/logo-512.png`,
   recolored white via `filter: brightness(0) invert(1)`. Never redraw it.
3. **Official third-party logos.** For a partner/tool, fetch the OFFICIAL svg (e.g. Dokploy:
   `https://dokploy.com/icon.svg`). Prefer an svg whose paths are `fill="white"` (or force white)
   so it drops onto the blue tile cleanly. A wrong-but-close logo destroys credibility.
4. **Honest gradients, never frosted-white chips.** Tiles and pills are real blue gradients with
   iridescent borders (see `thumbnail.css`). `rgba(255,255,255,0.1)` frosted glass reads off-brand.

## Design spec (source of truth)

The full pattern catalog and Figma-exact tokens live in
`company/blog-thumbnail-agent/README.md` — **read it before generating**, alongside the six
reference PNGs in that folder. `thumbnail.css` in this skill already encodes those tokens
(background vignette, glass tiles, pills, frame, title). Consume the CSS classes; don't re-derive.

### Pick the pattern from the content (each is a distinct look — rotate them)
- **A — Editorial / link:** blog posts, guides pointing to a URL. Frame on TOP. Link pill + optional `Guide` pill. Title centered or bottom-left. No tiles.
- **B — Concept map:** multi-item features (languages, integrations) as a connected node graph over a faint globe.
- **C — Before → After:** upgrades, limit increases. Two glass tiles + arrow, action pill below, title bottom. Frame on BOTTOM.
- **D — Hero icon:** releases, security, single-concept. One big centered glass tile, version/`New Feature` pill, 2-line title. Frame on BOTTOM.
- **Two-tile connect** (C/D hybrid): "X with/via Y" integrations — two tiles joined by an arrow node. `template-two-tile.html` is a starting point. **Powerful but overused — don't reach for it by reflex.**

Beyond the pattern, vary the levers that keep a set from looking identical: background
**texture** (chevrons / stacked cards / constellation / globe — match the topic), **title
placement** (centered vs bottom-left), **pill copy**, and the **focal treatment**. A guide about
one platform often reads better as Pattern A or D (single hero) than as another two-tile clone.

## Workflow

1. **Choose a pattern deliberately** and confirm intent if unstated: pattern, the partner/tool (and
   whether to use its real logo), the headline, the pill text, and any URL. Recommend a pattern that
   fits the content; don't over-ask. If this belongs to an existing series, ask whether to match that
   set or give it a fresh look — do not silently reuse the last layout.
2. **Fetch third-party assets** if needed (official svg logo). Verify it renders white on blue.
3. **Author the HTML** in the scratchpad. Copy a template (e.g. `template-two-tile.html`) as a
   starting point, or write fresh linking `thumbnail.css`:
   - `<link rel="stylesheet" href="<abs-path-to-skill>/thumbnail.css" />`
   - Use `data:image/png;base64,__CIO_LOGO_B64__` for the ClassroomIO logo (render.py fills it).
   - Paste the partner's white svg inline inside a `.svg-icon` container.
   - Keep everything except the headline low-contrast so it reads at thumbnail size.
4. **Render:** `python3 <skill>/render.py <input.html> <output.png>`. This inlines local
   stylesheets, substitutes `__GEIST_WOFF2_B64__` / `__CIO_LOGO_B64__`, and screenshots at
   1920×1080 (device scale 1). Requires Google Chrome at the standard macOS path.
5. **Review the PNG visually** (Read the image). Check: brand font actually applied, logos correct
   and white, text not clipped, gradients present, ≤2 title lines. Iterate on the HTML if needed.
6. **Deliver:** save the final PNG to `~/Downloads/` (or a path the user names) and report it.
   Output is ~880KB — under YouTube's 2MB thumbnail cap.

## Files in this skill
- `SKILL.md` — this guide.
- `thumbnail.css` — Figma-exact brand tokens (background, tiles, pills, connector, frame, title).
- `template-two-tile.html` — starting point for the two-tile connect pattern.
- `render.py` — inlines assets + renders HTML → PNG via headless Chrome.

Brand palette: deep blue `#0233BD` · brand blue `#2F6BF1` · light blue `#ADC3FF` · violet `#8071F2`.
