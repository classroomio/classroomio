# Copy Page as Markdown PRD

## Status

- Draft (not started)

## Purpose

Give learners on public course pages a one-click way to export lesson content as Markdown and hand it off to an AI tool. The pattern is the same split-button found on Vercel, Next.js, and shadcn-svelte docs:

- **Primary "Copy Page"** copies the lesson as Markdown to the clipboard.
- **Chevron dropdown** exposes:
  - View as Markdown
  - Open in ChatGPT
  - Open in Claude

Teachers control whether this surface appears, per course, via a setting in course settings.

## Motivation

Learners increasingly mix course content with AI tools — pasting lesson text into ChatGPT/Claude to ask follow-up questions, get worked examples, or debug exercises. Today they manually select-and-copy from the page, which captures HTML noise, broken whitespace, and embedded video chrome. Shipping a first-class "Copy Page" action:

1. Removes the friction of switching between the lesson and an AI tool.
2. Produces clean Markdown (no iframes, no video embeds, no rich-text artefacts) so the AI tool receives high-quality context.
3. Matches the convention learners already see on modern documentation sites — feels native to anyone who uses them.

## Scope

### In scope (v1)

- Public lesson pages only: `/course/[slug]/lesson/[itemSlug]`.
- Per-course toggle in course settings (`metadata.allowMarkdownExport`). Default: off.
- Server-side HTML → Markdown conversion with videos stripped.
- A bookmarkable `.../markdown` URL that returns the lesson as `text/markdown`.
- Split button on the public lesson shell with four actions: Copy Page, View as Markdown, Open in ChatGPT, Open in Claude.

### Out of scope (v1)

- Course landing pages, section pages, and any non-lesson public surface.
- `Open in v0` (skipped — most lessons aren't UI/component focused).
- Bulk export of an entire course as a single Markdown document.
- Authenticated dashboard surfaces (only public pages get the action).
- Localised Markdown output (initial release exports the lesson's current locale verbatim).

## Confirmed Decisions

1. **Scope is lesson pages only.** Landing and section pages are deferred until there is signal that learners want them.
2. **Per-course toggle is stored on `course.metadata`.** This matches the existing pattern used by `lessonDownload`, `grading`, and `allowNewStudent`, so no new column or migration is required.
3. **Default value is off.** Teachers must explicitly opt in. This avoids silently exposing course content as easily copyable Markdown to courses created before the feature shipped.
4. **HTML → Markdown conversion runs on the server**, not in the browser, so the `turndown` dependency does not ship to learners and a real bookmarkable `.md` URL exists.
5. **Videos are excluded** from the Markdown output. `<iframe>`, `<video>`, and known video-host anchor tags (YouTube, Vimeo, Loom) are stripped before conversion.
6. **The same `/markdown` URL serves three purposes:** target of "View as Markdown", source the client fetches for "Copy Page", and the URL embedded in the AI prompt templates.
7. **Open in ChatGPT / Open in Claude use a course-specific prompt template** containing the lesson title, course title, and the public lesson URL.
8. **No v0 destination** in v1. Revisit if usage data shows demand from teachers running code-heavy courses.

## User Stories

- **As a learner** reading a public course lesson, I want to copy the lesson as Markdown so I can paste clean context into ChatGPT or Claude.
- **As a learner** reading a long technical lesson, I want a "View as Markdown" URL so I can read it in a distraction-free format and link to it.
- **As a teacher** publishing a public course, I want to choose whether learners can export my lesson content, so I retain control over how my material is reused.
- **As a teacher** with a paid course, I want this feature off by default so my content is not trivially extractable without my consent.

## Feature Detail

### Teacher-facing — Course Settings toggle

A new Switch is added to the existing course settings page, next to `lessonDownload`:

- Label: **"Allow learners to copy lesson pages as Markdown"**
- Helper text: **"When enabled, public lesson pages show a Copy Page button that exports the lesson content (excluding videos) as Markdown."**
- Off by default for both new and existing courses.

Persisted via the existing course update endpoint as `metadata.allowMarkdownExport: boolean`.

### Learner-facing — Public lesson page

When the course has `metadata.allowMarkdownExport === true`, the public lesson page shell renders a split button in the top-right toolbar slot:

```
[ 📋 Copy Page | ⌄ ]
              │
              ├── M↓  View as Markdown
              ├── 💬  Open in ChatGPT
              └── ✻   Open in Claude
```

**Primary "Copy Page" button**

1. Fetches `/course/<slug>/lesson/<itemSlug>/markdown` (returns `text/markdown`).
2. Writes the response body to the clipboard via the existing `copyToClipboard` utility.
3. Shows a `Copied` snackbar on success, error snackbar on failure.

**View as Markdown**

Opens `/course/<slug>/lesson/<itemSlug>/markdown` in a new tab. Browser renders the raw Markdown inline (response is `text/markdown; charset=utf-8`, no `Content-Disposition: attachment` so it does not download).

**Open in ChatGPT**

Opens `https://chatgpt.com/?prompt=<encoded prompt>` in a new tab.

**Open in Claude**

Opens `https://claude.ai/new?q=<encoded prompt>` in a new tab. The exact param name (`q` vs `prompt`) is verified during implementation; if neither is supported the button falls back to opening `claude.ai/new` so the learner can paste manually.

**Prompt template (shared by ChatGPT and Claude)**

```
I'm studying "<lesson title>" from the course "<course title>" (<public lesson URL>).
Help me understand the concepts, give examples, or help debug based on it.
```

### Markdown output format

The endpoint returns a single Markdown document:

```
# <course title> — <lesson title>

<converted lesson body>
```

Conversion rules:

- HTML body is first run through the existing `sanitize-html.ts` pipeline.
- `<iframe>`, `<video>`, and `<a>` tags whose `href` matches YouTube, Vimeo, or Loom are dropped (defence-in-depth, even though sanitiser strips `<iframe>`/`<video>` already).
- Remaining HTML is converted via `turndown` with sensible defaults: ATX headings, fenced code blocks, `-` bullets.
- Output is plain UTF-8 with `\n` line endings.

### Gating

`GET /course/<slug>/lesson/<itemSlug>/markdown` returns **404** when the course has `metadata.allowMarkdownExport !== true`. This makes the toggle authoritative — the URL cannot be used to bypass the teacher's preference.

## Technical Notes

### Touched files / new files

| Purpose | Path |
|---|---|
| Course metadata type | `packages/db/src/schema.ts` (extend the inline `metadata` type on courses) |
| Validation schema | `packages/utils/src/validation/course/course.ts` (`ZCourseMetadata`) |
| Settings UI | `apps/dashboard/src/lib/features/course/pages/settings.svelte` |
| Translations | `apps/dashboard/src/lib/utils/translations/en.json` |
| New: HTML→MD util | `apps/api/src/utils/html-to-markdown.ts` |
| New: markdown route | `apps/api/src/routes/course/lesson-markdown.ts` (mounted via the course aggregate router per CLAUDE.md rules) |
| New: copy-page button | `packages/ui/src/custom/public-course/copy-page-button.svelte` |
| Public lesson wiring | `apps/dashboard/src/routes/(org-site)/course/[slug]/lesson/[itemSlug]/+page.svelte` and the `topRight` slot on `packages/ui/src/custom/public-course/shell.svelte` |
| Reused: clipboard util | `apps/dashboard/src/lib/utils/functions/formatYoutubeVideo.ts` (`copyToClipboard`) |
| Reused: dropdown primitives | `packages/ui/src/base/dropdown-menu/` |
| Reused: HTML sanitiser | `apps/api/src/utils/sanitize-html.ts` |
| New dep | `turndown` + `@types/turndown` in `apps/api/package.json` |

No database migration is required — the toggle lives in the existing JSONB `metadata` column.

### Translation keys

- `course.navItem.settings.allow_markdown_export`
- `course.navItem.settings.allow_markdown_export_description`
- `public_course.copy_page.copy`
- `public_course.copy_page.view_as_markdown`
- `public_course.copy_page.open_in_chatgpt`
- `public_course.copy_page.open_in_claude`
- `public_course.copy_page.copied`

## Risks & Open Questions

1. **Claude URL parameter.** `claude.ai/new?q=…` is the current convention but is not officially documented. Implementation must verify before merge and fall back to a no-parameter open if it breaks.
2. **Sanitiser/turndown interaction.** Some tiptap output (custom embed nodes, fancy tables) may produce odd Markdown. The PR should include a smoke test with at least one rich lesson (mixed headings, images, code blocks, a table, and a YouTube embed).
3. **Markdown URL as exfiltration vector.** The endpoint is gated by `metadata.allowMarkdownExport`, but teachers may not realise that toggling the switch on makes a public, scrapable URL available. Helper text on the setting calls this out explicitly.
4. **Future surfaces.** If learners ask for "copy entire course" or "copy section", we will revisit; the v1 endpoint shape (`/lesson/<itemSlug>/markdown`) leaves room for sibling endpoints like `/section/<sectionSlug>/markdown`.

## Verification

End-to-end checks before sign-off:

1. `pnpm --filter @cio/db build` succeeds with the extended metadata type.
2. `pnpm --filter @cio/api build` succeeds with the new route and `turndown` dep.
3. Toggling the setting in course settings persists across reload.
4. With the toggle **off**, the Copy Page button is not rendered on the public lesson page, and a direct `GET /…/markdown` returns 404.
5. With the toggle **on**:
   - Copy Page → snackbar `Copied`; pasted result is clean Markdown with no `<iframe>`/`<video>`.
   - View as Markdown → new tab shows the raw Markdown inline.
   - Open in ChatGPT → new tab at `chatgpt.com/?prompt=…` with the templated prompt and current public URL.
   - Open in Claude → new tab at `claude.ai/new?q=…` with the templated prompt and current public URL.
6. Lesson with embedded YouTube / Loom iframes — Markdown output has those stripped, surrounding text intact.
