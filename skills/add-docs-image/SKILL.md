---
name: add-docs-image
description: Prepare and place screenshots for ClassroomIO Help Center articles under apps/help/content/help. Use when a guide needs a new, replaced, cropped, annotated, or optimized product screenshot. Do not use for decorative marketing imagery.
---

# Add a ClassroomIO help screenshot

Add a screenshot only when it helps the reader recognize a control, state, result, or error that text alone does not locate clearly.

Before choosing or placing the image, read [../write-docs/references/media-and-linking.md](../write-docs/references/media-and-linking.md). Follow its privacy, composition, placement, alt-text, and accessibility rules.

## Verify the screenshot

- Inspect the actual image before editing it.
- Match it to a verified step in the current product. Do not document a mockup or roadmap UI as shipped.
- Confirm the visible labels against `apps/dashboard/src/lib/utils/translations/en.json`.
- Reject or replace images containing real customer names, emails, domains, student records, tokens, payment data, or private URLs.
- If the image cannot be matched confidently to the intended step, ask instead of guessing.

## Prepare the asset

For new article-specific screenshots, place the optimized file at:

```text
apps/help/content/help/<section>/images/<article-slug>/<state-or-action>.webp
```

Use a relative MDX reference:

```md
![Audience table with Assign to Courses highlighted](./images/manage-your-audience/assign-to-courses.webp)
```

Keep existing public assets at `apps/help/public/` and existing `/help/<name>.webp` references working unless the task explicitly includes migrating them.

Optimize with ImageMagick when available. This command shrinks only images wider than 1280 pixels, strips metadata, and writes WebP:

```bash
magick "$SOURCE_IMAGE" -resize '1280>' -strip -quality 80 \
  "apps/help/content/help/<section>/images/<article-slug>/<state-or-action>.webp"
```

Use `cwebp` as a fallback. Do not upscale smaller images.

Inspect the result:

```bash
magick identify -format '%wx%h %b\n' \
  "apps/help/content/help/<section>/images/<article-slug>/<state-or-action>.webp"
```

Keep the user's source image. Do not delete or overwrite it.

## Place the image

Put the screenshot after the instruction it confirms and before the next step. Keep one screenshot with one distinct action or state. Do not stack images with no explanatory text.

Alt text must use sentence case, omit a trailing period, and describe the relevant page or panel, control or state, and any annotation. Do not start with “Screenshot of” or reproduce every visible label.

Blume provides click-to-zoom for content images. Do not add a custom lightbox or wrap the image in an extra link.

## Verify

```bash
pnpm exec prettier --write apps/help/content/help/<path>.mdx
pnpm --filter @cio/help validate
pnpm --filter @cio/help build
```

Open the rendered article and confirm that the image loads, zooms, stays legible on a narrow viewport, and does not shift the surrounding layout. Report the asset path, final dimensions and size, placement, and any image that could not be safely used.
