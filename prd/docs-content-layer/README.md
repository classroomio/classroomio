---
name: Docs as Content Layer (Customer Education)
overview: For B2B SaaS customer education, Docs is the shared content primitive — write once, reuse in courses, catalog, blogs, cohorts, and learning paths. Editing a doc updates every reference. Solves slow content creation and “product changed, update every course.” Library search and URL bookmarks remain supporting slices.
todos:
  - id: prd-review
    content: Align on Docs vs Media vs lesson ownership; confirm catalog/blog wait on landing-page primitives
    status: pending
  - id: land-docs-workspace
    content: Merge Docs workspace (#699) so org_doc exists on main
    status: pending
  - id: reusable-doc-lessons
    content: Live-link a Doc into many course lessons; edit once, apply everywhere (intro/outro)
    status: pending
  - id: usage-graph
    content: Show where a Doc is used (courses, paths, cohorts, landing, blog)
    status: pending
  - id: unified-search
    content: Org/LMS/academy search across Docs, courses, paths, and library assets
    status: pending
  - id: catalog-one-off-lessons
    content: Public/LMS catalog filter by lesson (Doc), course, or learning path
    status: pending
  - id: docs-as-blog
    content: Landing-page section that renders selected Docs as blog posts
    status: pending
  - id: docs-in-cohorts-paths
    content: Attach Docs as cohort materials and learning-path items
    status: pending
  - id: url-bookmarks
    content: URL bookmarks in Media for non-Doc resources (help articles, vendor links)
    status: pending
isProject: true
---

# Docs as the Content Layer — Customer Education PRD

## Status

- **Draft** — 2026-09-09
- **ICP:** B2B SaaS **customer education** (CS / CE / product marketing at product-led companies)
- **Depends on:** Docs workspace on `main` ([PR #699](https://github.com/classroomio/classroomio/pull/699))
- **Related problem (cross-cutting, not unique to this PRD):** When the **product changes**, courses go stale. Docs-as-source-of-truth is how we attack that — one page, many courses.

---

## Marketing use case

**Who:** Customer education, CS, and product marketing at a B2B SaaS company. They run an academy for customers (onboarding, product 101, admin/cert tracks) and also need help articles, changelog posts, and one-off guides.

**The mess today:** Every time Billing or SSO changes, someone hunts through courses, Intercom, and a blog to paste the same update. The intro lesson is copy-pasted into five courses. A “how to invite your team” page either lives inside a full course nobody finishes, or in a help center the academy doesn’t know about.

**The unlock:** **Write it once as a Doc. Use it everywhere. Change it once.**

A Doc is the source of truth. Courses, the academy catalog, the blog, cohorts, and learning paths only *point* at it — they don’t own a copy.

| They write | They place it |
| --- | --- |
| “Welcome to Acme” | Intro lesson in every course |
| “Set up SSO” | Catalog lesson *and* step 3 in Admin Cert |
| “What’s new in Billing” | Blog on the landing page *and* a lesson in Product 101 |
| “How this cohort works” | Cohort materials, not a dummy course |

When product ships, they edit the SSO Doc. Onboarding, the cert path, and the public article update together. No CMS, no duplicate lessons, no stale academy.

**One line:** *Your academy stays current because the lesson, the help article, and the blog post are the same page.*

**Not this:** A second wiki next to the LMS. Docs *are* the content layer the academy is built from.

---

## Positioning

ClassroomIO is a **customer academy** for SaaS, not a generic corporate LMS.

Content creation should be **fast**: write a Doc, drop it into onboarding, admin cert, and a changelog blog without rewriting three lessons.

**Docs** are the authored page (Notion-like). **Media** stays files, video, and URL bookmarks. **Courses / paths / cohorts / landing page** are **distribution** — they reference Docs; they do not own a copy of the prose.

```
                    ┌─────────────┐
                    │    Docs     │  write / version / share
                    └──────┬──────┘
           ┌───────────────┼───────────────┬──────────────┐
           ▼               ▼               ▼              ▼
      Course lessons   Landing catalog   Blog section   Cohort / path
      (intro, outro,   (filter lessons   (same Doc,     (guide, intro)
       reusable)        / courses /       blog chrome)
                        paths)
```

---

## Problems we are solving

| Pain (SaaS CE) | Today | Target |
| --- | --- | --- |
| Same intro/outro copied into every course | Duplicate lesson JSON | One Doc, many lesson references |
| Product UI/copy changes | Hunt every course and paste | Edit the Doc; all courses update |
| Help article vs course vs blog | Three tools (Intercom, LMS, CMS) | One Doc, different **surfaces** (lesson, catalog, blog, cohort) |
| Learners only browse **courses** | Can’t find a single “SSO setup” page | Catalog filter: **lessons (Docs) / courses / paths** |
| Cohort needs a one-pager | Stuff it into a dummy course | Attach a Doc to the cohort |

Faster creation is a consequence: authors write **once** and compose academies from Docs + video + exercises.

---

## Personas

| Who | Job |
| --- | --- |
| **Customer education lead** | Onboarding + product 101 + admin tracks that stay current when PM ships |
| **CS / success** | Point customers at one SSO guide used in the academy, a blog, and a cohort |
| **Learner (customer)** | Filter “all learning” by a single lesson, not only full courses |
| **Author** | Reuse “Welcome to Acme” across every product line course |

---

## Principles

1. **Docs are the primitive.** A lesson *can be* a Doc. A blog post *can be* a Doc. A cohort guide *can be* a Doc.
2. **Reference, don’t copy.** Change the Doc → every attached surface updates.
3. **Surfaces have chrome, not content.** Course player, blog layout, catalog card, cohort sidebar wrap the same `org_doc`.
4. **Presentation is a Doc setting + placement**, not a new content type. Example: `appearance: lesson | article | blog` (names TBD) plus where it is mounted.
5. **Media is not prose.** PDFs, videos, and **URL bookmarks** (external help centers) live in Media and can also be referenced — secondary to Docs for this ICP.
6. **Product-change updates** are the same mechanism: the “What’s new in Billing” Doc is the lesson in three courses.

---

## Capabilities

### 1. Reusable Doc lessons (P0)

**Story:** Introductory lesson (or shared outro) used in every course. Edit once.

**Behavior**

- In course builder: **Add lesson → From Doc** (create new Doc or pick existing).
- Lesson row stores `doc_id` (and optional local title override). Body always from the Doc.
- Same Doc in Course A and Course B; progress is **per course enrollment**, not global.
- Doc editor shows **Used in:** Course A · Lesson 1, Course B · Lesson 1.
- Convert-to-course remains for “this tree becomes a new course outline.” Reuse is **link**, not convert.

**Acceptance**

- [ ] One Doc embedded in two courses; edit heading; both player views update.
- [ ] Removing the lesson from a course does not delete the Doc.
- [ ] Deleting/archiving a Doc in use: warn with usage list.

### 2. Catalog: one-off lessons on the academy (P1)

**Story:** Customers open **Courses** or **All learning** and filter by **individual lessons**, **courses**, or **learning paths**.

Some Docs are **standalone** (SSO how-to, “Invite your team”) — not only a step inside an 8-lesson course.

**Behavior**

- Doc flag or placement: **Show in catalog** (and visibility: public / enrolled / logged-in).
- Catalog types: `course` | `path` | `lesson` (Doc).
- Card: title, excerpt, duration estimate (optional), tags.
- Opening a catalog lesson uses academy chrome (not the full Docs workspace).
- Optional: still attach that Doc inside a course **and** list it standalone.

**Acceptance**

- [ ] Filter All learning → Lessons shows only catalog Docs the visitor can access.
- [ ] Same Doc can appear as a catalog lesson and as a step in a course.

### 3. Docs as blog posts (P1)

**Story:** Landing page has a **Blog** (or Changelog / Resources) section. Posts are Docs, not a second CMS.

**Behavior**

- Landing section: **Docs collection** with layout `blog` (title, date, author, cover, excerpt).
- Author picks Docs (or a Docs folder / tag).
- URL: `/blog/[slug]` or `/resources/[slug]` mapping to the Doc slug.
- SEO: title, description from Doc; `appearance = blog` for typography/date.
- No separate `blog_post` table in v1 if Doc + placement is enough.

**Acceptance**

- [ ] Publish a Doc, add it to the blog section, it renders as an article on the academy.
- [ ] Updating the Doc updates the blog post.
- [ ] Unpublished / private Docs never appear on the public landing page.

### 4. Docs on cohorts and learning paths (P1)

**Story:** Cohort gets a single onboarding guide. A path mixes courses and a “Start here” Doc.

**Cohort**

- **Materials:** attach Docs (intro, office-hours notes, program FAQ).
- Shown in cohort home / LMS for members — not buried as a fake course.

**Learning path**

- Path items: `course` | `doc` | (later `exercise`).
- Sequence: Doc “Welcome” → Course Product 101 → Doc “Next steps.”
- Completing a Doc item = opened + optional mark complete (v1: mark complete).

**Acceptance**

- [ ] Cohort members see attached Docs without enrolling in an extra course.
- [ ] Path progress counts Doc items.

### 5. Unified search (P0 with reuse)

**Story:** CE lead and customers find the SSO Doc whether they search the org, LMS, or academy.

- Org ⌘K: Docs + courses + paths + Media.
- LMS / academy: permission-aware Docs (catalog + enrolled course Docs) + courses + paths.
- Result type: Doc vs Course vs Path vs File vs Link.

### 6. URL bookmarks (P2 for this ICP)

External help articles and dashboards remain **Media `kind = link`**, embeddable in lessons. **Do not** replace Docs. SaaS CE still lives in Intercom/docs sites; bookmarks are the bridge until content is rewritten as Docs.

### 7. Product-change updates (cross-cutting)

Not a separate feature in v1. Mechanism:

- Canonical Doc per concept (“Billing seats”, “SSO”).
- Courses/paths/blog/cohorts **reference** it.
- Optional later: “This Doc is used in 12 lessons — notify authors” on save; AI “update this Doc from changelog.” Out of v1 unless cheap.

---

## What we are not doing in v1

| Item | Notes |
| --- | --- |
| Zoho-style approval / mandatory read | Later; CE academy first |
| Second CMS for blogs | Docs + blog chrome only |
| Auto-sync product changelog → Doc | Follow-up to product-change problem |
| Agent RAG knowledge base | Separate PRD |
| Learning paths product itself | Paths may land in parallel; this PRD only **attaches Docs** to paths |
| Duplicating Media Manager | Files/video stay there |

---

## Phasing (after #699)

Order matches **faster creation + stay in sync**, then **distribution**.

| Phase | Ships | CE claim |
| --- | --- | --- |
| **0** | Docs workspace on `main` | Authors have a place to write |
| **1** | Reusable Doc lessons + usage graph | “Intro in every course, edit once” |
| **2** | Unified search (Docs in org/LMS/academy) | “Find the SSO guide anywhere” |
| **3** | Catalog one-off lessons + filters | “All learning: lessons / courses / paths” |
| **4** | Blog section from Docs | “Resources without WordPress” |
| **5** | Cohort materials + path items | “Guide for this cohort / this path” |
| **6** | URL bookmarks + bulk import | Bridge from old help center |

**Phase 1 is the wedge.** Catalog/blog/cohorts are the same primitive on more surfaces.

---

## Data model (illustrative)

```
org_doc                          -- already
  appearance: 'page' | 'lesson' | 'blog'   -- optional
  show_in_catalog: boolean

doc_placement (
  doc_id,
  surface,        -- 'lesson' | 'catalog' | 'blog' | 'cohort' | 'path'
  target_id,      -- lesson_id | cohort_id | path_id | landing_section_id
  position,
  title_override  -- nullable
)
```

Lesson row: `doc_id` nullable. If set, player renders that Doc as the lesson body (plus existing video/exercises as siblings if needed — **open question**: Doc-only lesson vs Doc as one material tab).

Usage query: all `doc_placement` + `lesson.doc_id` for the Doc editor sidebar.

---

## Open questions

1. **Doc-only lesson vs material tab:** Is a reusable intro a **whole lesson** (replaces note/video tabs) or a **material** next to video? Recommend **whole lesson type `doc`** plus optional video on the same lesson if we already allow mixed materials.
2. **Progress:** Same Doc in two courses = two completion records (yes). Catalog one-off = separate “read” progress?
3. **Blog URL vs Doc public URL:** `/blog/sso` vs `/doc/sso` — one canonical, the other redirect?
4. **Who can attach:** tutors vs admins for blog/catalog (recommend admin for public surfaces).
5. **Landing filters:** New “All learning” page vs extend existing courses list?

---

## Success metrics

- Reuse: % of courses with ≥1 shared Doc lesson (intro/outro).
- Time-to-update: edit one Doc, N courses reflect it (qualitative + usage count).
- Catalog: visits to standalone Doc lessons vs full courses.
- Blog: public Doc views from landing section.

---

## Related

- [content-library-lms-bridge](../content-library-lms-bridge/README.md) — stub pointing here
- [notes-sidebar](../notes-sidebar%20%5BDONE%5D/README.md) — Docs workspace (done, pending #699 → main)
- [notes-comments](../notes-comments%20%5BDONE%5D/README.md) — inline comments (done)
- [website-customer-ed-positioning](../website-customer-ed-positioning/README.md) — marketing wedge
- [docs-knowledge-base](../docs-knowledge-base/README.md) — Zoho-style governance (later)
- [programs](../programs%20%5BDONE%5D/README.md) — paths/programs primitive
- [media-manager](../media-manager%20%5BDONE%5D/README.md) — files/video/links

---

## Next steps

1. Land **#699**.
2. Spec Phase 1 (lesson `doc_id`, picker, usage graph) as `implementation-plan.md`.
3. Decide catalog vs blog next for the public academy (both are placements).
