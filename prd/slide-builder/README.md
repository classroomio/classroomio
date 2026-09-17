# Slide Builder PRD

## Status

- Draft (prototyped, ready for engineering review)

## Prototypes — the UX source of truth

**The UX of this feature must be taken from the prototype folder.** Interactive HTML prototypes for every surface live in [`prototypes/slide-builder/`](../../prototypes/slide-builder/) and are the approved design reference for layout, states (draft / generating / overflowing / locked / empty), copy, and navigation flow. When this document and a prototype disagree on a UI detail, the prototype wins.

**Start here:**

```
prototypes/slide-builder/index.html
```

Open it in a browser (`open prototypes/slide-builder/index.html`) — it maps all three journeys (teacher → learner → public visitor) and every page cross-links so you can click through each flow end to end. Each page has a light/dark toggle.

The prototypes are built on the real design tokens: `app-theme.css` mirrors `packages/ui/src/index.css` (OKLCH palette, Geist, `--radius: 0.625rem`, and the Button / Badge / Item / Progress / Sidebar recipes), and `deck.css` owns the 1920×1080 canvas, the slide themes as `--slide-*` token sets, and the editor chrome. The public course page uses the same app tokens because `PublicCourseShell` does — it is not an org-landing surface. `deck-data.js` holds the sample deck and a small renderer, so every screen draws from one slide document and cannot drift.

| Surface | Files |
| --- | --- |
| Entry | `index.html` |
| Teacher — authoring | `deck-library.html`, `lesson-slide-tab.html`, `deck-editor.html`, `deck-editor-free.html`, `deck-themes.html` |
| Teacher — AI & import | `deck-ai.html`, `deck-import.html` |
| Teacher — output | `deck-export.html`, `presenter.html` |
| Learner (LMS) | `lesson-deck-player.html` |
| Public (org site) | `public-course-lesson.html` |

## Purpose

Give teachers a **native slide deck** they author, theme, and present inside ClassroomIO — no round trip to Google Slides, Canva, or PowerPoint — where the deck is structured data the platform can generate, edit, export, and measure. The reference experience is [open-slide](https://open-slide.dev/) (MIT, React): a fixed 1920×1080 canvas, token-driven themes, and agent-first authoring. We keep that feel and replace its core primitive — arbitrary React code per slide — with a typed, validated slide document, because tenant-authored code cannot execute in a multi-tenant Svelte app.

## Problem Statement

- The entire slides feature today is **one URL and one `<iframe>`**: `lesson.slideUrl` (`packages/db/src/schema.ts:972`) rendered by a 53-line component (`apps/dashboard/src/lib/features/course/components/lesson/slide/slide.svelte`). The only transform in the codebase is a Canva `?embed` special case.
- Teachers author decks in a **different product**, then paste a link back. Decks drift out of sync with the lesson, break when sharing settings change, and show a sign-in wall to students.
- **Slides never reach the public course page.** `packages/db/src/queries/course/public-course.ts:358-368` does not select `slideUrl`, so a public/marketing course page shows no deck at all.
- The platform can measure video watch time (`lessonVideoProgress`) but knows **nothing** about a deck — no completion, no gating, no analytics — because the content lives on someone else's server.
- The AI assistant can author sections, lessons, exercises, questions, and landing pages (20 tools in `packages/core/src/services/agent/chat-tools.ts:473-1058`) but **cannot make a slide**, which is the artifact teachers spend the most time on.
- Teachers with an existing library of `.pptx` decks have **no migration path**. PowerPoint is rejected by the document uploader (`packages/utils/src/validation/constants.ts:12-16`) and only reachable through the AI course-import parser.
- The editor's existing IFrame extension **silently loses data**: the server sanitizer strips `iframe` on every lesson save (`packages/utils/src/functions/sanitize.ts:1-15`, applied at `packages/core/src/services/lesson-language.ts:71`), so in-editor embeds are non-functional today.

## Confirmed Decisions

1. **Slide tab becomes two modes**: the existing Slide tab gains an explicit mode — `embed` (the current `slideUrl`, plus the platform picker specced in `prototypes/slide-embed-picker/`) or `deck` (a native ClassroomIO deck). Both coexist; no migration of existing `slideUrl` values. The embed-picker PRD is folded in as the `embed` mode of this surface rather than shipped as a standalone flow.
2. **Decks are an org-level library**: `slide_deck` is org-scoped with a nullable `lessonId`. Decks are reusable across lessons and courses, listable and duplicable from a library page, and addressable by id from AI and MCP.
3. **Four surfaces ship in v1**: teacher deck editor (dashboard), learner deck player (authenticated LMS), public course page rendering (org site), and presenter mode.
4. **Authoring model is layout slots plus a free-position escape hatch**: a slide picks a named layout whose slots own geometry, and any block may be detached to an explicit `{x, y, w, h}` box on the 1920×1080 canvas. `layout: 'free'` means every block carries a box.
5. **Exports in v1 are PDF and PPTX.** Standalone HTML and per-slide PNG are deferred, except that the PNG screenshot path is built because PPTX depends on it.
6. **All four AI surfaces ship in v1**: dashboard chat tools, PPTX import to native deck, MCP tools, and in-canvas comment-pin to AI apply.
7. **Theming is built-ins plus an org branding seed**: a fixed set of themes in `@cio/slides` plus one derived from `organization.theme` and `organization.avatarUrl`. No theme-builder UI in v1.
8. **A deck renders from one renderer, not two.** Svelte components are the single source of truth; server-side export drives a headless render route with a real browser rather than a parallel HTML-string renderer.
9. **Heavy slide tools are gated to durable run mode** at the API layer. This feature implements the gate that `apps/dashboard/src/lib/features/ai-assistant/CHAT_VS_RUN.md:87` recommends and that `RUN_ONLY_TOOL_NAMES` (`chat-tools.ts:1066`) currently leaves empty.
10. **Deck content is never written into a sanitized HTML column.** Blocks are structured jsonb rendered by components, following the `lesson.videos` precedent (`packages/ui/src/custom/media-player/media-player.svelte:29-72`), not the note-body precedent.
11. **PPTX import extracts text and media, not layout.** Text per slide is mapped onto layouts by the agent; `ppt/media/*` files are extracted into the asset library and offered as an unplaced-assets tray. Original positioning is not reconstructed. *(Product call made without an explicit answer — flagged for veto.)*
12. **Deck version history is written explicitly by the service layer.** We do not copy the `lesson_language_history` pattern: nothing in app code writes to that table — it is fed by a legacy Supabase-era trigger absent from the Drizzle migrations.

## Current-State Audit

| Capability | Current State | Notes |
| --- | --- | --- |
| Slides on a lesson | `lesson.slideUrl varchar` (`packages/db/src/schema.ts:972`), `z.url()` at `packages/utils/src/validation/lesson/lesson.ts:35` | Keep untouched as `embed` mode. A pasted `<iframe>` fails validation today. |
| Slide UI | `components/lesson/slide/slide.svelte` (53 lines), tab slot 2 in `components/lesson/constants.ts:28-33` | Tab registry, badge counts, and `lessonTabsOrder` already have a slot to extend. |
| Data-object → render precedent | `@cio/certificates`: `renderCertificate(design, data)` + `RENDERERS` registry (`packages/certificates/src/render.ts:11`) | Exact architecture to mirror for `@cio/slides`: typed design + template registry. |
| Server-side PDF/PNG | `getCloudflarePdfBuffer` / `getCloudflarePngBuffer` (`apps/api/src/utils/cloudflare.ts`) | Both take `html` only. Needs a `url` variant — the Cloudflare endpoints accept `url`, `waitForSelector`, and `cookies`. |
| Theme token system | `--landing-*` vars in `packages/ui/src/custom/org-landing-page/theme-vars-base.ts`, per-theme `vars.ts` | Direct precedent for `--slide-*` tokens and a theme registry. |
| Org brand inputs | `organization.theme text default 'blue'` (`schema.ts:2172`), `organization.avatarUrl`, shade generation via `color2k` in `apps/dashboard/src/lib/utils/functions/theme.ts:22-35` | Enough to derive a branded slide theme with no new columns. |
| AI authoring tools | Schemas `packages/core/src/services/agent/agent-tool-schemas.ts`; impls `chat-tools.ts:473-1058`; prompt `packages/ai-assistant/src/prompt/teacher.ts` | `packages/ai-assistant/src/tools/*` is dead code — imported by nothing. Do not add tools there. |
| Run-mode gate | `filterToolsForChatMode` is the identity fn; `RUN_ONLY_TOOL_NAMES` is empty (`chat-tools.ts:1066-1070`) | The hook exists and is unused. This feature implements it. |
| MCP server | `packages/mcp`, 17 tools, `StdioServerTransport` only (`packages/mcp/src/index.ts:18`) | Laptop-only. No hosted remote MCP; out of scope here. |
| PPTX parsing | `extractPptxText` (`packages/core/src/services/agent/document.ts:227-256`) — JSZip, tag-stripped text per slide | Text only. JSZip is already loaded, so `ppt/media/*` extraction is incremental. |
| Public course content | `PublicLessonContent` carries `body` + `video` only (`packages/db/src/queries/course/public-course.ts:284-311`) | Net-new plumbing: query select, type, and mapper (`public-course-mappers.ts:66-77`). |
| Lesson HTML sanitizer | `FORBID_TAGS` includes `iframe`, `object`, `embed` (`packages/utils/src/functions/sanitize.ts:1-15`) | Hard constraint: decks must not travel as HTML through `lesson_language.content`. |
| Editor image upload | Insert is a bare `prompt()` (`editor/ui/components/ImagePlaceholder.svelte:9-14`); paste handler's `onload` is commented out (`editor/utils.ts:37-41`) | The upload pipeline exists (`utils/services/upload.ts` → `POST /media/image`) but the editor is not wired to it. |
| Background jobs | `QUEUE_NAMES`/`JOB_NAMES` in `packages/jobs/src/queues/names.ts`, enqueue in `packages/jobs/src/enqueue/`, workers in `apps/jobs/src/workers/` | A `slide-exports` queue drops straight in. |
| Client-side export deps | `html-to-image` and `jspdf` already in `apps/dashboard/package.json` | Available as a fallback path; server path is preferred for fidelity. |

## Product Goals

1. A teacher creates, edits, reorders, themes, and presents a deck entirely inside ClassroomIO.
2. A deck looks on-brand by default, without the teacher choosing a single colour.
3. The AI assistant can build and revise a deck through the same tools a human uses, with no separate code path.
4. A teacher's existing PowerPoint library becomes native decks in one upload.
5. A deck exports to PDF and PPTX with fidelity good enough to hand to a colleague.
6. Learners view decks in the LMS and on public course pages, and the platform records progress through them.
7. Everything that works today — external embeds via `slideUrl`, lesson notes, videos, documents — continues to work exactly as before (zero regression).

## Non-Goals (v1)

- **Arbitrary code slides** — the open-slide primitive. Tenant-authored JSX or `<script>` in a multi-tenant app is remote code execution. Non-negotiable, not a phasing decision.
- **A theme builder UI** — org-scoped custom token editing. Built-ins plus the brand seed only.
- **Morph transitions** between slides. Simple `none | fade | slide` only.
- **Real-time multiplayer editing.** Single-editor with explicit version history.
- **Text-native PPTX** (editable text boxes in PowerPoint). v1 exports full-bleed images per slide.
- **Standalone HTML export** and **per-slide PNG download** as user-facing features.
- **A hosted remote MCP transport.** MCP tools ship, but stdio-only, matching the existing server.
- **Reconstructing PowerPoint layout on import.** Text and media only.
- **Charts and data-bound blocks.** Deferred; `kpi` covers the common case.
- Fixing the TipTap editor's unrelated image-insert gap beyond what the deck editor itself needs.

## Data Sources Checked

- `https://open-slide.dev/` and `github.com/1weiho/open-slide` — canvas model, `Page` contract, theme tokens, `export-pdf.ts` print CSS, `export-pptx.ts` rasterization, the `slide-authoring` skill's vertical-budget rules.
- `https://developers.cloudflare.com/browser-rendering/rest-api/pdf-endpoint/` — confirmed `url` is accepted as an alternative to `html`; 50 MB body cap; 4,500 ms default page-load timeout.
- `pptxgenjs` v4.0.1 (MIT) — PPTX assembly from images in Node.
- `prototypes/slide-embed-picker/PRD.md` — the ten-platform embed picker this PRD absorbs as `embed` mode.

---

## Functional Requirements

### 1. Deck Library (`/org/[slug]/decks`)

Mirrors the media manager (`apps/dashboard/src/lib/features/media/pages/media.svelte`) — see `deck-library.html`.

- Grid of deck cards: thumbnail (first slide render), title, slide count, theme chip, updated-at, and the lesson it is attached to (or `Unattached`).
- Filters bar: search by title, filter by course, by status (`Draft` / `Published`), by attachment (`Attached` / `Unattached`).
- Card actions: Open, Duplicate, Export, Detach from lesson, Delete.
- **Empty state**: an explanatory panel with three entry points — *Start from blank*, *Generate with AI*, *Import a .pptx*.
- **Generating state**: a deck created by a durable agent run shows a progress card in place of the thumbnail, with slide-count progress and a Cancel action, matching the run monitor in the AI panel.

### 2. Lesson Slide Tab — two modes (`/courses/[id]/lessons/[lessonId]`)

See `lesson-slide-tab.html`.

- When the lesson has neither `slideUrl` nor `slideDeckId`, the tab shows a **mode chooser**: *Embed an existing deck* or *Build a deck here*.
- **Embed mode**: the platform picker from `prototypes/slide-embed-picker/` — visual platform gallery, per-platform input, paste normalization (link transform or `<iframe>` src extraction), live preview, inline validation, docs deep-link. Persists a resolved embed URL to `slideUrl`, unchanged from today's contract.
- **Deck mode**: a deck summary card — thumbnail, slide count, theme, last edited — with *Open editor*, *Present*, *Export*, and *Replace with a library deck*.
- Switching modes never destroys the other mode's data: `slideUrl` and `slideDeckId` both persist; `slideMode` decides what renders.
- **Badge count** on the tab reflects whichever mode is active (`1` for an embed, slide count for a deck).

### 3. Deck Editor (`/org/[slug]/decks/[deckId]`)

The core surface. See `deck-editor.html` (layout mode) and `deck-editor-free.html` (free mode).

- **Three-pane shell**, mirroring the certificate editor (`features/course/components/ceritficate/editor/`): slide rail (left), 1920×1080 canvas scaled to fit (centre), inspector (right).
- **Slide rail**: ordered thumbnails, drag to reorder, add-slide button with a layout picker, per-slide context menu (Duplicate, Delete, Add note). A slide whose free-positioned blocks exceed the canvas shows an **overflow warning dot**.
- **Canvas**: click a block to select it; selected block shows a bounding box. In layout mode, blocks snap to their slot and cannot be dragged. In free mode, blocks are draggable and resizable with snap guides at canvas thirds and centre lines.
- **Inspector**, tabbed: *Slide* (layout picker, background, transition, presenter notes), *Block* (kind-specific fields — text, level, bullets, image picker, code language, alignment, emphasis), *Detach to free position* toggle on any slotted block.
- **Text auto-fit**: text inside a slot or an explicit box shrinks within the theme's type range to fit its box. A block that cannot fit at minimum size surfaces an inline warning rather than clipping silently.
- **Save**: `Page.SettingsActions` docked at the bottom, appearing only when `hasChanges` is true, per the repo's settings-page rule.
- **States shown in the prototype**: layout mode with a block selected, free mode with an overflowing block and Save blocked, drag-reorder, and the layout picker. The version-history drawer is specified here but not prototyped — build it to match the editor's inspector panels.

### 4. Themes (`deck-themes.html`)

- A theme gallery showing each built-in rendered on a real sample slide, not a swatch.
- The org's seeded theme appears first, labelled *Your brand*, derived from `organization.theme` and `organization.avatarUrl`.
- Applying a theme is instant and non-destructive — themes carry no content.
- A small set of per-deck overrides (accent colour, heading font pairing) without a full token editor.

### 5. AI Authoring (`deck-ai.html`)

- **From the AI panel**: "Build a deck for this lesson" produces a plan card, then a durable run that streams slides into the rail as they are created.
- **In-canvas comment pin**: the teacher clicks a block, drops a pin, and types a change ("tighten this to three bullets", "make this the cover"). Pins collect in a sidebar; *Apply all* hands them to the agent, which edits the addressed blocks. This is open-slide's `@slide-comment` loop.
- Pin states: open, applying, applied (with a diff summary), failed (with a retry).
- Every AI write goes through the same routes a human uses, and appears in version history attributed to `agent`.

### 6. PPTX Import (`deck-import.html`)

- Upload a `.pptx`; the file is unzipped and slide text extracted per slide, media files extracted to the asset library.
- A **mapping review step** shows, per source slide, the extracted text and the layout the agent proposes, with a layout override dropdown.
- An **unplaced assets tray** holds every extracted image; the teacher drags one onto a slide, or dismisses the tray.
- The import banner states plainly that original positioning and fonts are not reconstructed.

### 7. Export (`deck-export.html`)

- Export dialog with PDF and PPTX, each showing what the teacher will get (PDF: vector text where possible; PPTX: one full-bleed image per slide, not editable text).
- Export enqueues a job and shows progress; completion yields a signed download URL.
- A deck longer than a threshold warns about export duration before starting.

### 8. Presenter Mode (`presenter.html`)

- Full-screen current slide, next-slide preview, presenter notes, elapsed timer, and slide position.
- Keyboard: arrows/space to advance, `O` for overview grid, `B` for blackout, `F` for fullscreen, `Esc` to exit.
- Opens in a new window so the teacher can put the deck on the projector and notes on the laptop.

### 9. Learner Player (`lesson-deck-player.html`)

- The deck renders in the lesson's Slide slot, scaled to the content column, with keyboard and click navigation and an overview grid.
- **Progress**: the furthest slide reached is recorded per learner. Where the lesson's `completionPolicy` requires it, the deck must be advanced to the last slide before the lesson can complete — following the `videoWatchThreshold` precedent.
- **Locked state**: a locked lesson shows the deck's first slide blurred with the existing lock treatment, consistent with locked video.

### 10. Public Course Page (`public-course-lesson.html`)

- On the org site, a public lesson renders its deck inline, themed by the deck's theme (not the landing theme), inside the landing page's content column.
- Anonymous visitors get navigation and overview but no progress recording.
- A deck on a locked lesson is not sent to the client at all — same rule as `body` and `video` today.

---

## Technical Design

### Data Model

#### New Table: `slide_deck`

```typescript
// packages/db/src/schema.ts
export const slideDeck = pgTable(
  'slide_deck',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    organizationId: uuid('organization_id').notNull(),
    lessonId: uuid('lesson_id'),
    title: varchar().notNull(),
    themeId: varchar('theme_id').notNull().default('classic'),
    themeOverrides: jsonb('theme_overrides').default({}).$type<Record<string, string>>(),
    status: slideDeckStatus().default('DRAFT').notNull(),
    slideCount: integer('slide_count').default(0).notNull(),
    thumbnailUrl: text('thumbnail_url'),
    createdBy: uuid('created_by'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    foreignKey({ columns: [table.organizationId], foreignColumns: [organization.id] }).onDelete('cascade'),
    foreignKey({ columns: [table.lessonId], foreignColumns: [lesson.id] }).onDelete('set null'),
    index('slide_deck_org_updated_idx').on(table.organizationId, table.updatedAt),
    index('slide_deck_lesson_idx').on(table.lessonId)
  ]
);
```

`slideCount` is a denormalized counter for list rendering only; it is recomputed inside the same transaction as any slide insert or delete, never read as truth by the editor.

#### New Table: `slide`

```typescript
export const slide = pgTable(
  'slide',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    deckId: uuid('deck_id').notNull(),
    order: integer().notNull(),
    layout: varchar().default('title-body').notNull(),
    blocks: jsonb().default([]).notNull().$type<TSlideBlock[]>(),
    notes: text(),
    transition: varchar().default('fade').notNull(),
    background: jsonb().default({}).$type<TSlideBackground>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    foreignKey({ columns: [table.deckId], foreignColumns: [slideDeck.id] }).onDelete('cascade'),
    index('slide_deck_order_idx').on(table.deckId, table.order)
  ]
);
```

**One row per slide, not one jsonb document per deck.** This is deliberate: `CHAT_VS_RUN.md:75` records that `update_lesson_content` "writes full lesson HTML — a single call can be 5–20k tokens of output." A per-slide row makes `update_slide` a surgical edit of a few hundred tokens and `reorder_slides` an order update.

An image block references an asset by `assetId`, never by copying a URL — per the repo rule that persisted columns store relationships, not derived values. The public URL is resolved at render time.

#### New Table: `slide_deck_version`

```typescript
export const slideDeckVersion = pgTable(
  'slide_deck_version',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    deckId: uuid('deck_id').notNull(),
    snapshot: jsonb().notNull(),
    actorId: uuid('actor_id'),
    actorKind: varchar('actor_kind').default('user').notNull(),
    label: varchar(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [
    foreignKey({ columns: [table.deckId], foreignColumns: [slideDeck.id] }).onDelete('cascade'),
    index('slide_deck_version_deck_idx').on(table.deckId, table.createdAt)
  ]
);
```

`actorKind` is one of `user | agent | mcp | import`, so history shows who changed a deck. Snapshots are written by the service layer on every mutating operation — explicitly, in app code. Do not model this on `lesson_language_history`, which no app code writes to.

#### New Table: `slide_progress`

```typescript
export const slideProgress = pgTable(
  'slide_progress',
  {
    id: uuid().default(sql`gen_random_uuid()`).primaryKey().notNull(),
    deckId: uuid('deck_id').notNull(),
    lessonId: uuid('lesson_id').notNull(),
    profileId: uuid('profile_id').notNull(),
    furthestSlideOrder: integer('furthest_slide_order').default(0).notNull(),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'string' }),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' }).defaultNow()
  },
  (table) => [unique('slide_progress_unique').on(table.deckId, table.lessonId, table.profileId)]
);
```

#### New Enum

```typescript
export const slideDeckStatus = pgEnum('slide_deck_status', ['DRAFT', 'PUBLISHED']);
```

#### Modified Table: `lesson`

```typescript
// Added to the existing lesson table. slideUrl is NOT touched.
slideDeckId: uuid('slide_deck_id'),                      // FK slide_deck.id, on delete set null
slideMode: varchar('slide_mode').default('embed').notNull() // 'embed' | 'deck'
```

`slideMode` is stored rather than derived so that a lesson holding both a legacy `slideUrl` and a new deck has one unambiguous answer about what renders.

#### Relationship Diagram

```
organization
└── slide_deck  (org-scoped library)
    ├── slide                (1..n, ordered)
    ├── slide_deck_version   (0..n, explicit history)
    └── slide_progress       (0..n, per learner per lesson)

lesson
├── slideUrl      ──> embed mode  (unchanged)
└── slideDeckId   ──> deck mode   ──> slide_deck
```

### The Slide Document

```typescript
// packages/utils/src/validation/slide/slide.ts
// Gemini's schema validator rejects z.literal on numbers and booleans
// (see agent-tool-schemas.ts:277-278) — discriminate on STRING literals only.

export const ZSlideBox = z.object({
  x: z.number().min(0).max(1920),
  y: z.number().min(0).max(1080),
  w: z.number().min(16).max(1920),
  h: z.number().min(16).max(1080)
});

const ZBlockBase = z.object({
  id: z.string(),
  slot: z.string().optional(),  // set when the layout owns geometry
  box: ZSlideBox.optional(),    // set when the block owns geometry (free / detached)
  align: z.enum(['start', 'center', 'end']).default('start'),
  emphasis: z.enum(['default', 'muted', 'accent']).default('default')
});

export const ZSlideBlock = z.discriminatedUnion('kind', [
  ZBlockBase.extend({ kind: z.literal('heading'), text: z.string().max(200), level: z.enum(['hero', 'section', 'page']).default('page') }),
  ZBlockBase.extend({ kind: z.literal('text'), text: z.string().max(1200) }),
  ZBlockBase.extend({ kind: z.literal('bullets'), items: z.array(z.string().max(200)).min(1).max(8) }),
  ZBlockBase.extend({ kind: z.literal('image'), assetId: z.string(), alt: z.string().max(200), fit: z.enum(['cover', 'contain']).default('cover') }),
  ZBlockBase.extend({ kind: z.literal('code'), code: z.string().max(4000), language: z.string().max(24).default('text') }),
  ZBlockBase.extend({ kind: z.literal('quote'), text: z.string().max(600), attribution: z.string().max(120).optional() }),
  ZBlockBase.extend({ kind: z.literal('kpi'), value: z.string().max(24), label: z.string().max(80) }),
  ZBlockBase.extend({ kind: z.literal('divider') })
]);

export const ZSlideLayout = z.enum([
  'cover', 'title-body', 'two-col', 'bullets', 'image-left',
  'image-right', 'quote', 'code', 'kpi-row', 'section-break', 'free'
]);

export const ZSlide = z
  .object({
    layout: ZSlideLayout,
    blocks: z.array(ZSlideBlock).max(24),
    notes: z.string().max(4000).optional(),
    transition: z.enum(['none', 'fade', 'slide']).default('fade'),
    background: ZSlideBackground.optional()
  })
  .superRefine((slide, ctx) => {
    // Free-position overflow is pure arithmetic — reject it at the boundary
    // so neither a human nor an agent can persist a cropped slide.
    for (const block of slide.blocks) {
      if (!block.box) continue;

      const { x, y, w, h } = block.box;
      if (x + w > 1920 || y + h > 1080) {
        ctx.addIssue({ code: 'custom', path: ['blocks'], message: `Block ${block.id} extends past the 1920×1080 canvas.` });
      }
    }
  });
```

This is the answer to the vertical-budget problem that open-slide's `slide-authoring` skill spends most of its length teaching an agent to solve by hand. Slotted blocks cannot overflow because slots own geometry and text auto-fits; free blocks declare their box, so canvas overflow is arithmetic the schema rejects.

### New Package: `@cio/slides`

Mirrors `@cio/certificates` in shape.

```
packages/slides/src/
  types.ts          TSlideDeck, TSlide, TSlideBlock, TSlideTheme
  theme-vars-base.ts  --slide-* token names + base values (mirrors theme-vars-base.ts
                      in packages/ui/src/custom/org-landing-page/)
  themes/
    classic/vars.ts   editorial/vars.ts   bold/vars.ts   mono/vars.ts
    index.ts          THEMES registry + resolveTheme(id, overrides)
  brand-theme.ts    seedThemeFromOrg({ theme, avatarUrl }) -> TSlideTheme
  layouts/
    index.ts        LAYOUTS registry: layout id -> slot definitions (name, box, role)
  index.ts
```

Rendering components live in `packages/ui/src/custom/slide-deck/` — `deck-canvas.svelte`, `slide-frame.svelte`, `block-*.svelte`, `deck-player.svelte`, `presenter-view.svelte`. All Tailwind classes there carry the `ui:` prefix.

### Export Pipeline

There is exactly one renderer. The API never builds slide HTML itself.

```
POST /slide/deck/:deckId/export {format}
  -> enqueue slide-exports job
  -> worker mints a short-lived signed render token
  -> worker calls Cloudflare Browser Rendering with a URL:
       pdf:  /pdf        { url: <dashboard>/render/deck/:id?token=…, waitForSelector: '[data-deck-ready]' }
       pptx: /screenshot per slide index, then pptxgenjs assembles full-bleed images
  -> upload artifact to object storage, return a signed download URL
```

Constraints that shape this: Cloudflare's default page-load timeout is 4,500 ms, so the render route must be self-contained and must not wait on client-side data fetching; the request body cap is 50 MB, which the `url` form avoids entirely. `apps/api/src/utils/cloudflare.ts` currently accepts only `html` and needs a `url` variant.

The render route serves the deck at true 1920×1080 with print CSS (`@page { size: 1920px 1080px; margin: 0 }`), one frame per slide, and sets `data-deck-ready` once fonts have loaded and animations are settled.

### API and Route Plan

#### Validation Layer

`packages/utils/src/validation/slide/` — `ZSlideBlock`, `ZSlide`, `ZSlideDeckCreate`, `ZSlideDeckUpdate`, `ZSlideCreate`, `ZSlideUpdate`, `ZSlideReorder`, `ZSlideDeckExport`, `ZSlideDeckImport`, plus param schemas. Exported as `@cio/utils/validation/slide` via the existing wildcard export.

#### Query Layer

| Function | Description |
| --- | --- |
| `createSlideDeck(data)` | Insert a deck row |
| `getSlideDeckById(deckId, orgId)` | Deck + ordered slides |
| `listSlideDecks(orgId, filters)` | Paginated library listing |
| `updateSlideDeck(deckId, orgId, data)` | Title, theme, overrides, status |
| `deleteSlideDeck(deckId, orgId)` | Cascade slides and versions |
| `createSlide(deckId, data)` | Insert at an order, shifting successors |
| `updateSlide(slideId, deckId, data)` | Patch layout / blocks / notes / background |
| `deleteSlide(slideId, deckId)` | Delete and compact order |
| `reorderSlides(deckId, slideIds)` | Bulk order update in one transaction |
| `createSlideDeckVersion(deckId, snapshot, actor)` | Append history |
| `upsertSlideProgress(deckId, lessonId, profileId, order)` | Monotonic furthest-slide write |
| `getPublicDeckForLesson(lessonId)` | Deck for the org-site path |

#### Service Layer

`apps/api/src/services/slide/` — `deck.ts`, `slide.ts`, `export.ts`, `import.ts`, `theme.ts`. Services compose query functions, own transactions, snapshot history, and raise `AppError`. No Drizzle in services.

#### Route Layer

Mounted as a single root segment, per the repo rule against nested mounts in `app.ts`. Sub-routers compose in `apps/api/src/routes/slide/index.ts`.

| Method | Path | Middleware | Description |
| --- | --- | --- | --- |
| `GET` | `/slide/deck` | `authMiddleware` | List org decks |
| `POST` | `/slide/deck` | `authMiddleware` | Create a deck |
| `GET` | `/slide/deck/:deckId` | `authMiddleware` | Deck + slides + resolved theme |
| `PUT` | `/slide/deck/:deckId` | `authMiddleware` | Update deck meta |
| `DELETE` | `/slide/deck/:deckId` | `authMiddleware` | Delete a deck |
| `POST` | `/slide/deck/:deckId/duplicate` | `authMiddleware` | Clone into the library |
| `POST` | `/slide/deck/:deckId/slide` | `authMiddleware` | Add a slide |
| `PUT` | `/slide/deck/:deckId/slide/:slideId` | `authMiddleware` | Update a slide |
| `DELETE` | `/slide/deck/:deckId/slide/:slideId` | `authMiddleware` | Delete a slide |
| `PUT` | `/slide/deck/:deckId/reorder` | `authMiddleware` | Reorder slides |
| `GET` | `/slide/deck/:deckId/version` | `authMiddleware` | Version history |
| `POST` | `/slide/deck/:deckId/version/:versionId/restore` | `authMiddleware` | Restore a snapshot |
| `POST` | `/slide/deck/:deckId/export` | `authMiddleware` | Enqueue export, return `jobId` |
| `GET` | `/slide/deck/:deckId/export/:jobId` | `authMiddleware` | Job status + signed URL |
| `POST` | `/slide/deck/import` | `authMiddleware` | PPTX → deck |
| `GET` | `/slide/deck/:deckId/comment` | `authMiddleware` | List comment pins |
| `POST` | `/slide/deck/:deckId/comment` | `authMiddleware` | Create a pin |
| `POST` | `/slide/deck/:deckId/comment/apply` | `authMiddleware` | Hand pins to the agent, return `runId` |
| `POST` | `/slide/progress` | `authMiddleware` | Record furthest slide |

The existing org-site route `GET /org-site/course/:courseSlug/item/:itemSlug` is extended to include `deck` on `PublicLessonContent`; locked lessons omit it, matching `body` and `video`.

#### AI Tool Surface

Schemas go in `packages/core/src/services/agent/agent-tool-schemas.ts`; implementations in `chat-tools.ts`; prompt guidance in `packages/ai-assistant/src/prompt/teacher.ts`. **Nothing is added to `packages/ai-assistant/src/tools/` — that directory is dead code.**

| Tool | Mode | Notes |
| --- | --- | --- |
| `get_slide_deck` | chat | Read deck and slides |
| `update_slide` | chat | One row, surgical |
| `reorder_slides` | chat | Array of slide ids |
| `apply_deck_theme` | chat | Theme id plus overrides |
| `create_slide_deck` | **run** | Emits N slides |
| `add_slides` | **run** | Emits N slides |
| `generate_deck_from_lesson` | **run** | Reads `lesson_language.content` |
| `import_pptx_deck` | **run** | Reuses `document.ts` extraction |

`orgId` and `courseId` are never tool parameters — they are injected from the authed request (`agent-tool-schemas.ts:17`, `:29`). `deckId` is a parameter, re-verified against the org on every call. The four run-mode tools seed `RUN_ONLY_TOOL_NAMES` and are added to `DURABLE_AGENT_TOOL_NAMES` (`chat-tools.ts:74-90`); `deckId` is added to `extractOutputIds` (`:228-239`) so run events carry it.

#### MCP Tools

`packages/mcp/src/tools/slide-decks.ts`, registered from `src/index.ts`, wrapping the same validation schemas over the public API. Required alongside:

- A `course:slides:write` scope added to **both** `packages/utils/src/validation/organization/automation-key.ts:6-17` and the `mcp` defaults at `apps/api/src/services/organization/automation-key.ts:21-35`, or existing keys 403.
- Credit costs in `MCP_TOOL_CREDIT_COST` (`packages/utils/src/plans/automation.ts:15-33`) and a category in `getMcpAutomationCategory` — this is type-enforced at the `assertMcpAutomationUsageAllowed` call site.
- Tool list updated in both `packages/mcp/README.md` and `apps/docs/content/docs/mcp.mdx`.

### Frontend Plan (Dashboard)

Follow `CLAUDE.md` layering strictly.

- **Feature folder**: `apps/dashboard/src/lib/features/slides/` with `api/`, `components/`, `pages/`, `store/`, `utils/`.
- **Request types** in `utils/types.ts`, inferred from the RPC client (`typeof classroomio.slide.deck.$get`), never imported from `@cio/db/queries`, never declared in a `.svelte.ts` file.
- **API class** `api/slide-deck.svelte.ts` extending `BaseApiWithErrors`, using `this.execute<RequestType>()`. Components stay thin.
- **Editor state** in `store/deck-editor.store.svelte.ts` — selection, dirty tracking, undo stack. Use `SvelteSet`/`SvelteMap` for reactive collections; reset on explicit handlers, never in an `$effect` tied to a steady boolean.
- **Routes**: `(app)/org/[slug]/decks/+page.svelte` (library) and `(app)/org/[slug]/decks/[deckId]/+page.svelte` (editor); `routes/render/deck/[deckId]/+page.svelte` for the headless render target.
- **Navigation**: add a Decks entry to `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`.
- **Image insertion** in the deck editor uses the existing pipeline (`$lib/utils/services/upload.ts` → `POST /media/image`) plus a media-manager picker. This is new wiring; the TipTap editor's own gap is out of scope.
- **Translations**: every string in `apps/dashboard/src/lib/utils/translations/en.json`, then `cd apps/dashboard && pnpm translate` for the other nine locales, including the `ai_assistant.tool.{pending,done}.*` keys for each new tool.
- **Tool labels**: register each tool in `features/ai-assistant/utils/tool-labels.ts` — `TOOLS_WITH_PENDING_COPY`, a case in `getCompletedToolLine`, and `MUTATION_TOOLS`.
- **Scroll to top**: the deck library is a long catalog and mounts `ScrollToTop` from `@cio/ui/custom/scroll-to-top`.

---

## Implementation Order

### Phase 1: Schema and Package

1. Add `slideDeckStatus` enum and `slideDeck`, `slide`, `slideDeckVersion`, `slideProgress` tables to `packages/db/src/schema.ts`; add `slideDeckId` and `slideMode` to `lesson`.
2. Generate and review the migration in `packages/db/src/migrations/`.
3. Create `packages/slides` with types, `theme-vars-base.ts`, four built-in themes, `brand-theme.ts`, and the layout registry.
4. Add `packages/utils/src/validation/slide/` with the schemas above.
5. Run `pnpm --filter @cio/db build && pnpm --filter @cio/utils build`.

### Phase 2: Query, Service, Route

1. Add `packages/db/src/queries/slide/` per the query table; every catch logs `console.error('functionName error:', error)`.
2. Add `apps/api/src/services/slide/` — deck, slide, theme; history snapshot on every mutation.
3. Add `apps/api/src/routes/slide/` and compose in `routes/slide/index.ts`; mount `app.ts` at `/slide`.
4. Run `pnpm --filter @cio/api^... build && pnpm --filter @cio/api build`.

### Phase 3: Render and Player

1. Add `packages/ui/src/custom/slide-deck/` components with `ui:`-prefixed classes and Storybook stories for every block kind, layout, and player state.
2. Add the headless render route and the `data-deck-ready` signal.
3. Wire the learner player into the lesson view and `slide_progress`.
4. Run `pnpm --filter @cio/ui prefix` and `pnpm --filter @cio/dashboard build`.

### Phase 4: Editor

1. Build the deck library page and the three-pane editor with layout mode.
2. Add free-position mode: drag, resize, snap guides, and the schema-backed overflow guard.
3. Add the theme gallery and the org brand seed.
4. Add version history drawer and restore.
5. Wire the lesson Slide tab's two modes, folding in the embed picker from `prototypes/slide-embed-picker/`.

### Phase 5: Export and Import

1. Add a `slide-exports` queue to `packages/jobs/src/queues/names.ts`, an enqueue helper, and `apps/jobs/src/workers/slide-exports.ts`.
2. Add the `url` variant to `apps/api/src/utils/cloudflare.ts`.
3. Implement PDF export, then PNG-per-slide, then PPTX assembly with `pptxgenjs`.
4. Implement PPTX import: text extraction, `ppt/media/*` extraction to assets, mapping review, unplaced-assets tray.

### Phase 6: AI, MCP, and Public

1. Add tool schemas and implementations; seed `RUN_ONLY_TOOL_NAMES` and implement the chat-mode gate.
2. Update the teacher prompt; register tool labels and all translation keys.
3. Add comment pins and the apply-to-agent flow.
4. Add MCP tools, the new scope in both places, and credit costs; update both docs surfaces.
5. Extend `PublicLessonContent`, the public-course query, and the mapper; render decks on the org site.
6. Add presenter mode.
7. Run `pnpm format:check`, `pnpm --filter @cio/api build`, `pnpm --filter @cio/dashboard build`.

## Acceptance Criteria

1. A teacher creates a deck from the library, adds slides across every layout, reorders by drag, and saves.
2. A block can be detached to free position, dragged, and resized; a block pushed past the canvas is rejected with a specific message rather than silently cropped.
3. Text that would overflow its slot or box auto-fits within the theme's type range, and surfaces a warning when it cannot.
4. Applying a theme changes every slide's appearance and changes no content.
5. The org's seeded theme appears first in the gallery and reflects `organization.theme` and `organization.avatarUrl`.
6. A deck attached to a lesson renders in the Slide tab in deck mode; switching to embed mode restores the previous `slideUrl` unchanged.
7. A learner advances a deck in the LMS, and `slide_progress.furthestSlideOrder` increases monotonically; a completion-gated lesson does not complete until the last slide is reached.
8. A public course page renders a deck for an unlocked public lesson and omits it entirely for a locked one.
9. Presenter mode opens in a new window showing current slide, next slide, notes, and timer, and responds to every documented key.
10. PDF export produces one 1920×1080 page per slide with correct fonts and theme colours.
11. PPTX export opens in PowerPoint and Keynote with one image-backed slide per source slide.
12. A `.pptx` upload produces a deck with one slide per source slide, extracted media in the asset tray, and a mapping review step before commit.
13. The AI assistant builds a deck from a lesson via a durable run, streams slides into the rail, and can be cancelled mid-run.
14. A heavy slide tool invoked in chat mode is rejected by the API-layer gate and routed to a run.
15. A comment pin applied by the agent edits only the addressed block and appears in version history with `actorKind = 'agent'`.
16. An MCP client with a `course:slides:write` key can create and update a deck; a key without the scope receives 403.
17. Version history records every mutation with the correct actor, and restore returns the deck to that snapshot.
18. External embeds via `slideUrl`, lesson notes, videos, and documents behave exactly as before (zero regression).
19. All user-facing strings use translation keys and are present in all ten locale files.
20. `pnpm format:check`, `pnpm --filter @cio/api build`, and `pnpm --filter @cio/dashboard build` pass.

## Risks and Mitigations

- **Risk**: The Svelte player and the export renderer drift, so a deck looks different in the LMS than in its PDF.
  - **Mitigation**: There is only one renderer. Export drives the same Svelte components through a headless render route in a real browser, rather than a parallel HTML-string renderer. Acceptance criterion 10 compares them directly.
- **Risk**: Cloudflare's 4,500 ms default page-load timeout kills exports for large decks.
  - **Mitigation**: The render route is server-rendered and self-contained, waits on no client fetch, and signals readiness with `data-deck-ready` so `waitForSelector` gates the capture. PPTX captures per slide, so per-request work stays constant regardless of deck length. Long decks run as a background job with progress, never inline.
- **Risk**: Free-position mode reintroduces the cropped-slide problem that layouts solve, especially for AI output.
  - **Mitigation**: Every free block declares an explicit box, so canvas overflow is arithmetic rejected by `ZSlide.superRefine` at the API boundary. The editor shows an overflow dot on the slide rail, and tool results return the validation error so the agent self-corrects.
- **Risk**: A deck stored as HTML anywhere would be destroyed by the lesson sanitizer, which strips `iframe`, `object`, and `embed`.
  - **Mitigation**: Decks never travel through `lesson_language.content`. Blocks are structured jsonb rendered by components — the `lesson.videos` pattern, which already works around this.
- **Risk**: Heavy deck generation runs inline in chat, where there is no retry, resume, progress, or cancel.
  - **Mitigation**: Implement the API-layer gate that `CHAT_VS_RUN.md:87` recommends, and seed `RUN_ONLY_TOOL_NAMES` with the four generating tools. Acceptance criterion 14 tests the rejection path.
- **Risk**: PPTX import disappoints because layout and fonts are not reconstructed, and teachers expect a faithful copy.
  - **Mitigation**: The import banner states the limitation before upload, the mapping review step lets the teacher fix every layout choice, and extracted media is offered rather than dropped. Framed as "bring your content across", not "open your PowerPoint".
- **Risk**: PPTX export ships image-only slides, and a teacher expecting editable text feels misled.
  - **Mitigation**: The export dialog states what each format produces before the teacher commits. Text-native PPTX is an explicit v2.
- **Risk**: Scope. This is a product, not a feature, and it overlaps `prototypes/slide-embed-picker/`.
  - **Mitigation**: The embed picker ships as `embed` mode inside this surface rather than as separate work, so the tab is designed once. Phases 1–4 deliver a usable authoring product before AI, MCP, export, and public rendering land.
- **Risk**: MCP tools are stdio-only, so "edit decks with Claude" works on a laptop but not from Claude on the web.
  - **Mitigation**: Documented as a v1 limitation in both `packages/mcp/README.md` and `apps/docs/content/docs/mcp.mdx`. A hosted transport is tracked separately and is not a dependency of this feature.
- **Risk**: Deck deletion orphans a lesson that points at it.
  - **Mitigation**: `lesson.slideDeckId` is `on delete set null`, and the Slide tab falls back to the mode chooser. The library warns when deleting a deck attached to lessons and names them.
