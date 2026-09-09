---
name: Content Library + Unified Search + Embed in Lesson
overview: Make ClassroomIO the LMS that doubles as a knowledge base — one org library for Docs, uploaded files, and URL bookmarks; one search across library + courses; lessons that reference library items instead of copying them. Answers the r/elearning “searchable assets + KB-first reuse” buyer.
todos:
  - id: prd-review
    content: Confirm naming (Library vs Media), URL bookmark as asset kind, and that this waits on Docs (#699) landing
    status: pending
  - id: url-bookmarks
    content: Add URL bookmark assets (title, URL, description, tags) to Media / assets table
    status: pending
  - id: usage-graph
    content: Record asset_usages for lesson embeds and doc_usages for org_doc lesson links
    status: pending
  - id: unified-search
    content: Extend org and LMS command palette to search docs, assets, and URL bookmarks alongside courses
    status: pending
  - id: embed-doc-lesson
    content: Lesson material type that live-links a published org doc (not convert-to-course copy)
    status: pending
  - id: embed-library-lesson
    content: Attach library file or URL to a lesson by reference; learner opens the same asset
    status: pending
  - id: picker-ux
    content: Shared “Add from library” picker in lesson editor and Docs (create bookmark / pick file)
    status: pending
  - id: bulk-url-import
    content: CSV/list import of URLs for migrating off a legacy LMS+KB
    status: pending
isProject: true
---

# Content Library, Unified Search, and Embed-in-Lesson PRD

## Status

- **Draft** — 2026-09-09
- **Depends on:** Docs workspace landing on `main` ([PR #699](https://github.com/classroomio/classroomio/pull/699); #715 already merged into that branch)
- **Builds on:** Shipped **Media Manager** (`assets` / `asset_usages`, org `/media`), Docs (`org_doc`), org ⌘K search (courses, cohorts, widgets, tags, audience)
- **Buyer:** r/elearning — “our LMS doubles as a KB; anything we load is searchable as an asset; add to KB then use in courses; lots of content is just URLs”

## Purpose

Give one authoring path:

1. **Put content in the library** (a Doc, a file, or a URL).
2. **Find it later** from org or LMS search — not only from the course it was first attached to.
3. **Use it in a lesson by reference** so editing the source updates every use.

That is the gap vs Absorb/Docebo “resources tabs” and vs SharePoint + LMS. It is **not** Zoho governance (approval, mandatory read) and **not** agent RAG ([agent-knowledge-base](../agent-knowledge-base/README.md)).

---

## Problem statement

Today content lives in three silos:

| Store | What it holds | Search | Reuse in courses |
| --- | --- | --- | --- |
| **Docs** (`org_doc`) | Handbooks, SOPs, lesson notes | Docs workspace ⌘K only | **Convert to course** copies structure; no live link |
| **Media** (`assets`) | Videos, files uploaded from lessons | Media page; **not** org ⌘K | Attach from library in some flows; usages exist |
| **Lesson JSON** | `lesson.documents[]`, embed links in videos | Course titles only | Duplicated per lesson |

The Reddit buyer’s current platform: **load once → searchable forever → drop into any course.** We cannot claim that until library, search, and embed share one index and one identity.

---

## Users and jobs

| Persona | Job |
| --- | --- |
| **L&D / CS lead** | One catalog of policies, job aids, vendor URLs, and recordings |
| **Course author** | Pick an existing SOP or link instead of re-uploading |
| **Learner / employee** | ⌘K or LMS search finds the handbook *and* the course that uses it |
| **Migrating from old LMS** | Import a spreadsheet of URLs, then attach them to lessons |

---

## Product principles

1. **One identity per item.** A URL bookmark is an `asset`. A handbook is an `org_doc`. A lesson **points at** that id.
2. **Do not invent a third library.** Extend **Media** for files + URLs; keep **Docs** for authored pages. Unified search sits on top of both.
3. **Reference over copy.** Convert-to-course stays for “this outline becomes a new course.” Embed is for “this lesson *is* that doc/file/URL.”
4. **Search is the product.** If it isn’t in org ⌘K (and LMS search for learners), it isn’t in the library.

---

## Scope (v1)

### 1. Library — URL bookmarks + files (extend Media)

**User story:** As an author, I add a URL (Confluence page, Google Doc, vendor portal) the same way I add a PDF, with a title and tags, without creating a full Doc.

**Requirements**

- Asset `kind`: keep `video` | `document` | `image` | `audio`; add **`link`** (or `provider = external_url` + `kind = other` — product pick in review; recommended **`kind = 'link'`**).
- Required: `title`, `source_url`, `organization_id`, `created_by`.
- Optional: `description`, `thumbnail_url` (og:image fetch stretch), org **tags** (same tag system as docs/courses).
- Media page: filter **Links** | Files | Video; **Add link** action.
- Dedup: unique `(organization_id, normalized_url)` for `kind = link` so the same URL is not added twice.
- Docs remain first-class; do **not** store full TipTap pages as assets.

**Acceptance**

- [ ] Create/edit/archive a URL bookmark from `/org/[slug]/media`.
- [ ] Same bookmark can be attached to two lessons without a second upload.
- [ ] External links do not count toward org storage bytes (already true for `is_external`).

### 2. Unified search

**User story:** As an admin I hit ⌘K and see Docs, links, files, and courses in one palette. As a learner I search the LMS and find public/team docs and course materials I can access.

**Requirements**

| Surface | Today | v1 |
| --- | --- | --- |
| Org ⌘K | Courses, cohorts, widgets, tags, audience | + **Docs** (title + `plain_text` snippet) + **assets** (title, description, URL) |
| LMS ⌘K | Courses, cohorts | + Docs the learner can read + assets used in **their** courses |
| Docs workspace ⌘K | Docs only | Keep; also jump to “Open in library” for linked assets **optional** |
| Public academy | None for docs | Public docs title search on help hub **stretch / v1.1** |

**Permissions**

- Org search: same access as Docs (private = owner only; team = admins/tutors; public = org members).
- LMS search: never leak private docs or unused library files to students.
- Result groups: **Docs** | **Library** (files + links) | Courses | … existing groups.

**Acceptance**

- [ ] Searching a doc title from org home opens that doc.
- [ ] Searching a bookmark title opens the Media item and lists “Used in N lessons.”
- [ ] Student search does not return another course’s private PDF.

### 3. Embed in lesson

**User story:** As an author I add a lesson block “From library” and pick a Doc, file, or URL. Learners see the live content. If I edit the Doc, the lesson updates.

#### 3.1 Doc as lesson material

- New lesson slot: **`doc`** (or `libraryDocId` on lesson).
- Picker: published org docs the author can read.
- Learner view: same reader as team/public doc (prose HTML), inside the lesson chrome (progress, next lesson).
- Completing the lesson can stay “mark complete” in v1 (no mandatory-read acknowledgement).
- **Convert to course** unchanged and separate.

#### 3.2 File or URL as lesson material

- Reuse `lesson.documents[]` / video slots **or** add `libraryItems[]: { assetId, kind }`.
- Prefer **`assetId` + `asset_usages`** (`slot_type`: `lesson_document` | `lesson_link` | `lesson_video`).
- Learner: file → existing document viewer/download; link → in-lesson panel with title + “Open resource” (new tab) + optional embed if allowlisted (YouTube already exists).
- Removing the lesson usage **does not delete** the asset.

**Acceptance**

- [ ] Lesson with a linked Doc shows current Doc HTML after the Doc is edited.
- [ ] Usage graph: Media item shows which courses/lessons reference it.
- [ ] Deleting a Doc used in a lesson: block or warn (“used in 3 lessons”) — **warn + orphan lesson empty state** in v1.

---

## Out of scope (v1)

| Item | Why |
| --- | --- |
| Approval / verification / mandatory read | Zoho KB PRD — later |
| Learning paths | Separate |
| Agent vector KB / RAG | [agent-knowledge-base](../agent-knowledge-base/README.md) |
| Study from Source AI course generation | [study-from-source](../study-from-source/README.md) |
| SCORM packages as library items | [scorm-support](../scorm-support/README.md) |
| Sync Notion / Drive / SharePoint | Integrations later |
| Real-time co-editing Docs | Explicitly out of Docs scope |
| Replacing Media Manager UI | Extend filters + Add link |

---

## Phasing

| Phase | Ships | Unlocks marketing claim |
| --- | --- | --- |
| **0** | Docs on `main` (#699) | Handbook + courses in one org |
| **A** | URL bookmarks in Media + tags | “Links live in the library, not only in a lesson” |
| **B** | Unified org + LMS search (docs + assets) | “Anything in the library is searchable” |
| **C** | Embed Doc / file / URL in lesson + usages | “Add to library, then use in courses” |
| **D** | Bulk URL import (CSV) | Migration from legacy LMS |

Do **A → B → C** in that order. Search without bookmarks still helps Docs; embed without search still helps authors. The Reddit quote needs **all three**.

Suggested calendar after #699: **A+B one iteration, C next, D when a design-partner migration exists.**

---

## Data model (illustrative)

### Assets (existing +)

```
assets.kind: 'video' | 'document' | 'image' | 'audio' | 'link'
assets.source_url  -- required for kind=link
assets.is_external = true for links
UNIQUE (organization_id, lower(trim(source_url))) WHERE kind = 'link' AND status = 'active'
```

Optional `asset_tag_assignment` if tags are not already generic.

### Lesson ↔ library

```
lesson_library_item (
  lesson_id,
  organization_id,
  item_type,   -- 'doc' | 'asset'
  doc_id,      -- nullable, fk org_doc
  asset_id,    -- nullable, fk assets
  position
)
```

Or JSON on `lesson` plus `asset_usages` / `org_doc` usage table. **Prefer a table** so search and “used in” queries stay cheap.

### Search

Extend `searchOrganization` / `searchLmsOrganization` in `apps/api/src/services/organization/search.ts`:

- `searchOrgDocs(orgId, q, profileId)`
- `searchOrgAssets(orgId, q, kinds?)`
- LMS variants filtered by enrollment + visibility

Index: Postgres `ILIKE` / `plain_text` in v1 (same as current org search). Full-text (`tsvector`) if latency shows up.

---

## UX sketch

**Media**

```
[ All ] [ Videos ] [ Files ] [ Links ]
[+ Add link]  [Upload]
★ Product FAQ (Confluence)     link
★ Onboarding PDF               document
```

**Lesson editor — Materials**

```
Add material:  Video | Document | Slide | From library
  → picker: Docs | Files | Links   search
```

**⌘K**

```
Docs        Handbook / PTO policy
Library     Vendor LMS login (link)
Courses     New hire week 1
```

---

## Analytics

- Library item open (asset or doc) from search vs from lesson.
- Count of lessons referencing each item (Media detail).
- Reuse rate: assets with `usages > 1`.

Reuse existing `doc_page_view` for public docs. New event: `library_item_open` with `asset_id` | `doc_id`.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| #699 not on main | This PRD waits; no new library on `notes` tables |
| Two pickers (Media vs Docs) confuse authors | One **From library** modal with tabs |
| Students search the whole org library | LMS search scoped to enrolled courses + public/team docs only |
| Embed XSS / open redirect on URLs | Allowlist http(s); no `javascript:`; optional domain allowlist org setting later |
| Duplicate with convert-to-course | Copy in UI: Convert = new course from outline; Embed = this lesson shows that doc |

---

## Success metrics (90 days after C)

- ≥30% of new lessons in design-partner orgs use **From library** instead of a fresh upload.
- Org ⌘K queries that click a Doc or Library result (instrument).
- Qualitative: can demo the Reddit post end-to-end (add URL → search → attach to lesson).

---

## Open questions

1. **Nav:** Keep Media as the library, or rename to **Library** and nest Videos/Files/Links?
2. **Doc vs link:** If someone pastes a URL into Docs as a page, do we also create a bookmark automatically? (v1: **no**, two explicit actions.)
3. **Learner completion:** Is opening a linked URL enough to mark the lesson complete, or still a separate complete button?
4. **Public catalog:** Should public academy search include public Docs in v1? (Recommend **v1.1**.)

---

## Related

- [docs-knowledge-base](../docs-knowledge-base/README.md) — governance / help hub (later)
- [media-manager](../media-manager%20%5BDONE%5D/README.md) — canonical assets (done)
- [notes-sidebar-prd](../notes-sidebar-prd.md) — Docs workspace (in #699)
- [agent-knowledge-base](../agent-knowledge-base/README.md) — AI retrieval (different job)

---

## Next steps

1. Product: open questions + rename Media vs Library.
2. Land **#699** so `org_doc` exists on `main`.
3. Engineering: `implementation-plan.md` for Phase A (bookmark schema + Media UI) once #699 is merged.
