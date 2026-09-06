# PRD — Slide Embed Picker

**Feature area:** Course → Lesson → Materials → Slide tab
**Status:** Draft for review
**Author:** Design exploration (cloud agent)
**Related prototype:** [`index.html`](./index.html) — three interaction directions behind the prototype picker

---

## 1. Problem

The Slide tab is a single unlabeled URL input with one line of helper text: _"You can embed Google Slides or Canva Presentation."_ (`apps/dashboard/src/lib/features/course/components/lesson/slide/slide.svelte`).

This creates three problems for the teacher building a lesson:

1. **It isn't clear _what_ to paste.** A raw edit URL (`.../edit#slide=id.p`) does not embed. Google Slides needs a _published_ `/embed` link; Canva needs `?embed`; PowerPoint, Pitch, Gamma and SlideShare hand you a full `<iframe>` embed code, not a link. The field looks identical for all of them and silently fails when the wrong string is pasted.
2. **It isn't clear _which platforms_ are supported.** The copy names two (Google Slides, Canva). In reality the same `<iframe>` mechanism works for at least ten major tools, but a teacher has no way to know that.
3. **There's no help path.** When the embed shows a blank frame or a "sign in" screen, the teacher is stuck — there is nowhere to click for guidance.

The only transform the current code does is append `?embed` for `www.canva.com` URLs. Everything else is passed through verbatim.

## 2. Goals

- Make embedding a deck **obvious and low-error**: the teacher always knows what to paste and can see it working before saving.
- **Surface the breadth of support** with a visual, icon-forward platform picker.
- Give every platform a **one-click path to step-by-step docs**.
- **Normalize input into a valid embed `src`** (accept a share link _or_ a pasted `<iframe>` embed code) so a correct render is the default, not the exception.
- Preserve the existing data contract: the lesson still persists a single `slideUrl`. (Per repo guidance, the persisted column stores the resolved embed URL/data, not presentational markup.)

## 3. Non-goals

- Uploading raw `.pptx` / `.key` files for hosting (these platforms host the deck; we embed it).
- Building a slide _editor_. We embed decks authored elsewhere.
- Server-side scraping of private decks or bypassing a platform's own auth wall.
- Analytics on embedded decks (several platforms explicitly don't expose this).

## 4. Top 10 supported platforms

Ranked by prevalence in education/SaaS plus reliability of the public embed path. Each row lists **what the teacher pastes** and **how we turn it into an embed `src`**. All mechanics were verified against each vendor's current help docs (Aug 2026).

| # | Platform | Teacher pastes | We produce | Notes |
|---|----------|----------------|------------|-------|
| 1 | **Google Slides** | Publish-to-web link | `https://docs.google.com/presentation/d/e/<ID>/embed?start=false&loop=false&delayms=3000` | File → Share → **Publish to web** → Embed. We rewrite `/pub` · `/edit` · `/present` → `/embed`. |
| 2 | **Canva** | Design view link or embed code | `https://www.canva.com/design/<ID>/view?embed` | Share → More → **Embed**. We append `?embed` (current behavior, kept). |
| 3 | **Microsoft PowerPoint** (OneDrive / Office for the web) | `<iframe>` embed code | `src` extracted from the pasted iframe (`onedrive.live.com/embed?...`) | File → Share → **Embed** in PowerPoint _for the web_. Personal OneDrive avoids the sign-in wall. |
| 4 | **Apple Keynote** (iCloud) | iCloud share link | `https://www.icloud.com/keynote/<id>?embed=true` | **Collaborate** → Copy Link (Anyone / View only). We strip `#name` and append `?embed=true`. Collaboration must stay on. |
| 5 | **Figma Slides** | `figma.com/slides/…` or `/deck/…` link | `https://embed.figma.com/slides/<KEY>?embed-host=classroomio` | Embed Kit 2.0: swap `www` → `embed`, keep `slides`/`deck`, add `embed-host`. |
| 6 | **Prezi** | View link or embed code | `https://prezi.com/view/<ID>/embed` | Share → **Embed**. We append `/embed` to the view link. |
| 7 | **Pitch** | `<iframe>` embed code (public link) | `src` extracted (`pitch.com/embed/<id>`) | Share externally → link → **Copy embed code**. Disabling the link breaks the embed. |
| 8 | **Gamma** | Embed code or public deck link | `src` extracted / `gamma.app/embed/<id>` | Share → enable **public access** → copy iframe. |
| 9 | **SlideShare** | `<iframe>` embed code | `src` extracted (`slideshare.net/slideshow/embed_code/key/<KEY>`) | Public decks only; LinkedIn-owned. |
| 10 | **Beautiful.ai** | Public link or embed code | `src` extracted / player link | Sharing Settings → **Public** → Get Embed Code (iframe) or oEmbed link. |

**Two input shapes.** Six platforms give the teacher a **link** we transform (Google Slides, Canva, Keynote, Figma, Prezi, Beautiful.ai); four hand over a full **`<iframe>` embed code** (PowerPoint, Pitch, Gamma, SlideShare). The picker therefore accepts either — if the pasted value contains an `<iframe>`, we lift its `src`; otherwise we apply the platform's link transform.

## 5. Proposed feature — the Slide Embed Picker

Replace the bare input with a small, guided flow:

### 5.1 Feature list

1. **Visual platform picker.** A gallery of the 10 platforms, each as a branded icon tile, so the teacher sees at a glance what's supported.
2. **Per-platform tailored input.** Selecting a platform reveals the _right_ field for it — a single link input or an embed-code area — with placeholder + one-line "where to find it" microcopy specific to that platform.
3. **Paste normalization.** Accepts a share link _or_ a full `<iframe>` embed code and resolves it to a valid embed `src` (extract-src or link-transform per §4).
4. **Live preview.** A 16:9 preview renders the resolved embed before saving, with an explicit **"Embed ready"** confirmation, so failures are caught at author time, not by students.
5. **Inline validation.** If the pasted value doesn't match the chosen platform (e.g. an `/edit` link that was never published), show a specific, fixable message ("This looks like an edit link — publish to the web first").
6. **"How to embed" docs button.** Every platform has a deep link to `classroomio.com/help/build-a-course/embed-slides#<platform>` for step-by-step help.
7. **Auto-detect (accelerator).** When a teacher pastes first, detect the platform from the URL/host and pre-select it, so an expert can skip the gallery.
8. **Change / clear.** Easy path back to the gallery to switch platforms or remove the deck.
9. **Accessibility & i18n.** Keyboard-navigable tiles, labelled controls, all copy in `en.json` (no hardcoded strings), reduced-motion respected.
10. **Backward compatible.** An already-saved `slideUrl` re-opens in the matching platform's editor state; the stored value stays a single embed URL.

### 5.2 Interaction directions (see prototype)

The prototype explores three genuinely different ways to structure the same flow. They are meant to be compared, not combined:

| Direction | Interaction model | Best when | Cost |
|-----------|-------------------|-----------|------|
| **Gallery** | Browse a grid of platform tiles → focus into a per-platform input + preview | Discovery matters; teacher may not know what's supported | One extra click before typing |
| **Command Bar** | Paste first into one smart field → platform auto-detects → preview + contextual docs | Fast, repeat authors who already have the link | Less discoverable; leans on detection |
| **Guided** | Searchable platform rail + step-by-step instructions beside the input | First-timers who need hand-holding to get a valid link | Densest; most vertical space |

## 6. UX flow (happy path)

1. Teacher opens the **Slide** tab (empty).
2. Picks **Google Slides** from the gallery (or pastes a link and it auto-selects).
3. Field shows the Google-specific placeholder + "File → Share → Publish to web → Embed."
4. Teacher pastes the published link. We rewrite it to the `/embed` form.
5. **Live preview** renders; a green **Embed ready** badge appears.
6. Autosave persists the resolved `slideUrl` (existing save behavior).
7. In view mode, students see the embedded deck (existing `<iframe>` render).

Unhappy path: pasted an unpublished `/edit` link → inline message + **How to embed** button → docs.

## 7. Data & implementation notes

- **No schema change.** Continue to persist `slideUrl` (resolved embed `src`). Do not store the raw `<iframe>` markup in the content column — extract and store only the `src` (repo rule: persisted columns store data, not presentation).
- **Where the logic lives.** Platform configs (id, brand, input kind, placeholder, docs link, `test`, `resolve`) belong in a pure util, e.g. `apps/dashboard/src/lib/features/course/utils/slide-embed.ts`, so both detection and transform are unit-testable and reused by the view-mode `getUrl()` normalizer that today only special-cases Canva.
- **Docs.** Add `apps/help/content/help/build-a-course/embed-slides.mdx` with a section per platform and stable `#<platform>` anchors matching the `docs` links.
- **Copy.** New keys under `course.navItem.lessons.materials.tabs.slide.*` in `en.json`; translate to the other locales before commit.
- **Component.** Keep the component thin; put resolve/validate logic in the util and (if any request is added) an API class — no business logic in the `.svelte` file.

## 8. Success metrics

- ↓ rate of saved `slideUrl` values that render a blank/invalid frame (measured by view-mode load failures).
- ↑ share of lessons that include a working embedded deck.
- ↓ support questions tagged "slides won't embed".
- Time-to-first-working-embed for a new teacher.

## 9. Open questions

1. Do we allow a raw pasted `<iframe>` for _any_ host (generic passthrough), or only the 10 allow-listed platforms (safer, sanitized)?
2. Should the preview load the real remote iframe at author time, or a lightweight resolved-URL confirmation (avoids third-party auth walls during editing)?
3. Per-platform embed options (autoplay, loop, start slide for Google Slides) — expose now or defer?
4. Which direction from §5.2 do we ship? (This is the decision the prototype picker exists to make.)
