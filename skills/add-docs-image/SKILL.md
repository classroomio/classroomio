---
name: add-docs-image
description: Prepare and place screenshots for ClassroomIO Help Center articles under apps/help/content/help. Use when a guide needs a new, replaced, framed, annotated, or optimized product screenshot. Do not use for decorative marketing imagery.
---

# Add a ClassroomIO help screenshot

Every help article gets one lead screenshot that summarizes the title. Add further screenshots only when they help the reader recognize a control, state, result, or error that text alone does not locate clearly.

Before choosing or placing an image, read [../write-docs/references/media-and-linking.md](../write-docs/references/media-and-linking.md). Follow its privacy, composition, placement, alt-text, and accessibility rules.

## Lead screenshot

Place one screenshot after the opening paragraph and before the first `##`. The frontmatter `description` and that paragraph come first, so the reader has the answer before the image. The image then shows the feature the title is about.

```mdx
---
title: Create a course from a template
description: Pick one of your templates or a ClassroomIO template and turn it into a new course.
---

To start a course from a template, open **Courses**, pick a template, and click **Use template**.

![Courses page with the Create a new course row](./images/create-a-course-from-a-template/overview.webp)

## Before you start
```

The lead screenshot is the screen where that feature is the subject, already open or selected. Capture it with the same 1350×830 framing as every other help screenshot. Leave it unmarked: no arrow, outline, number, or other annotation. Name the file `overview.webp`.

Step screenshots later in the article still sit after the instruction they confirm, and those may use an arrow when the reader needs to find a control.

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

Capture one screen, not a full-page screenshot of everything below the fold. The app screen is 1350×830 CSS pixels at device scale 1. Leave out the real browser's tabs and address bar, since the board draws its own. Do not crop the app's UI inside that screen. When the reader needs to find a specific control, point to it with an arrow or outline on that screen instead of cropping down to it.

Frame that screen in the ClassroomIO browser board (drawn by `apps/help/scripts/frame-screenshot.mjs`, the only source of the design) so every article uses the same presentation. 1350×830 is the app screen inside the board, not the finished file. A 1350×830 capture frames to about 1479×991. The board adds its own chrome, padding, shelf, and feet. The script hugs the screenshot's height, composites the screenshot at its native pixel size, and writes lossless WebP with a transparent background, so it replaces the optimize step below. Do not embed the screenshot in the board SVG: the SVG rasterizer resamples it and the UI goes soft. Do not run the ImageMagick `1280>` resize on a framed file: that shrinks the app screen.

## Capture the 1350×830 screen

Use Playwright's headless Chromium with `viewport: { width: 1350, height: 830 }` and `deviceScaleFactor: 1`. Call `page.screenshot({ animations: 'disabled' })` on that viewport. Do not pass `fullPage: true`. `animations: 'disabled'` finishes the dialog and sheet fade before the shot, so the panel is opaque. A shot taken during `fade-in` leaves the panel translucent and the page behind it shows through.

Sign in against the API, then attach the session cookies to the dashboard origin:

```bash
curl -s -D /tmp/cio-signin.headers -o /dev/null \
  -X POST http://localhost:3002/api/auth/sign-in/email \
  -H 'Origin: http://localhost:5173' \
  -H 'Content-Type: application/json' \
  -d '{"email":"enterprise@test.com","password":"123456"}'
```

Add `classroomio.session_token` and `classroomio.session_data` from those `Set-Cookie` headers to the browser context for `http://localhost:5173/`. Delete the headers file when the capture finishes. The dashboard route `POST /api/auth/sign-in/email` returns 502 (`API upstream not configured`) when `PRIVATE_SERVER_URL` is not available to that request, so do not sign in through it.

For admin-app shots, open the enterprise org, `http://localhost:5173/org/coursera-test/...` (`enterprise@test.com`). A fresh context has no `courseView` preference, so Courses opens as a list. Set `localStorage.courseView` to `grid` in an init script before navigation when the shot is the card grid.

Wait until the real page is painted: the sidebar shows **Enterprise Admin**, the heading for the step is visible, and every image inside the viewport has `complete` and `naturalWidth > 0`. Waiting for the first `img` is not enough — the rest of the row can still be empty wells. A shot taken on the skeleton leaves the sidebar short of the bottom of the window.

These captures fail and must be thrown away:

- CSS `zoom` on `documentElement`. The sidebar is `inset-y-0` and `max-h-svh`, so zoom paints it shorter than the viewport and leaves a white gap under it while the main column continues.
- Cropping a taller PNG down to 830. The sidebar was the height of the original window, so the crop ends above it.
- `Page.captureScreenshot` from the Cursor browser widget for a viewport wider than that widget (about 1071 pixels). The surface repeats, and a second sidebar appears on the right.
- Passing `--max-width` below the framed width (about 1479). The default is 1600, which leaves a 1350-wide screen unscaled.

Before framing, confirm the PNG is exactly 1350×830, there is one sidebar, and its background reaches the last row. Open the framed WebP and check the same thing. A horizontal template row may end mid-card. If a label outside that row is cut off, report it. Do not zoom or crop to hide it.

Draw an arrow on the PNG before framing when the reader needs to find a control. Use a red `#e11d48` stroke of 3.5 with a white halo of 7, a head 14 pixels long, and wings of 6.5. Put the tail in empty chrome and the tip beside the target. Do not cover a label, a value, or a face.

Run the framer from the repo root with Node 20. Expand `$PWD` in the shell so the output path is absolute; the script's working directory is `apps/help`.

```bash
export PATH="$HOME/.nvm/versions/node/v20.19.3/bin:$PATH"
pnpm --filter @cio/help frame-screenshot "$SOURCE_IMAGE" \
  "$PWD/apps/help/content/help/<section>/images/<article-slug>/<state-or-action>.webp"
```

Pass `--url <host>` when the page lives somewhere other than `app.classroomio.com`, such as a student-facing academy.

For a screenshot that is not framed in the browser board, optimize with ImageMagick when available. This command shrinks only images wider than 1280 pixels, strips metadata, and writes WebP:

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
