---
name: add-docs-image
description: Add screenshots/images to ClassroomIO docs — convert source PNGs to optimized WebP, place them in apps/docs/public/, and reference them from the .mdx pages under apps/docs/content/docs/. Use when a doc page needs annotated screenshots or other images.
---

You are adding images to the ClassroomIO docs site (Fumadocs). Pages live in `apps/docs/content/docs/*.mdx`
and images live in `apps/docs/public/`, referenced with **root-relative** paths like `/my-image.webp`.

The job has three parts: optimize + convert the source image to WebP, drop it in `apps/docs/public/`, and
insert a Markdown image reference at the right spot in the page. Match the existing images exactly so the page
stays consistent.

## Conventions (match these)

- **Format: WebP.** Every docs image is `.webp`. Never reference a `.png`/`.jpg` from a page.
- **Path: root-relative.** Reference as `![alt](/name.webp)`, NOT `/apps/docs/public/...` and NOT a relative path.
  The file goes in `apps/docs/public/name.webp`; the leading `/` resolves to that folder.
- **Filename: kebab-case, prefixed by the page/feature.** e.g. `certificates-rules.webp`,
  `live-class-session-settings.webp`, `progression-locked.webp`. This keeps `apps/docs/public/` self-describing.
- **Size: width capped at 1280px (shrink only), quality ~80, metadata stripped.** Existing images land around
  20–45 KB at 1280px wide. Source screenshots (often retina, ~1 MB) must be reduced — do not commit raw PNGs.
- **Alt text: descriptive, sentence-case, no period.** Describe what the screenshot shows (and the highlight if
  any), e.g. `Certificate rules panel with the download toggle and completion threshold`. Some existing alt text
  notes an annotation, e.g. `... with a red box highlight on the add icon`.

## Step 1: Find and identify the source images

Source images are usually PNGs the user dropped in `~/Downloads`. List them:

```bash
ls -lt ~/Downloads/*.png | head
```

If the user named them to match the target (e.g. `certificates-rules.png`), the mapping is direct. Otherwise open
each with the Read tool (it renders images) and match it to the intended target by content. If you cannot
confidently match an image, ask rather than guess.

## Step 2: Convert + optimize to WebP

Check the tool (`command -v magick cwebp`). Prefer ImageMagick. The `1280>` only shrinks images wider than 1280
(never upscales):

```bash
magick "$SRC" -resize '1280>' -strip -quality 80 "apps/docs/public/$NAME.webp"
```

cwebp fallback (only pass `-resize` when the source is wider than 1280, since `cwebp -resize` upscales smaller images):

```bash
cwebp -q 80 "$SRC" -o "apps/docs/public/$NAME.webp"                 # width <= 1280
cwebp -q 80 -resize 1280 0 "$SRC" -o "apps/docs/public/$NAME.webp"  # width > 1280
```

Confirm the result is sane (roughly 1280px wide, tens of KB), and never delete the original from `~/Downloads`:

```bash
magick identify -format '%wx%h %b\n' "apps/docs/public/$NAME.webp"
```

To benchmark against existing images: `ls -la apps/docs/public/*.webp` (most are 1280px wide, ~20–45 KB).

## Step 3: Insert the reference into the page

Add the image on its own line, with a blank line before and after, at the most useful spot:

- **Under a section heading** — right after the section's intro sentence, before any `<Steps>` block.
- **Inside a `<Step>`** — after that step's instruction, so the screenshot illustrates that exact action.
- **After the relevant paragraph** — e.g. a "What students see" view goes right after the sentence describing it.

```mdx
![Certificate rules panel with the download toggle and completion threshold](/certificates-rules.webp)
```

One screenshot per distinct UI/action. Do not stack multiple images with no text between them; give each a home
next to the step or paragraph it supports.

## Step 4: Format and verify

```bash
pnpm exec prettier --write apps/docs/content/docs/<page>.mdx
```

Verify every image reference on the page resolves to a real file in `apps/docs/public/`:

```bash
grep -hoE '\(/[A-Za-z0-9._-]+\.webp\)' apps/docs/content/docs/<page>.mdx \
  | tr -d '()' | while read -r p; do [ -f "apps/docs/public$p" ] && echo "OK $p" || echo "MISSING $p"; done
```

All lines should print `OK`. Report the files added, their final WebP sizes, and any source image you could not
confidently match.

## Don'ts

- Don't reference a PNG/JPG from a page, or point at `apps/docs/public/...` instead of `/...`.
- Don't commit oversized images — always run the resize/quality pass.
- Don't upscale a smaller source to 1280.
- Don't delete the user's originals in `~/Downloads`.
- Don't invent an image for UI that does not exist; only document what you can see in a real screenshot.
