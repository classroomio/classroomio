# Docs as Content Layer — Strategy Review

Feedback on [`README.md`](./README.md), specifically on the claim that this makes ClassroomIO the most customisable customer-education platform. Build sequencing lives in [`implementation-plan.md`](./implementation-plan.md).

---

## The thesis is right

One content primitive that surfaces reference rather than copy is the correct spine for customer education. It is also the correct *first* thing to build, because every other surface we might want — catalog, blog, cohort materials, in-app help, an agent's knowledge base — otherwise needs its own content store, and we would spend the next year syncing them.

Phase 1 (reusable Doc lessons + usage) is the right wedge for a reason the PRD undersells: it is the only phase that needs no new product concepts. One nullable column on `lesson`, one body resolver, one derived usage query. Everything else in the PRD is a new surface; this is a new *capability* on surfaces that already exist.

---

## Where the framing is off

### 1. Reuse and customisability are different products. The PRD only builds reuse.

"Write once, use everywhere" makes authoring efficient. It does not make the platform customisable. Customisability is the number of distinct end-experiences a customer can compose **without us shipping code** — and today that number is bounded by three closed enumerations in the codebase:

| Closed enumeration | Where | Effect |
| --- | --- | --- |
| 10 landing themes, 6 singleton sections, fixed order | each theme's `org.svelte`, `LandingSectionKey` | a customer cannot add, duplicate, reorder, or remove a section |
| 4 course types | `COURSE_TYPE` | delivery models are ours to define, not theirs |
| 3 content types | `ContentType` (`SECTION`, `LESSON`, `EXERCISE`) | the shape of a course is fixed |

This PRD adds a fourth content type. That is additive. The structural move is to turn those enumerations into **registries** — and a shared content primitive is exactly the precondition for doing that, because a registry of block types is worthless if each block type needs its own content table.

So: keep the PRD, but state the goal as *composition*, not reuse. Reuse is the proof that composition is possible.

### 2. The differentiator is "same page, every channel" — and it is almost free.

We already ship, and competitors mostly do not: a versioned public API (`prd/public-api [DONE]`), an MCP server (`prd/mcp-course-authoring [DONE]`), an embeddable course widget (`prd/course-widget-embed [DONE]`), an AI tutor with agent tools, public course pages, custom domains, SSO. What is missing is one content object that travels through all of them.

Once a Doc can back a lesson, the AI tutor, the MCP tools, and the public API read it *by accident* — they already read lesson bodies (`apps/api/src/services/agent/student-tools.ts`, `packages/core/src/services/agent/chat-tools.ts`, `packages/mcp/src/tools/course-drafts.ts`, `apps/api/src/routes/v1/courses.ts`). The remaining work is exposing catalog Docs to the same channels, which is wiring, not architecture.

That is the sentence no incumbent can say: *the help article, the lesson, the in-app widget panel, the API resource, and the thing the AI tutor answers from are one page you edit once.* Compare it to the PRD's headline surface, the blog — which is table stakes and which WordPress does better.

**Recommendation:** promote "Docs through existing channels" above the blog in priority. It is cheaper and it is the actual moat.

### 3. Freshness is the wedge that monetises, and the PRD punts on it.

The PRD names the pain exactly right — *"When the product changes, courses go stale"* — then makes it "not a separate feature in v1" and relies on propagation.

Propagation answers "I edited it." It does not answer "I don't know what to edit." A customer-education lead with 200 pages and a biweekly release train does not have an editing problem, they have a **triage** problem. Reuse shrinks the number of places to edit; it does not tell you which pages the last release invalidated.

`reviewed_at`, `review_interval_days`, a steward, a "needs review" queue, and "this edit updates 12 lessons across 4 courses" on save is a handful of columns on a table we are already touching. It is the most defensible customer-education-specific feature in the whole plan — generic LMSs have approval workflows, not freshness — and it is the thing that turns the product from something configured once into something a CE team opens weekly.

**Recommendation:** make freshness a named v1 capability, even if it ships as three columns and one filter.

### 4. Locale is missing from the PRD entirely, and it is both a risk and an upsell.

Lesson bodies are per-locale (`lesson_language`, one row per locale). `org_doc` has no locale. Linking a Doc into a translated lesson therefore silently downgrades a multilingual course to monolingual. That has to be blocked (see plan D4).

Inverted, it is a strong enterprise story: with `org_doc_language`, a customer translates the SSO page **once** and every course, catalog entry, blog post, and widget updates in every language. Per-course translation is how everyone else does this, and it is why their customers give up on localisation. This is hard to retrofit and easy for us, because the reuse plumbing is the same plumbing.

### 5. `doc_placement` would cost us the thing we are buying.

Detailed in plan D1. The strategic version: an untyped placement table (`surface`, `target_id`, no FK) means every reader gains a `switch (surface)` and every new surface multiplies code paths. Typed links plus a *derived* usage query means surfaces compose instead of accumulating. Same argument as the landing page: a seventh hardcoded section makes the eighth harder; a block registry makes every future one free.

The tell that this matters: a stored placement table drifts the first time `deleteLesson()` runs, because `deleteLesson()` will never know placements exist. A "Used in" panel that is sometimes wrong is worse than none, because authors stop trusting it and go back to copy-paste.

### 6. Docs' permission model is staff-shaped and will not survive being the content layer.

`visibility` is `private | team | public`, and `team` means *every org member — students included* — can read the Doc by id (`resolveNoteAccess`). Listing is safe; direct id reads are not. That is fine while Docs are staff scratchpads. It stops being fine the moment Docs carry all customer-facing content and learners legitimately hold Doc ids from lessons.

Two splits are needed before Docs go anywhere public: `team` → `staff` / `members`, and "listed in the catalog" separated from "readable by URL". Cheapest now, while there are 13 seeded Docs and no customer data shaped by the old model.

### 7. Naming drift is already producing customer-facing bugs.

`org_doc` in the database, `/doc` in the API, `*Note*` in most function names, `/org/[slug]/docs` in the admin app, `/lms/notes` in the LMS, `/doc/[slug]` in public. That drift is not cosmetic: the public Doc reader was calling `/org-site/note/:slug` against an API mounted at `/org-site/doc`, so **every public Doc URL returned 404**. Fixed in this branch, but it is the second-order cost of two names for one primitive.

If this becomes *the* primitive, finish the rename now, while the surface is small. Worth also deciding the customer-facing noun deliberately — "Docs" already means our developer documentation (`apps/docs`), and CE buyers will read "Docs" as a help centre, which is only one of the five things this is.

---

## What I would cut or move

| Item | Verdict |
| --- | --- |
| Docs as learning-path items (PRD §4) | **Cut.** There is no learning-path or path-item table; `program_*` is legacy and `cohort_*` links courses only. Move to a paths PRD, and design `path_item` as heterogeneous from the start — the mistake `program_course` and `cohort_course` both made was assuming a path holds only courses |
| Docs as blog posts (PRD §3) | **Move later.** Most expensive surface (10 theme composers + 4 dashboard registries) and least differentiated. Do it *after* the landing block model, so it lands as a block type rather than a seventh singleton |
| URL bookmarks (PRD §6) | **Downgrade from a phase.** `assets.provider` already has `external_url` and `is_external` exists; this is a Zod enum value plus a filter option |
| Unified search (PRD §5) | **Promote.** `org_doc.plain_text` already exists, so adding Docs is one query function — and it is the moment to replace the `ILIKE '%term%'` fan-out with a `tsvector`, before Docs make it the biggest table in the query |
| Product-change updates (PRD §7) | **Promote to a named capability** — see point 3 |
| Reusable Doc lessons (PRD §1) | **Keep as P0.** Correct wedge |

Resulting order: **reuse → reach → freshness → composition.** The PRD's order is reuse → distribution, which front-loads the expensive, undifferentiated surfaces.

---

## The risk nobody has named: making authoring worse for the 80% case

If Docs becomes the way to author, the course editor becomes two-headed — some lessons edit inline, some send you to another workspace. The plan handles the mechanics (doc-backed lessons are read-only in the course editor, with "unlink and keep a copy" as the escape hatch), but the product decision matters more than the mechanics:

**Reuse must stay opt-in, and it must be discovered at the moment of duplication.** "Add lesson → type" has to remain one click. The right moment to offer linking is when the system can see the duplication — an author pasting a body that closely matches an existing Doc, or creating a fifth lesson called "Welcome". Prompting there converts; making Docs the default path taxes every author who only ever needed one lesson.

Second-order version of the same risk: a Doc used in 12 courses is a shared dependency, and editing it is a deploy. "This will change 12 lessons across 4 courses — continue?" is not a nicety; without it, reuse becomes the thing authors were right to fear.

---

## Metrics worth committing to

The PRD's metrics are mostly counts, which will go up whether or not the strategy is working. Better:

| Metric | Why it is the real signal |
| --- | --- |
| **Fan-out ratio** — median surfaces per Doc, for orgs with >10 Docs | The direct measure of "content layer" vs "second wiki". Target median ≥ 2. If it sits at 1, we built a wiki |
| **Propagation share** — % of content edits that reach ≥2 surfaces | Whether reuse is actually being used, not just available |
| **Staleness** — median age of `reviewed_at` across Docs backing published courses | The number a CE lead screenshots for their VP. Also the number that proves the "product changed" claim |
| **Channel reach** — % of Docs readable through ≥2 channels (academy, widget, API, tutor) | Whether "same page, every channel" is real |
| **Composition** — sections per landing page beyond the default, after Phase 6 | The customisability claim, measured |

Explicitly not: Docs created, or blog views. Both go up during a trial and tell us nothing.

---

## One-line positioning I would test

The PRD's line — *"Your academy stays current because the lesson, the help article, and the blog post are the same page"* — is good, and it is about freshness.

The stronger claim, and the one our existing channels already almost support:

> **One page. Your academy, your help centre, your in-app guide, your API, and your AI tutor all read it. You edit it once.**

The PRD's version competes with a CMS. This one competes with nobody, because no one else has the channels.
