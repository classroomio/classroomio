# Course builder: handoff

Where the work stands, so any agent can continue. Read in this order: this file, the [plan](README.md), then the [proposed code](implementation.md) for the part you pick up.

Last updated: 2026-11-19, on branch `feat/onboarding-v2`. **Nothing is committed.**

## 1. Ground rules from the product owner

These override anything else you find, including older notes in research files:

1. **Build for any organisation.** We don't know who our customers will be. Example companies are test cases, never design targets.
2. **No product- or vendor-specific code, and no such mentions in the plan.** One universal reader for every site. Study systems to learn what works, then implement it neutrally. If a fix only makes sense for one site, find the general signal behind it.
3. **Accuracy and completeness come first.** Reading fewer pages is secondary.
4. **Exactly 4 courses in onboarding**, no "more we can build". Courses never reference each other. Quizzes on by default. Claude for every model step.
5. **If the site gives nothing useful, spend no tokens and build nothing.** No new "describe your business" screen.
6. **Pause between steps** of a larger piece of work and report before continuing.

Repo rules that bite here: [CLAUDE.md](../../CLAUDE.md) and [`skills/writing-code/SKILL.md`](../../skills/writing-code/SKILL.md) (no comments except external constraints). Use Node 24: `export PATH="$HOME/.nvm/versions/node/v24.22.1/bin:$PATH"`. Don't run `pnpm translate` (the owner translates separately). Never run the dashboard Vite build; use `svelte-check` and `vitest`. Commit only when asked, Conventional Commits, no agent attribution or `Co-authored-by` lines, and run the fact-check sub-agent of [`skills/stage-and-commit/SKILL.md`](../../skills/stage-and-commit/SKILL.md) before each commit.

## 2. Done

### 2.1 Plan and research

| File | State |
|---|---|
| [README.md](README.md) | The plan. Rewritten neutral: universal reader, evidence-based discovery, a 40-site sample with a held-out split |
| [implementation.md](implementation.md) | Proposed code for every stage, linked to the plan |
| [research.md](research.md), [website-sources-research.md](website-sources-research.md), [academy-course-research.md](academy-course-research.md) | Evidence. They name real products and vendors because they record what was studied; the plan and the code must not |

### 2.2 Code in `packages/course-builder` (`@cio/course-builder`)

37 unit tests pass, the type check is clean, formatting passes.

| Module | What it does | Plan |
|---|---|---|
| `src/llm/models.ts`, `usage.ts`, `claude.ts` | Claude client on the official SDK: model and effort per role, cached system prompt, structured output (`structured`), cited prose from search-result blocks (`cited`), refusal fallback on Opus and Sonnet, usage and cost ledger | §2, §5.1 |
| `src/scope/scope.ts` | Scope helpers: include and exclude globs, extra hosts, URL normalization, `inScope()`; 10 unit tests | §1 |
| `src/eval/coverage.ts` | Coverage judge: scores a generated outline against a gold course, section by section. Validated: gold against itself 1.00, a generic outline 0.13, stable across runs, about $0.005 a run | §13 |
| `src/fetch/*` | Safe fetching (private networks blocked on every connection and redirect, size and time caps, decompression), polite per-host queue with robots.txt, crawl delay, `Content-Signal`, 429/503 retries | §6.1, §14 |
| `src/discover/*` | Evidence-based discovery: site links (homepage and llms.txt), guessed subdomains, redirects including meta refresh, wildcard DNS, off-brand redirects, `names-itself-after-brand` versus `probe-only`, access marked `open`, `login` or `challenge`, sitemaps and llms.txt per source, YouTube channel | §6.1 |
| `src/sources/types.ts` | The neutral page tree (`SourcePage`, `SourceTree`, `TreeEntry`), reading-order layout that survives cycles, completeness at 98% | §6.2 |
| `src/sources/sitemap.ts` | Sitemap and sitemap-index reader | §6.2.1 |

**One deliberate deviation in `src/scope/scope.ts`:** `globToRegExp` escapes `?` as a literal character. The proposed code in impl §1 leaves `?` unescaped, so it acts as a regex quantifier: `https://acme.com/search?q=*` would match `searchq=...` but never the literal question mark, and patterns with `?` would silently match the wrong URLs. Escaping it makes glob patterns behave the way their author expects while leaving `*` as the only wildcard.

**Live check of discovery** (`node eval/discover-sites.mjs <sites>`), on three sites never used to tune the current rules:
- A help center reached only through a guessed `support.` subdomain that redirects to another domain was accepted (`redirect-from-own-name`, access `login`).
- Three subdomains that are customer spaces on the organisation's own multi-tenant product were held back (`probe-only`).
- A guessed `docs.` subdomain that is also a customer space ("A's School") was held back. The previous, vendor-aware version had accepted it.

### 2.3 Evaluation data and scripts

| File | What it is |
|---|---|
| `eval-data/energis/` (git-ignored) | The gold course outline (16 sections, 36 lessons), a snapshot of that organisation's public knowledge base (140 current pages, archived pages removed) and 181 product pages. Ground truth for coverage and for the reader's completeness |
| `eval/snapshot-energis.mjs` | **Evaluation-only** script that captured that snapshot. It reads the knowledge base through its host's public REST API to get an exact page list, which is acceptable for establishing ground truth (plan §13: tooling that never ships). Don't copy its approach into `src/` |
| `eval/sites-icp.json`, `eval/sites-scale.json` | The customer sample (primary) and the scale sample, 40 sites each: 25 development, 15 held out, split by SHA-256 of the domain before any site was fetched. Each holds its development ground-truth summary (§4.1) |
| `eval/collect-truth.mjs` | **Evaluation-only** ground-truth collector: robots.txt and sitemaps (indexes, gzip), `llms.txt`, link-crawl fallback, reviewed overrides and locales. Writes `eval-data/<site>/truth.json`; never imports `src/` |
| `eval/truth-curation.json` | Reviewed per-site decisions: kept and added sources, excluded candidates, inventory overrides, null sources with reasons |
| `eval/audit-truth.mjs` | **Evaluation-only** audit of a split: per-source counts, missing kept sources, duplicate roots, pages on sibling hosts, null counts (`node eval/audit-truth.mjs [dev\|held]`) |
| `eval/validate-judge.mjs` | Re-runs the coverage judge sanity checks. Needs `ANTHROPIC_API_KEY` (`node --env-file=../../apps/api/.env eval/validate-judge.mjs`) |
| `eval/discover-sites.mjs` | Prints the source map for any list of sites |
| `eval/check-gold.mjs` | Item 10 on the gold course in steps (checks, repair, review, independent judge, label sheet), plus `--step=package`, which writes the learning package for an import |
| `apps/api/scripts/import-learning-package.ts` | **Evaluation-only** import of a learning package into one organisation of a local database, through the worker's own publisher (`publishPackageCourse`) |
| `eval/build-site.mjs` | Item 12 without the host: the build stages on one live site, step by step (`discover`, `read`, `prepare` are free; `understand`, `plan`, `write`, `finish` are paid; `package`), saving each step under `eval-data/<site>/build/`. Stops sending requests at `--budget` (default $15) across steps |
| `eval/http-cache.mjs` | The HTTP cache `read-sites.mjs` and `build-site.mjs` share (`eval-data/http-cache`) |

Ground truth is each source's own published inventory: robots.txt sitemaps, sitemap indexes (including gzip), `llms.txt`, and reviewed overrides, filtered to one locale. Assets, marketing pages and user-generated paths are excluded. A source behind a login or challenge, or one that publishes no page inventory, is recorded with `pageCount: null` and a note rather than a guessed count. All 40 sites are covered; the 25 development sites are summarised in `eval/sites.json`.

Development set totals: **25 sites, 55 sources, 231,123 pages**. Of those sources, 46 have a counted inventory; 9 are `null` with a recorded reason (Workday docs, Gusto help, Cloudflare support, Salesforce Help and Developer, Airtable Academy, Freshworks developer docs and university, BambooHR developers). Every reviewed keep source is either counted or recorded `null`; none is silently missing. Where a site publishes one English locale and many translations, the English count is recorded in `pageCounts` and the all-locale count in `pageCountAllLocales`.

The collector keeps a source's inventory on that source's own host (a `www.` prefix is treated as the same host). It never mixes pages from a sibling subdomain into a source, because the sample counts each of those as its own source. `audit-truth.mjs` reports any file that still contains such pages.

## 3. Removed, and why

Removed because the owner ruled out product- and vendor-specific code:

- Three per-vendor readers (a wiki reader, two help-desk readers), their registry, tests and scripts.
- Platform detection (`src/discover/platforms.ts`) and the list of hosted-help domains used to judge ownership.
- Vendor names in anti-bot detection; it now uses status, visible text and generic wording.
- Discovery rules that dropped login and anti-bot landings. Those are now recorded as `access` and left to the reader.

What those readers proved still matters, and is captured as neutral requirements in the plan: complete reading needs an inventory to compare against, the site's own order, and copying images that expire.

## 4. Work items, in order

Each item links to its proposed code. Pause after each and report.

| # | State | Work | Code | Done when |
|---|---|---|---|---|
| 1 | Done: both samples collected, reviewed and verified (§4.1) | **Site sample and ground truth.** Pick at least 40 process-heavy B2B organisations without looking at their site technology; fix a 25/15 development and held-out split; record each one's real sources and page counts | [impl §13](implementation.md#13-evaluation) | `eval/sites-icp.json` and `eval/sites-scale.json` committed, `eval-data/<site>/truth.json` for the development sites |
| 2 | Done (reviewed) | Scope helpers | [impl §1](implementation.md#1-scope) | Unit tests pass (12). Review fixed a root with a trailing slash rejecting the same URL without one, and malformed or non-web URLs throwing |
| 3 | Code done; measured on the customer sample's development split and the scale sample, every loss the reader could fix is fixed (§4.7, §4.9); tree accuracy needs person-labelled trees (§4.8) | **Universal reader**: inventory, representations, structure, relevance, locale, media capture, orchestrator | [impl §2](implementation.md#2-universal-reader) | Unit tests of impl §2.10 pass (29); on development sites, reading ≥ 98% of each source's `readTarget` and tree accuracy ≥ 95% |
| 4 | Done (§4.3); shell share measured and rendering checked on two shell sources (§4.9): needed in production, rollout with item 12 | Headless renderer in the host, behind a flag | [impl §2.4](implementation.md#24-headless-rendering-host-side) | Pages that are script shells are read; private networks blocked in the browser |
| 5 | Open | **First measurement on the gold organisation:** can the universal reader reach its knowledge base (landing asks to log in; robots.txt allows the content path) and read all 140 pages in order? | [impl §2](implementation.md#2-universal-reader) | Result recorded here. If it can't, document why and what neutral mechanism would close the gap |
| 6 | Code done; exclusions, replacement rule and gate measured and fixed (§4.9); person-made exclusion labels open (§4.8) | Corpus and gate | [impl §3](implementation.md#3-corpus), [§4](implementation.md#4-usefulness-gate) | Exclusions match the ground truth on development sites; the gate stops nothing-useful sites with no tokens |
| 7 | Done: gold corpus $0.096 for 123 pages ($0.086 per 110), no failures (§4.10, §4.11); aliases measured with item 12 | Page cards and glossary | [impl §5](implementation.md#5-page-cards) | Cards for the gold corpus at under $0.10 |
| 8 | Done: gold coverage 90.6% at plan level, $1.08 for the whole run (§4.11) | Curriculum and briefs | [impl §6](implementation.md#6-curriculum-and-briefs) | Gold coverage ≥ 90% at plan level (`judgeCoverage`) |
| 9 | Done: the gold Administrator course written end to end with citations, $1.68 (§4.12); YouTube channel matching to tune with real channels | Writing, quizzes, media | [impl §7](implementation.md#7-writing-and-quizzes), [§8](implementation.md#8-media) | One course written end to end with citations |
| 10 | Gold course: 99.4% grounded as written, 99.7% after checks, repair and review, nothing removed, $0.34 of pipeline cost (§4.6); judge validated against the product owner's labels (89% and 84%, every miss explained and the causes fixed), development sites open (§4.6, §4.8) | Checking, repair, review | [impl §9](implementation.md#9-checking-repair-and-review) | Groundedness ≥ 98% on development sites |
| 11 | Done: the checked gold course imported into a local organisation and renders (§4.5) | Learning package and ClassroomIO export | [impl §10](implementation.md#10-learning-package), [§11](implementation.md#11-classroomio-export) | A generated course imports and renders in ClassroomIO |
| 12 | In progress (§4.13): publisher in `@cio/core`, build stages in the package, tables, queries, the 7-queue worker and its orchestration built and tested; free stages measured on Raken; onboarding and dashboard wiring, image storage and the paid end-to-end run open | Host integration and onboarding | [impl §12](implementation.md#12-host-integration) | End to end on a fresh account |
| 13 | Open | Held-out run | [impl §13](implementation.md#13-evaluation) | All targets of plan §13 met on held-out sites without changing rules for them |

### 4.2 Universal reader (item 3): state

Code in `packages/course-builder/src/read/`: `types.ts`, `inventory.ts`, `representations.ts`, `structure.ts`, `relevance.ts`, `locale.ts`, `media.ts`, `read-source.ts` (entry point `readSource`). `src/fetch/robots.ts` gained `allowPaths`. 29 unit tests: `parts.test.ts` (each piece) and `read-source.test.ts` (whole reader on fictional sites: sitemap-only, sidebar menu, index pages, offered Markdown, script shells with a renderer, login landing with robots `Allow:`, anti-bot pages, duplicates, restricted, robots-excluded and other-language pages, off-brand sources, page limit).

Changes from the proposed code in implementation §2, all deliberate:
- **The inventory keeps each page's original spelling for fetching** and uses the normalised URL only as its key: some servers treat `/wiki/` and `/wiki` differently.
- **Pending pages are a queue,** not a scan per step (quadratic on large sites).
- **Main-content scoring measures text once per page** (one pass), not per element.
- **Pages that only list links become groups** (`index` status, not counted as content): a help home or category page has nothing to teach but holds the tree, and its links must still be followed. Without this, a site whose home page is a list of links was never crawled.
- **Menus need 3 in-scope links, not 5,** so short sidebars of small sites count; the 60% in-scope share still applies.
- **Page-data trees recognise group items** (a titled object holding an array of pages), not only arrays of pages.
- **Feeds** (RSS, Atom, JSON Feed) advertised by the first page read join the inventory; the page's `hreflang` alternate in the wanted language is queued when a page is in another language; each page's media is returned for the corpus stage.

Not done yet in item 3:
- **Live measurement** on the customer sample's development sites, against `verification.readTarget` (§4.1). `eval/read-sites.mjs` is written (reads each truth source from its root, reports completeness against `readTarget`, exact recall, outcome, representations and which signal placed each page); it waits on verified customer-sample truth.
- **Threshold tuning** (menu and index link shares, shell text size, relevance sample) on development sites only.
- **Copying images during the build** is the host's job (impl §2.8); the reader returns the media list.

### 4.3 Headless renderer (item 4): state

Code in `apps/jobs/src/services/course-builder/`:
- `renderer.ts`: `createRenderer({ userAgent, cdpEndpoint?, maxConcurrentPages = 3, recycleAfter = 200, policy? })` returns the reader's `PageRenderer` plus `close()`. A local headless Chromium (`playwright-core`, pinned to the repo's 1.57.0) is launched on first use, or a hosted browser is joined with `connectOverCDP` when `cdpEndpoint` is set. Each render gets a fresh context (no downloads, service workers blocked) and returns the rendered HTML plus the JSON responses the page loaded (at most 50, 2 MB each); the reader keeps only same-host JSON.
- **Private networks are blocked twice.** Before a request is sent, its host must resolve only to public addresses (`isPrivateAddress` from the package, decision cached per host per render); other schemes, images, media, fonts and WebSockets are refused. After the page loads, every response's server address is checked again, and a render that reached a private address fails with `RenderBlockedError`: this catches a DNS answer that changed between the check and Chromium's own lookup. The reader treats a failed render as an unreadable page.
- The browser restarts after `recycleAfter` renders, once no render is running.
- `renderer-from-env.ts`: `rendererFromEnv()` returns one shared renderer, or `null` unless `COURSE_BUILDER_RENDERER_ENABLED=true`; `closeRenderer()` for shutdown. It sends the same identity as the fetcher (`ClassroomIO-CourseBuilder/0.1`), so sites see one crawler and one robots group.
- `apps/jobs/src/config/env.ts`: `COURSE_BUILDER_RENDERER_ENABLED`, `COURSE_BUILDER_RENDERER_CDP_URL`, `COURSE_BUILDER_RENDERER_CONCURRENCY` (default 3), `COURSE_BUILDER_RENDERER_RECYCLE_AFTER` (default 200).
- `docker/Dockerfile.jobs`: build arg `INSTALL_CHROMIUM=true` installs the headless shell and its system libraries. Off by default; not needed with a hosted browser.
- `apps/jobs/package.json`: `@cio/course-builder` (workspace) and `playwright-core` 1.57.0.

Tests (`renderer.test.ts`, 6, against a local server, real Chromium): a script shell renders and its JSON is captured; a page's request to `127.0.0.1` never reaches the server, nor does its image; rendering survives a browser restart; a response from a private address after the host check passed fails the render; the default policy refuses a private host without sending anything; `readSource` with the real renderer reads a page whose text only exists after its script runs. Jobs app: type check clean, 21 tests pass.

Not done in item 4:
- **Wiring into a worker.** No course-builder job exists yet (item 12); that job passes `rendererFromEnv()` to `readSource` and calls `closeRenderer()` on shutdown.
- **Production rollout:** build the image with `INSTALL_CHROMIUM=true` (or set a hosted browser endpoint), size memory at about 1 GB per browser, then turn the flag on. The shell share is measured and rendering checked (§4.9).

### 4.4 Corpus and gate (item 6): state

Code in `src/corpus/` (`types.ts`, `blocks.ts`, `exclude.ts`, `corpus.ts`) and `src/gate/gate.ts`: blocks with stable ids, exclusion per page with its reason, the replacement ("new" version) rule, duplicates, and the usefulness gate. Built by another agent; reviewed and fixed:

- **Exclusions removed product pages.** The plan's own proposed rules matched single words, so "Scheduling jobs", "Payment terms", "Comments on a work order", "Privacy settings", "Test your connection", "Draft invoices" and any `/jobs/` URL were excluded: core pages for field-service, property and maintenance products. Rules now match exact phrases and whole URL segments (impl §3).
- **Blocks lost content.** Screenshots inside numbered steps (the most common help-centre pattern), images in lists, tables and callouts, loose text next to links or bold text, `<aside>` callouts, HTML inside Markdown, nested sub-steps and linked images were all dropped; paragraphs inside one step ran together. All kept now, with tests.
- **An `en-US` page was excluded from an `en` corpus** as another language. Compared by base language now.
- **"New" was treated as a version marker anywhere,** so "Create a new job" and "Create a job" were collapsed and one excluded. Only written markers count now.
- Headings carried the wrong parent path. Fixed.

Tests: `corpus.test.ts`, `blocks.test.ts`, `gate.test.ts`.

### 4.5 Learning package and export (item 11): state

`src/package/schema.ts` (the versioned learning package) and `packages/core/src/services/course-builder/export.ts` (`toCourseImportDraft`, tested in `apps/api/src/__tests__/course-builder-export.test.ts`, which also checks every exported question against the product's own save rules). Built by another agent; reviewed and fixed:

- **English was written into every course.** "Source:", "Note:", "Tip:", "Check: …", "… final quiz", "You'll be able to:" went into stored course content whatever the course language. The package now carries `labels` in its own language (impl §11) and the export uses them.
- **A section check shows after the section's first lesson,** because the import numbers a section's exercises separately from its lessons while the outline sorts them together. The importer rejects any other number, so the export stage must reorder after publishing (impl §11). Recorded for item 12.
- Callouts produced paragraphs nested inside a paragraph. Fixed.
- The API type check failed: the test imported `@cio/course-builder`, which the API does not depend on. It now imports the labels through the core exporter.
- A temporary test file (`apps/api/src/__tests__/tmp-export-live.test.ts`) was staged in git although deleted; removed from the index.
- Kept as the agent built them, all deliberate: matching questions are dropped with a `matching-question-dropped` warning, because MATCHING is disabled in the question-type registry and importing one fails the whole publish (turning it into a checkbox question would ship a broken question); the practice task becomes its own top-level exercise after the final quiz; a package in a locale ClassroomIO does not offer imports as English with a `locale-not-supported` warning.
- §4.4 and §4.5 were rewritten from the code after an earlier edit of §4.1 removed the agent's original text; nothing in them was lost.

**End-to-end import** (item 11): `node eval/check-gold.mjs --step=package` turned the checked gold course into a valid learning package (report included: excluded pages, gaps, removed items, gate, cost $3.10 for cards, the 4-course plan and this course), and `apps/api/scripts/import-learning-package.ts` imported it into the seeded local organisation "Udemy Test" through the same services the onboarding starter uses.
- **Imported:** 8 sections, 31 lessons, 10 exercises (8 section checks, the 13-question final quiz, the practice tasks), no export warnings. Each section check was then moved after its section's lessons with `reorderCourseContent`, the step item 12 needs, and shows there in the outline.
- **Renders** in the dashboard: headings, lists, bold names, note/tip/warning callouts and the source link in every lesson; screenshots load; checks show single, multiple, ordering and true/false questions with their keys, auto-graded; the learner preview of the final quiz shows 13 questions, 13 points.
- **Screenshots are hot-linked** to the source site, because the evaluation stores no copies. In production the read job's `captureImage` stores them (item 12).
- **Found and fixed:** 14 of the 31 lessons began with a heading repeating the lesson title, so the title showed twice. The writer now drops such a heading in code (blanked, so citations keep their positions) and is told not to write one; the course imported here was written before the fix.
- **Seen, not caused by the import:** opening the course URL directly on a cold, signed-out tab gave a 500 and, after sign-in, stayed on "Loading course…"; opening it from the course list works. The dashboard notes describe intermittent cold-load errors in development; not investigated further.

### 4.6 Checking, repair and review (item 10): state

Not started by the other agent; built here in `src/verify/` (impl §9): claim checks, answer-key checks (3 blind solves in parallel, wrong-option audit, ordering in code), code checks, the repair loop and the course review with fixes applied in code. Then, for the measurement: sentence-level claims, `checkCourse`, `repairCourse` (`src/write/repair-course.ts`), `rewriteQuestion`, review fixes `drop-question` and merges in code, `corpusBlockLookup`, and the independent judge `src/eval/groundedness.ts`. Tests with fake models (verify and `write/repair.test.ts`), so they spend nothing.

**Gold measurement** (`eval/check-gold.mjs`, in steps that each save to `eval-data/energis/check/`, git-ignored; checked course in `eval-data/energis/checked-course.html`; the first run kept in `check/v1/`). The judge is Opus 5.5 at medium effort, measurement only: it sees each lesson's own source ranges plus any section page the lesson cites, and calls every sentence supported, supported elsewhere (a citation mistake), unsupported or unknown. The pipeline uses its own roles (Haiku checker, Sonnet repair, Opus review).

| | First run | After the fixes |
|---|---|---|
| Written course, grounded (corrected judge) | 99.4% (7 of 1,113 unsupported); citations right 98.4% | same course |
| After checks, repair and review, grounded | 99.7% | **99.7%** (3 unsupported); citations right **99.4%** |
| Checker false alarms / real problems caught (of 7) | 20 / 4 | **3** / 1 to 4 (varies between runs) |
| Items rewritten | 19 (whole lessons) | 10 (flagged paragraphs and questions) |
| Citations corrected in code | — | 12 |
| Removed | 1 grounded lesson, paragraphs of another | **nothing** |
| Pipeline cost (check + repair + review) | $0.95, 227 s | **$0.34, 106 s** |

- **Target met** (≥ 98%), already before repair. The 3 left: "the list of keywords is not covered in the documentation" (now becomes a reported gap, see below), a qualifier the source does not have ("certain administrators"), and a pointer to a later lesson.
- **What the first run got wrong, and the fixes:**
  - The checker saw only the cited blocks, so a sentence stated by the next block of the same page looked invented: 9 of 16 rewritten lessons had nothing ungrounded, and repair deleted the grounded lesson "Ways to push data" after two rewrites kept the same wrong citation. The checker now reads the section's sources (what the writer saw), returns "supported elsewhere" with the blocks that state the sentence, and the citation is corrected in code.
  - Repair rewrote whole lessons. It now rewrites only the flagged paragraphs (`rewritePassages`, one cited request per lesson), and a lesson goes only when no text is left.
  - Sentences about the lesson itself ("In this lesson you…") were flagged. The checker now treats them as supported, and any "not covered in the documentation" sentence becomes a reported gap instead of course text.
  - The judge itself was wrong on 11 of its first 19 "unsupported" verdicts: those sentences cite a page of a sibling lesson in the same section, which the writer saw but the judge was not given. Corrected; the first run's 98.3% was really 99.4%.
- **The checker's catch rate is low on subtle problems.** Of the 7 sentences the judge finds unsupported (overstatements and qualifiers), the Haiku checker catches 1 to 4, varying between runs. At 99.4% grounded before repair that is acceptable; a stronger checker model would cost about 20 times more for 0.3 points. Its value is the citation corrections, wrong keys (2 to 4 per run) and wrong options (2 to 3), which repair fixes.
- **Review:** drops the questions that ask the same fact as another (4 this run, all from the final quiz or a check); no fix rejected; the package is valid.
- **Interface names:** 26 bold names neither in the glossary nor in the cited text, reported only; mostly the writer's own lead-ins.
- **Judge validated against the product owner's labels.** A separate agent labelled, for the product owner and adopted by them, both sheets blind to the judge (`check/labels.csv`, 47 sentences: 40 at random from the checked course, 7 the judge flagged before repair; `check/v1/labels.csv`, 50 from the first run: 40 random, 10 flagged), checking borderline sentences against the full pages. Their originals are backed up outside the repository. Scores from `--step=score-labels` (`labels-score.json` beside each sheet):

  | Sheet | Labels | Judge agrees | Checker agrees |
  |---|---|---|---|
  | current, 47 | 42 supported, 1 elsewhere, 4 unsupported | 42 (89.4%) | 5 of 7 |
  | v1, 50 | 48 supported, 2 unsupported | 42 (84.0%) | 8 of 10 |

  Random sentences grounded by these labels: 39 of 40 (current, the one exception is c13 below) and 40 of 40 (v1). Every disagreement, checked against the judge's actual input:
  - **The first judge lacked sibling pages (7 of v1's 8: c15, c19, c21, c22, c27, c39, c49).** Each cites, or is stated on, a page of another lesson in the same section, which the first judge was not given. c15 and c22 too: the labeller read them as judge misses with the evidence present, but rebuilding that input shows the working-day/working-hour rule and the "Customer-specific attributes" block were not in it. Fixed before this labelling: the judge reads the section's sources.
  - **Sentences about the course itself (current c24, c30):** "the list of keywords is not covered in the documentation" and "a later lesson covers this". The labels call them supported, as the checker does; the judge rubric now says so too.
  - **Readings (current c3 = v1 c6, current c18):** whether "sometimes restricted administrators" carries "certain administrators", and whether a link "leads to all the changes" supports "use it to recover". The judge is stricter than the labels.
  - **The sheet showed sentences without context (current c13).** "The default option is a file in Energis.Cloud-PM-Format." is labelled unsupported as a default claimed for every transport; in the lesson it directly follows "HTTPS: messages are sent to a dedicated URL.", which the Data ingestion page states (the labeller's own note found PM-Format only for HTTPS). The label is kept; it is the only judge pass the labels contradict. New sheets carry a `sentence_before` column.
- **Scoring bug fixed** (found by the labeller): `--labels=v1/labels.csv` read the key from `check/` instead of beside the sheet, so it scored one sheet against the other's key. The key is now read beside the sheet, carries each claim's text, and a sheet that does not match its key is refused.
- Claude's own blind labels of the current sheet (`check/labels-claude.csv`, same model as the judge) agreed with the judge on 43 of 46; kept for reference only.
- **Not rerun:** the judge with section sources and the course-itself rule. Re-judging the 11 lessons behind these disagreements would confirm the fixes (about $1.25).
- **Spent:** $6.37 in all: first run $3.58; checker reruns $0.37; judge $2.21 (one full re-judge, $1.66, was a script mistake: the written-course step did not reuse saved verdicts; it does now); repair $0.21.

### 4.10 Page cards and glossary (item 7): state

Code in `src/understand/`: `page-card.ts` (`pageCard`, `pageCards`, `splitPage`, `checkedCard`) and `glossary.ts` (`buildGlossary`, `addAliases`); impl §5 records how it differs from the proposal. 7 tests with a fake model. `eval/card-sites.mjs` runs cards on a corpus saved by `read-sites.mjs --keep-corpus` and logs progress every 30 s.

**First measurement** (Haiku 5.5 at effort `high`, 4,000 output tokens per card), on corpora rebuilt from the cache:

| Source | Pages | Cards | Failed | Time | Cost | Per 110 pages | Output tokens per card |
|---|---|---|---|---|---|---|---|
| Raken help | 245 | 229 | 16 | 233 s | $0.40 | $0.19 | 3,005 |
| Measurabl support | 206 | 204 | 2 | 169 s | $0.29 | $0.16 | 2,586 |

- **Quality:** facts cite the right blocks, names are copied exactly (4 of 2,018 names dropped as not on the page, no facts or procedures dropped), and freshness clues are specific ("Adding meters in Navigate is described as coming soon"). Types are plausible (Measurabl: 116 how-to, 34 overview, 18 reference, 16 concept, 11 FAQ, 8 troubleshooting).
- **Cost three times the plan's $0.05 per 110 pages.** A finished card is about 730 tokens; the rest of the 2,600–3,000 output tokens is thinking at effort `high`.
- **Every failure was the answer cut off:** thinking used up the 4,000-token limit, the JSON ended mid-string, and the retry did the same.
- **Changed:** the `card` role runs at effort `low`, and cards may use 8,000 output tokens.
- **Re-measured** on the first 60 Measurabl pages: 60 cards, no failures, 18 s, $0.043, **$0.078 per 110 pages** (target: under $0.10), about 1,000 output tokens per card. Against the effort-`high` cards for the same pages: same type on 50 of 59, same procedures (73 vs 72), names 625 vs 604, key facts 411 vs 502.
- **Obsolete flag tightened.** At effort `low` the model flagged pages for screenshot file dates and "coming soon" (9 of 60). The instructions now say only the page's own statement that something is deprecated, replaced, retired or old counts: 1 of 60 flagged ("Meters no longer have their own row in the side navigation"). The flag is a hint for the planner, not an exclusion.
- Total spent on these measurements: about $0.77.
- **Glossary is noisy at the top:** generic buttons ("Save", "Edit") and the organisation's own name lead it by page count (Measurabl: 1,021 entries). Fine for checking UI names in item 10; the planner (item 8) should get entries filtered by kind, or the top entries without generic buttons.
- **Aliases are not measured:** they need product-site pages, which the host supplies (item 12).
- The item 7 target names the gold corpus, which does not exist until item 5; these two sources stand in for it.

### 4.11 Curriculum and briefs (item 8): state

Code in `src/plan/`: `course-list.ts` (`planCourseList`, `checkCourseList`, `PageRefs`), `sections.ts` (`planCourses`, `checkCoursePlan`, `sharedProcedures`, `courseGlossary`) and `briefs.ts` (`sectionBriefs`); impl §6 records how it differs from the proposal. 7 tests with a fake model.

**Gold measurement** (`eval/plan-gold.mjs`, on the gold organisation's snapshot, no network): corpus of 140 pages, 123 teachable; cards, glossary, a 4-course list, 4 section plans in parallel, then `judgeCoverage` against the gold course. Onboarding answers assumed: first outcome "onboard customers", builder's role "customer education", 51–200 people, customers learn from help docs.
- **Gold coverage 90.6%** (target ≥ 90%): 13 of 16 gold sections covered, 3 partly, none missing. Partly: finding your way around the specialist portal (only pointers), building a report template and adding free text to a report, setting up the occupant portal as an administrator.
- **Courses** (role-based, as the source is organised): Administrator (8 sections, 31 lessons), Energy Manager (7, 27), Operator (7, 23), Occupant (6, 19); 28 section briefs. No rule problems left after the retries (8 planner requests: 1 list, 4 plans, 3 re-plans).
- **Page coverage:** 91 pages used, 32 excluded with reasons, 0 lost. 24 of the excluded were release pages ("Release 7.3" under "Release Content") that the corpus had missed; the corpus now recognises a title ending in a release or version number and a releases section (one more page caught on all development sites, also a release page). The others: FAQ and how-to index pages, a migration note for an old release, two FAQs outside the four areas.
- **Cost and time:** 137 s; $1.08 in all: cards $0.096 (item 7's gold-corpus target met), planner $0.98, judge $0.003.
- **Not measured:** other onboarding answers (the course choice should follow them), and whether the 3 partial gold sections are gaps in the documentation or in the plan. One run only: Opus plans vary between runs, so rerun a few times before tuning anything on this margin.

### 4.12 Writing, quizzes and media (item 9): state

Code in `src/write/` (`section-writer.ts`, `quizzes.ts`, `course-writer.ts`) and `src/media/` (`lesson-media.ts`, `youtube.ts`); impl §7–8 record how it differs from the proposal. 14 tests with fake models and fetchers. `ClaudeRequest` gained `onFirstToken`.

**Gold course written end to end** (`eval/write-gold.mjs`, the gold plan's Administrator course, from the saved plan and cards; preview in `eval-data/energis/written-course.html`, git-ignored):
- **Complete and valid:** 8 of 8 sections, 31 of 31 lessons, `ZPackageCourse` valid, no issues left. 327 of 329 text blocks cite source blocks (424 distinct source blocks cited); the 2 others are callouts, which the package allows without citations. 19 uncited paragraphs were joined to cited neighbours for the checker. 31 screenshots placed next to their steps; no embedded videos in the cited ranges.
- **Questions:** 39 section-check questions (4–5 per section), a 16-question final quiz, 2 practice tasks; 33 single, 13 multiple, 6 ordering, 3 true/false; 1 dropped by the code checks. Ordering questions copy the numbered steps exactly; practice tasks ask the learner to do a real procedure in their own account.
- **Gaps:** 3, reported, not written as lessons (for example the step-by-step for filling in a user account is not in the documentation).
- **First run lost a section:** "Designing metrics" (6 lessons from about 17,000 tokens of sources) ran past the 16,000-token output limit twice and was left out. The writer's limit is now 32,000 tokens, and a section that fails reports why (it was swallowed). `--section=<title part>` rewrote just that section and merged it.
- **Cost and time:** $1.37 for the whole course in 177 s (18 requests: sections, checks, final quiz, one retry), plus $0.32 and 101 s for the rewritten section: **$1.68** for the complete course. Only 21k tokens were read from the cache: each section's own sources dominate its prompt, so the shared prefix saves little.
- **Seen in review, for item 10:** a fact asked both in a section check and in the final quiz; a multiple-answer question whose wording does not say several answers are correct. The reviewer should catch both.
- **Not measured:** embedded videos and channel videos (no videos in the cited ranges; no channel in this run), and labels in another language.

### 4.13 Host integration (item 12): state

**Built and tested** (no paid run yet):
- **Publisher in `@cio/core`.** `course-import.ts` and the tag service moved to `packages/core/src/services/{course-import,tag}/`; the API files re-export them, so routes, the public API and onboarding are unchanged (the lesson and exercise services were already in core). API type check passes; the 99 tests that touch these services pass.
- **Build stages in the package** (`src/build/stages.ts`): `readStage`, `prepareCorpus` (corpus and gate, no model call), `understandStage`, `planStage`, `writeStage`, `finishStage`, `buildReport`, `coursePackage`, `storedImages`. Each takes and returns plain JSON, so a host can store every result between jobs. `check-gold.mjs` now uses the package's `reviewCoverage` and `checkerReport` instead of its own copies.
- **Budget:** `ClaudeClient` takes `budget: { limitUsd, spentUsd }` and throws `BudgetExceededError` instead of sending a request once the build has spent it (requests already running finish). Before this the $15 cap (plan §16) was not enforced anywhere.
- **Tables** in the branch's single migration (`0052_onboarding_v2.sql`): `course_build_job`, `course_build_source`, `course_build_page`, `course_build_course`, and `onboarding_starter_job.course_build_job_id`. Queries in `packages/db/src/queries/course-build/`.
- **Worker** `apps/jobs/src/workers/course-build.ts` (also in the all-in-one entry; `dev:course-build`): one BullMQ queue per stage (`course-build-discover`, `-read`, `-understand`, `-plan`, `-write`, `-finish`, `-export`), concurrency per queue from `COURSE_BUILD_CONCURRENCY`, one shared polite fetcher per process, the renderer when its flag is on. A stage that fails for good fails only what it worked on: a read fails its source and the build goes on; a write, finish or export fails its course; discover, understand or plan fails the build. A spent budget is not retried.
- **Orchestration** `packages/core/src/services/course-builder/build.ts`: `startCourseBuild` and one function per stage. Every stage first checks the build is still running, so a canceled build stops at its next stage. The understand stage ends the build as `NOTHING_TO_BUILD` when the gate stops it, before any paid call. Each course is exported as soon as it is finished (`publishPackageCourse`: draft with an idempotency key, course created unpublished, filled, checks moved after lessons; a retried export fills the course it already created). Spend is recorded per stage on the job and in `ai_token_usage` with `counts_toward_balance = false`. Tested with an in-memory store (`apps/api/src/__tests__/course-build.test.ts`, 6 tests).

**Built differently from impl §12, on purpose:**
- **Writing is one job per course, not per section.** `writeCourse` sends the first section alone so the course-wide prompt prefix is cached, then the rest in parallel; one job per section would lose that. Progress per section is kept as `sections_written` of `sections_total` on `course_build_course` (for "Writing section 5 of 12"), so there is no `course_build_section` table.
- **The corpus is not stored.** `buildCorpus` is deterministic, so each stage rebuilds it from the stored pages in a fraction of a second; only the page cards (paid) are stored per page.
- **Check, repair and review are one stage** (`finish`), as in the gold run.

**Found while measuring the free stages on Raken** (`eval/build-site.mjs --site=rakenapp.com`, development split):
- **Reading order across sources was interleaved.** Each source numbers its pages from 0 and the corpus sorts by that number, so a second source's pages mixed into the first and duplicate detection could keep either copy. `prepareCorpus` now offsets each source's order (tested).
- **The product site's page budget went to blog posts:** 24 of its 25 pages were `/blog/` articles, which the corpus then excludes, so the planner and aliases saw only the homepage. The product site is now read without the paths the corpus never teaches (`EXCLUDED_PATH_SEGMENTS`, the same list the corpus uses): 25 product pages (features, integrations, who-we-serve).
- **Result:** discovery found the product site and the help centre (no false sources) in 252 s; the help centre gave 230 teachable pages against 233 in the ground truth (70 duplicates removed), 183,755 words; the gate passes. Reading took 6 minutes for 88 pages uncached (about 4 s a page under the politeness rules), so a full read of this site takes about 16 minutes in production; the measurement used the evaluation's HTTP cache.

**Open:**
- **Onboarding and dashboard wiring** (plan §10): nothing starts a build yet; the starter job still runs for website answers. Needs a decision on the starter slots (rename, remove, restore before completion) for website builds.
- **Image copies** (`captureImage`): not wired; images still hot-link, as in item 11.
- **Discovery speed:** 252 s on Raken, mostly waiting; not yet investigated.
- **Local database:** the new tables are in `0052`, which this machine's database may already have applied; apply the new statements by hand before running the worker locally. (The local database also lacks migration 0050's `client_name`, which is why 5 database-backed API test files fail locally; unrelated.)
- **Paid run:** estimated from the gold run at $0.18 for cards, about $1 for the plan, and about $2.10 per course (write and finish): about $3.30 for one Raken course, about $7.50 for three.

### 4.7 Fetching and reading: speed and loss fixes

Learned from the faster ground-truth collection (plan §8):
- `src/fetch/polite-fetcher.ts` retries network failures and timeouts with backoff (it only retried 429 and 503), so a passing glitch no longer loses a page. A robots.txt that cannot be reached now means "disallow", as RFC 9309 says; it used to mean "allow everything".
- `src/fetch/node-fetcher.ts` (`createGuardedLookup`) retries transient DNS failures and remembers a host's addresses for 60 s. The private-address check still runs on every answer, cached or not.
- `src/read/read-source.ts` no longer waits for image copies between pages; it waits for them once before returning.
- A page that meets a bot challenge gets one more try after the pages already waiting, and is recorded blocked only if it fails again (`Inventory.retry`). Verification showed why: on every challenge-protected help centre in the customer sample, 19 of 20 sampled pages passed and 1 was challenged, so these challenges come and go rather than block a whole site.

Found by the live measurement on the customer sample's development sites (item 3), all fixed with tests (144 pass):
- **Memory.** The reader kept every page's raw HTML (about 150 KB each) until the end, so a run of large sources reached 4 GB and stalled or crashed. It now drops the HTML once links, structure and media are taken from it.
- **Repeat downloads.** A small per-source cache of recent successful answers stops a page found during discovery being downloaded again. Challenged and failed answers are never cached, so a retry is a real retry.
- **Markdown order.** The Markdown form that worked (advertised link, the page itself, or a `.md` sibling) is tried first on later pages, the others still as fallback: one request less per page on Markdown sites.
- **Real articles rejected as empty.** Boilerplate removal deleted every `<header>`, including an article's own header with its title; a site-marked `article` full of links scored below the bar because links count against the score (that penalty is for menus); the outer `main` won over the inner `article` that holds the `h1`. Now: headers inside `main`/`article` are kept, the innermost marked container holding the `h1` wins and needs only enough text, and a page without `h1` takes the first heading of its marked content as its title (Material UI pages use `h4`). HTML entities in titles are fully decoded. Recovered every real article that failed on Ideagen, MRPeasy and Fishbowl.
- **Small collections were failures, not groups.** A page with no content of its own that lists at least one in-scope page (not one of its own ancestors) is an index; pages with content keep the strict rule (3 links, half the text). Small help centres have collections of one or two articles.
- **Login redirect loops** (an article that keeps redirecting to `/login`) are recorded as restricted, not failed.
- **Redirectors.** URLs of one shape (same path differing only by query string, or a numeric last segment such as `/articles/123`) that redirect to pages already read are skipped after 5 such answers; one real page of that shape turns the rule off. Zendesk's related-article click trackers and short article links made Fiix take more than 7 minutes; it now takes 22 s.
- **Other-language URLs.** Once a source's own pages name their language in the same path segment (5 pages whose URL and content agree), queued URLs naming another real language code there are recorded as other-language without being fetched. Housecall Pro fetched every Spanish article before.
- **Sign-in links** of every spelling (`login`, `log_in`, `signin`, `sign_in`, `sign-up`, `sso`, `auth`) are never queued.
- **Time budget.** `readSource` takes `deadlineAt`: no page is started after it, and the source returns what it read, noted "stopped at the time limit".
- **Robots.txt patience.** A robots.txt that keeps failing is asked again after 10, 20 and 30 s before the host counts as disallowed (RFC 9309). Under load, short failures had cost three whole sources.
- **One broken page no longer fails a source.** An unexpected error (for example a page nested so deep that HTML parsing runs out of stack, as on one scale-sample site) fails only that page; a page whose links or structure cannot be parsed is kept and noted. Text measurement no longer recurses.

Found by finishing the measurement (§4.9), all with tests (150 pass):
- **Generated API references.** Every operation's URL serves the whole API, with the API's own `h1` and a `main` holding only the licence. The section whose `id` is the URL's last path segments and whose heading is the page's `<title>` is now the page's content and title.
- **Empty pages.** A page with almost no text outside its chrome is `empty`, not `failed`, unless it is an unrendered script shell. `failed` now always means content was there and could not be read.
- **Blocks took only an inner `article`.** The corpus searched again for `main`/`article` inside the content the reader chose, so an API operation kept its one-line description and lost its parameters (4 words instead of 150). It now keeps all of it.
- **Several `h1` on a page.** Salesforce knowledge articles give each section an `h1`; the title is the heading that repeats `<title>`.
- **Replacement by version.** The version or year a title names decides before update dates (§4.9, Fiix).
- **Eval:** `--offline` replays only the disk cache and sends no request; each `--batch` writes its own summary file, so parallel runs no longer overwrite each other.

`eval/read-sites.mjs` was rebuilt so a run takes minutes, logs progress and loses nothing: sources spread over worker processes (one host never split, so still one request at a time per host), responses cached on disk (`eval-data/http-cache`) so reruns after a reader change need no network, each source's ground-truth pages warmed over 3 extra connections only when robots.txt sets no crawl delay, sources over the page cap read to 300 pages (they cannot meet the completeness target anyway), a cache hit yields to the event loop so a replaying source cannot starve the others, progress every 30 s with time left per source, results written per source as they finish, a hard 7-minute deadline, and misses grouped by what the reader recorded (`missedByStatus`). On this machine, memory is the limit: with about 27 GB of swap already used by other apps, more than 5 workers per run made it slower.

### 4.9 Live measurement: customer sample, development split

All 34 sources with pages measured, in runs of at most 7 minutes; the last pass replayed every source from the disk cache (`--offline`, no requests), so the sites that had refused the crawler were not contacted again. Merged into `eval-data/read-sites-icp-development.merged.json` (git-ignored). 11,345 pages read.

**Reading (item 3).** Of 29 sources under the page cap, 12 read ≥ 98% of their target and 15 account for ≥ 98% of it (read, or seen to hold no article: a group of other pages, or an empty page). Every shortfall was examined, and none is content the reader can see but loses:
- **Script shells, need the renderer:** Buildium's help centre (837 pages), Samsara Academy (202), Power Factors (13 of 34), and Ideagen's 8 help centres, whose section pages show their article list only after a script runs (81–92% accounted, every article read). They stay `failed` until the renderer is on, on purpose: calling them empty would hide that they need it.
- **Behind a login or a bot challenge:** UpKeep's Teachable lectures; project44's support centre.
- **Stopped by the time limit:** Samsara's developer docs (963 of 1,205) and Housecall Pro (638 of 673, 1 s crawl delay).
- **Not losses:** Arcadia's 20 pages whose canonical is another page read, 5 dead and 10 that no page or sitemap links to; Fishbowl Online's 2-page target redirects to another site.
- **Fixed in this pass:** project44's generated API reference went from 229 to 417 pages read (46% to 99% accounted). Every operation's URL serves the whole API; the reader now takes the section the URL names (impl §2.3). Pages with nothing to read are recorded `empty` instead of `failed` (Power Factors 65% to 85% accounted).

**Script shells (item 4).** About 2,000 shell pages, all on the sources above. With the renderer: Samsara Academy read 50 shell pages, and Buildium's help centre 44 of 47 (2 became groups, 1 topic page failed), each at about 8 s a page; before the multi-`h1` title rule its articles took a section heading as their title. A render needs the machine to itself: run alongside a CPU-heavy pass, pages timed out and only 4 of 14 read. The renderer is needed for real customers; see §4.8 for rollout.

**Exclusions (item 6).** 639 release notes, 719 duplicates, 163 obsolete, 149 too short, 4 legal or company, 2 other language, 0 community. The replacement rule was checked on real versioned pages and fixed: Fiix keeps v5 and v6 articles and edits v5 later, so update dates alone kept v5 and dropped v6. The version or year in a title now decides first: Fiix keeps v6, Motive's API keeps v2 over v1, "Driver App v110" over v109. One earlier false positive (a title word that is not a marker) was fixed before. Too short is mostly API operations with only a title, and category stubs. Person-made labels are still open (§4.8).

**Gate (item 6).** Passes all 18 sites with a readable public help centre, Power Factors (15 pages) included. Stops Assent, Cority, MasterControl, Sweep (login only), Uplight (1 page), FieldEdge (1 page, 47 words) and AppFolio (2 public pages; its main help needs a login): correct. Stops Buildium only while the renderer is off. No threshold change needed.

**Scale sample, development split** (46 sources, one 7-minute run, no tuning). No errors and every source returned in time; sources over the cap stopped at 300 pages, others at the time limit with what they had read. The large failures are all script shells: Avalara's knowledge centre (444), BambooHR's help (344), ServiceNow's docs (558), GitLab University (329), Airtable's developer docs (139 shells), HubSpot Academy (79). Robots.txt-excluded sources were recorded as such (Cloudflare developers, Databricks KB, Avalara developers, Shopify help, Airtable support). Summary in `eval-data/read-sites-scale-development-scale.json`.

**Politeness lesson.** Warming the cache over 3 extra connections per host, plus repeated reruns, made Ideagen EHS, project44 and Samsara's developer docs refuse the crawler for a while (403 or refused connections). Warming is now off by default; rerun from the cache with `--offline` after a reader change.

### 4.8 Waiting on ground truth or later items: do not skip

Each line is work that could not be done yet because it needs data or code that does not exist yet. Pick it up when its input is ready.

**Needs a person** (the code and the measurement are ready; only the labels are missing):
- **Item 3:** tree accuracy ≥ 95% needs a person-labelled tree for a few development sources. None exists yet; label them, then measure against the reader's outline in `eval-data/<site>/read.json`.
- **Item 6:** label which pages of each development source should be excluded (release notes, legal, obsolete, community, placeholders), then compare `buildCorpus` on the read pages with the labels. `corpusPages` in `eval-data/<site>/read.json` lists every read page with its title, word count and the reason the corpus gave, as the starting sheet. Then tune `MIN_PAGE_WORDS` (40) against the labels only if they show it wrong; the gate needs no tuning (§4.9).

**Before turning the renderer on in production** (item 4): build the jobs image with `INSTALL_CHROMIUM=true` or set a hosted browser endpoint, then set `COURSE_BUILDER_RENDERER_ENABLED=true`. The measurement says it is needed (§4.9). A full render of a large shell source takes longer than the 7-minute eval limit at one page at a time (about 8 s a page); in production a build may take that long, or the renderer's page concurrency can be raised for sites without a crawl delay.

**Measured and left as they are, on purpose** (§4.9): Ideagen's section pages whose article list loads by script stay `failed` until the renderer is on; sources over the page cap, stopped by the time limit, behind a login or a bot challenge are reported as such, not counted as losses. Threshold tuning (`MIN_MENU_LINKS`, link shares, `SHELL_TEXT_CHARS`, relevance sample, locale decision) was not needed: no shortfall traced back to one of them.

**Scale sample** (item 3): see §4.9 for the run on its development split (large and unusual sites, page-limit behaviour). Never tune on its held-out split.

**When items 7–9 exist** (cards, curriculum, writing):
- **Item 10:** optional: re-judge the 11 lessons behind the label disagreements to confirm the judge fixes (about $1.25), and decide c13 of `check/labels.csv` (§4.6).
- **Item 10:** measure on development sites too, once a development site has a written course.
- **Item 10:** done: the glossary from the page cards goes into the code checks (a name also passes when the cited text uses it), and merges are applied in code (§4.6).
- **Item 9:** done: `packageLabels` fills the labels in the course language, the quiz schema has no matching type, and single choice has 3 options (a 4th only for another real mistake) (§4.12).

**Item 12** (host integration), what is left (§4.13):
- Onboarding: start a build from the Business step, show sources and the course list on the preparing screen, replace the fixed starter slots for website builds (plan §10).
- Courses page: a "Building your courses" card per course; the notification and email when a course is ready.
- Image copies: `captureImage` in the read job (object storage), so screenshots no longer hot-link.
- Discovery took 252 s on Raken; find where it waits before onboarding depends on it.
- The paid end-to-end run on a fresh account.

### 4.1 Where item 1 stands

Two samples (plan §13). Every script in `eval/` defaults to the customer sample; pass `--sites=sites-scale.json` for the other.

| File | Sample | Role |
|---|---|---|
| `eval/sites-icp.json` | 40 process-heavy vertical B2B organisations (energy, facilities and maintenance, field service, EHS and quality, construction, fleet and logistics, manufacturing, property), 25 development / 15 held out | **Primary.** Plan §13 targets are measured here |
| `eval/sites-scale.json` | The earlier 40 large SaaS organisations (formerly `eval/sites.json`) | Scale and robustness: very large and unusual sites |

**Scale sample: verified** (`verify-truth.mjs --write`, both splits, 301 s). Every source now has `verification.readTarget`. Sources whose target is 0 for a real reason: `help.sap.com`, `developers.sap.com` and `learning.sap.com` (robots.txt blocks every crawler but named search engines), `support.airtable.com` and `learn.snowflake.com` (robots-excluded), `help.shopify.com` (bot challenge), `support.servicenow.com` (login). Sitemaps listing dead pages lower the target: `academy.hubspot.com` 1,109 of 1,848, `academy.asana.com` 182 of 331, `developer.avalara.com` 8,291 of 9,754.

**Scale sample: done.** Both splits re-collected with the current collector and audited:

```
development: 25 sites, 55 sources, 231003 pages, 9 null, 0 missing kept, 0 duplicate roots, 0 sources with foreign hosts
heldOut:     15 sites, 34 sources, 183795 pages, 3 null, 0 missing kept, 0 duplicate roots, 0 sources with foreign hosts
```

The three held-out `null` sources are the expected ones: `help.asana.com` (challenges or returns nothing), `help.rippling.com` (script shell; its sitemap lists 13 topic landings only) and `learn.procore.com` (script-shell course pages, no sitemap). `learning.sap.com` (99,336 pages) is the largest source in either sample.

**Customer sample: reviewed, re-collected and verified.** After the review below, all 40 sites were collected again in 144 s (unchanged sources reused) and verified in 245 s:

```
development: 25 sites, 57 sources, 23444 pages, 23 null, 0 missing kept, 0 duplicate roots, 0 sources with foreign hosts
heldOut:     15 sites, 32 sources, 10277 pages, 13 null, 0 missing kept, 0 duplicate roots, 0 sources with foreign hosts
```

Every source with pages now has `verification.readTarget`. Low targets, all real: `help.fishbowlonline.com/s` (its sitemap mostly lists pages that redirect out of the source; target 2 of 33), `academy.connecteam.com` (lessons are login-only; 23 of 154), `academy.kissflow.com` (bot challenge; 0). Collector fixes made during the re-collection: a reviewed source now replaces an automatically detected one with the same landing page (Samsara's help centre had been given the marketing site as its root); a reviewed source marked null is recorded even when its landing page cannot be opened; a page's language is also read from `language`, `lang`, `locale` or `hl` query parameters (EcoOnline lists every language under one path); a reused inventory has its language chosen again.

**First collection (before review)** (all 40 sites in 1,300 s with the parallel collector; one slow host, `connecteam.com`, took 1,023 s alone):

```
development: 25 sites, 56 sources, 20984 pages, 11 null, 0 missing kept, 0 duplicate roots, 0 sources with foreign hosts
heldOut:     15 sites, 39 sources,  5802 pages,  7 null, 0 missing kept, 0 duplicate roots, 0 sources with foreign hosts
```

**Reviewed.** Every site's sources were checked by hand against the live sites (four reviewers, ten sites each, the same written criteria) and recorded in `eval/truth-curation.json` with a one-sentence `evidence` entry per kept, added, dropped or nulled URL. What changed:
- Single marketing pages counted as sources were dropped: product pages, sales FAQs, ebook and "guides" hubs about the industry, event pages, and two whole marketing sitemaps (2,503 and 619 "pages").
- Real help centres the detector missed were added: Buildium (746 articles), Buildertrend (`/help-article/`, 173), Samsara and project44 (Zendesk behind a bot challenge, with public sitemaps), Ideagen (a main centre and 8 product centres), Simpro (869 articles), UpKeep (Intercom), EcoOnline (Salesforce), Assent, Jobber, Persefoni, and developer docs for several sites.
- Login-only and script-only sources are kept with no count and a reason. A source behind a bot challenge keeps a count when its sitemap is public (verification then marks its pages blocked); it is not nulled by hand.
- Sign-in URLs (`/login?redirect_uri=…`, `/sign_in?origin_path=…`) are never pages; the collector skips them everywhere (they inflated two sources by about 140 each).
- Watershed has no public product-learning source and FieldEdge only an empty "coming soon" academy: useful cases for the usefulness gate.
- Open questions the reviewers raised: Kissflow's help docs live in a category of its community site (kept, since its help host redirects there); Simpro's article links use `#!` fragments (check the collected count); whether help.project44.com (a ticket portal) and docs.persefoni.com (login) hold articles could not be seen.

Steps, in order:

1. **Done.** Collect every site in one run. After a review, add `--reuse-hours=6`: a source whose root is unchanged and was collected less than 6 hours ago keeps its inventory (filtered again with today's rules and marked `reusedFrom`), so only new or changed sources are fetched. Each host's robots.txt crawl delay is honoured (capped at 10 s); the collector used to ignore it. Sites run 8 at a time; requests to one host stay one at a time, 300 ms apart, so this is as polite as a sequential run. Each host is resolved once per run and transient resolver failures are retried, so parallel runs no longer lose sources to DNS errors. On 10 customer sites the parallel run took 262 s instead of 813 s and produced identical sources, page counts, page lists, rejected candidates and notes. The slowest single source (a link crawl of one host) now sets the wall time. `--write` is refused for held-out domains, so held-out counts never reach the sample file:
   ```bash
   node eval/collect-truth.mjs --write --concurrency=8 --only=<development domains, comma-separated>
   node eval/audit-truth.mjs
   node eval/collect-truth.mjs --concurrency=8 --only=<held-out domains, comma-separated>
   node eval/audit-truth.mjs held
   ```
2. **Done.** Review each site's sources by hand, as was done for the scale sample: real learning sources kept, marketing and community excluded, wrong-brand or customer-owned hosts removed. Record decisions in `eval/truth-curation.json`, then collect and audit again. Expect `0 missing kept` and `0 sources with foreign hosts`, except reviewed foreign-domain sources.
3. **Done.** Verify both samples and both splits, so each source carries `verification.readTarget` (robots-allowed pages × live share):
   ```bash
   node eval/verify-truth.mjs --write
   node eval/verify-truth.mjs held --write
   node eval/verify-truth.mjs --sites=sites-scale.json --write
   node eval/verify-truth.mjs held --sites=sites-scale.json --write
   ```
4. Then item 3's live measurement: `node eval/read-sites.mjs` (development only; never tune on held-out sites).

Known genuinely blocked or inventory-less sources in the scale sample (recorded `null` with a reason, do not retry-loop): Workday docs, Gusto help, Cloudflare support, Salesforce Help, Salesforce Developer, Airtable Academy, Freshworks developer docs, Freshworks university and BambooHR developers (development); Asana Help, Rippling Help and Procore Learn (held out).

If a host still returns `status-0` after the collector's DNS retries, `curl -sL` it once and re-run that one domain rather than editing ground truth.

`eval/audit-truth.mjs [dev|held] [--sites=…]` reports missing kept sources, duplicate roots, foreign-host pages and null counts.

## 5. Known risks and open points

- **Reaching a knowledge base behind a login landing:** the gold organisation's help center opens on a login page; its content is public under a path robots.txt allows. The universal reader is designed to try those paths and render script-only pages, but this is unproven. Item 5 measures it.
- **Sites that block automated readers on every page:** a neutral reader can't read them. The plan offers the organisation remedies (allow our user agent, or upload an export). How often this happens is measured on the sample.
- **Cost of trying representations:** probing Markdown and page data costs extra requests per page; the proposed code probes the first three pages and keeps only what worked.
- **Import source type: done** (impl §11). One list, `COURSE_IMPORT_SOURCE_TYPES` in `@cio/utils/constants/course-import`, now feeds both the database enum and `ZCourseImportDraftCreate`; citations use `COURSE_IMPORT_REFERENCE_TYPES` (no `sample`, which the public course-structure API no longer accepts). Type checks of db, core, api and jobs pass; 509 API unit tests pass.
- **Before item 11:** move the draft publisher and the API-only lesson, exercise and tag functions it calls into `@cio/core`, so the worker can create courses (impl §12).
- **Questions for the owner:** plan §16 (Anthropic tier, budget cap, copying screenshots, YouTube legal check, robots.txt, headless browser hosting, held sources in onboarding, private sources, language).
- **Other open items on this branch, outside the course builder:** unverified accounts can trigger AI generation; terms enforcement and the `changeEmail` concern; throwaway dev database accounts and test starter jobs on the local "admin11" account.

## 6. How to run things

```bash
export PATH="$HOME/.nvm/versions/node/v24.22.1/bin:$PATH"
cd packages/course-builder
npx vitest run
npx tsc --noEmit -p .
pnpm build
node eval/discover-sites.mjs example.com
node eval/collect-truth.mjs --write
node eval/audit-truth.mjs
```

After deleting `dist`, also delete `tsconfig.tsbuildinfo` (git-ignored), or `tsc` skips unchanged files and the build is incomplete.

## 7. Uncommitted files

- `packages/course-builder/` (new package; `dist`, `eval-data/` and `*.tsbuildinfo` are git-ignored)
- `prd/course-builder/` (plan, proposed code, handoff, research; the research files were moved here from `prd/onboarding-v2/`)
- `pnpm-lock.yaml` (the package's dependencies: `@anthropic-ai/sdk`, `zod`, `cheerio`, `robots-parser`, `tldts`)
- `packages/course-builder/src/corpus/`, `src/gate/`, `src/package/`, `src/verify/` (items 6, 10, 11), `packages/core/src/services/course-builder/export.ts` and its test in `apps/api`
- `apps/jobs/` (renderer, env flags, the two dependencies) and `docker/Dockerfile.jobs` (opt-in Chromium)
- `packages/utils/src/constants/course-import.ts` (new), `packages/utils/src/constants/index.ts`, `packages/utils/src/validation/course-import/course-import.ts`, `packages/db/src/schema.ts` (one shared list of import source types)
- `packages/core/src/services/onboarding/run-starter-job.ts` (an earlier fix: the detected product name is used before drafting)
