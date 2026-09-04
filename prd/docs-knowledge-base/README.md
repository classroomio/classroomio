---
name: Docs Knowledge Base (Zoho Learn KB Parity)
overview: Close gaps between ClassroomIO Docs and Zoho Learn’s knowledge-base (manuals) capabilities so we can market Docs as a full internal + customer help center, while courses remain the LMS wedge. Governance and reader UX first; export, reporting, and LMS bridge follow.
todos:
  - id: prd-review
    content: Review phases, naming (Docs vs Help Center), and plan gates with product
    status: pending
  - id: governance-schema
    content: Design schema for workflow state, reviewers, verification schedules, mandatory read assignments
    status: pending
  - id: governance-api-ui
    content: Approval flow API + editor states + reviewer inbox
    status: pending
  - id: verification-reminders
    content: Verification due dates, owner notifications, stale badges in sidebar
    status: pending
  - id: mandatory-read
    content: Assign mandatory docs, reader acknowledgement, completion tracking for admins
    status: pending
  - id: reader-collapsible
    content: Collapsible sections in public + team doc reader (TOC / heading blocks)
    status: pending
  - id: help-center-hub
    content: Curated academy help-center landing (featured docs, categories, footer links)
    status: pending
  - id: export-pdf-html
    content: Export single doc as HTML; export doc tree as PDF manual
    status: pending
  - id: kb-analytics
    content: Org dashboard for doc views, mandatory-read completion, verification status
    status: pending
  - id: ai-sop-generator
    content: Prompt-to-outline SOP/doc generator with insert into Docs
    status: pending
  - id: doc-as-lesson
    content: Link existing published doc as course lesson without full convert-to-course
    status: pending
  - id: marketing-page
    content: Website Docs feature page with Available now vs Coming soon aligned to phases
    status: pending
isProject: true
---

# Docs Knowledge Base PRD

## Status

- **Draft** — 2026-07-20
- **Owner:** TBD
- **Builds on:** Shipped **Docs** (`org_doc`, org workspace `/org/[slug]/docs`, public `/doc/[slug]`, lesson capture notes)
- **Related:** Courses (shipped), **Learning paths** (separate PRD — not in scope here except doc-as-lesson link)
- **Competitive reference:** [Zoho Learn](https://www.zoho.com/learn/), [KB features](https://www.zoho.com/learn/features.html), [Maintain KB](https://www.zoho.com/learn/managing-information.html)

## Purpose

Position **ClassroomIO Docs** as the **knowledge base** half of a Learn-style stack:

| Zoho Learn pillar | ClassroomIO today | This PRD |
| --- | --- | --- |
| Unified KB (hierarchy, collaborate, share) | **Shipped** (tree, comments, share, public) | Polish + help-center hub |
| Maintain KB (approval, verification, mandatory read, versions) | **Version history only** | **Phase 1** |
| Discovery (search, tags) | **Shipped** (workspace search, tags) | Global help-center search in Phase 3 |
| Reader UX (collapsible long docs) | **Gap** | **Phase 2** |
| Export (PDF manual, HTML article) | **Gap** | **Phase 3** |
| KB reporting | **Partial** (public page views) | **Phase 4** |
| AI KB (SOP generator) | **Partial** (AI comment review) | **Phase 5** |
| LMS bridge (article as lesson, paths) | **Convert doc → course** | **Phase 6** + paths elsewhere |
| Real-time co-authoring, native mobile apps, unlimited branded portals | **Not planned** | **Out of scope** (see below) |

**Marketing goal:** A dedicated website page: *“Docs — your team’s source of truth and customer help center, connected to the courses you already run on ClassroomIO.”*

Lesson UI keeps **Take note** language for capture; org product stays **Docs**.

---

## Problem statement

Teams use Zoho Learn (and similar) for **SOPs, policies, onboarding manuals, and customer help** with **governance**: content must be reviewed before publish, re-verified on a schedule, and **read + acknowledged** for compliance.

ClassroomIO Docs already supports **authoring, hierarchy, collaboration, and public academy pages**, but we cannot honestly claim parity with Zoho’s **“Maintain a healthy knowledge base”** story until we ship workflow, freshness, and mandatory-read tooling.

Without this, the website must under-sell Docs or over-claim vs Zoho — both hurt positioning next to courses we already win on.

---

## Users & jobs

| Persona | Job to be done |
| --- | --- |
| **KB owner / ops** | Keep SOPs accurate; know who read critical policies |
| **Author** | Draft, get review, publish without email chaos |
| **Reviewer** | Approve or request changes before go-live |
| **Employee / learner** | Find answers fast; complete required reads |
| **Customer** | Self-serve help on the academy site |
| **CS / education lead** | One platform: help center + customer training courses |

---

## Baseline (shipped — do not re-spec)

Treat as **Available today** on marketing:

- Nested docs (sub-pages), sidebar sections (favorites, private, shared, organization)
- Rich editor, covers, templates (built-in + save as template)
- Visibility: private, organization (team), public on academy
- Per-user shares (read/write), tags, workspace search (⌘K)
- Anchored comments, @mentions, AI review comments, version history + restore
- Trash / restore, import `.md` / `.txt` / `.docx`
- **Convert doc → course**
- Lesson **Take note** side panel (lesson capture `lesson_capture` origin)
- Public doc URLs, ancestor breadcrumbs, **doc page view** analytics

---

## Phased roadmap

| Phase | Theme | Outcome for marketing |
| --- | --- | --- |
| **1** | Governance | “Compliant KB” — approve, verify, mandatory read |
| **2** | Reader UX | “Help center that scales” — long SOPs without scroll fatigue |
| **3** | Packaging & export | “Take it offline” — PDF manual, HTML article |
| **4** | Discovery & reporting | “Know what’s used and what’s stale” |
| **5** | AI authoring | “Draft SOPs faster” |
| **6** | LMS bridge | “Doc in course without rebuilding” |

---

## Phase 1 — Governance (P0)

*Maps to Zoho: [approval flow, verification reminders, mandatory read, version history](https://www.zoho.com/learn/managing-information.html). Version history already shipped.*

### 1.1 Publishing workflow (approval flow)

**User story:** As a reviewer, I want drafts to pass review before team/public visibility changes so our KB stays accurate.

**Requirements**

- Doc **lifecycle states:** at minimum `draft` | `in_review` | `published` (names TBD in UI: “Draft”, “In review”, “Published”).
- **Published** is required for:
  - `visibility: team` or `public` (configurable: allow org setting to skip approval for team-only).
- Authors submit for review; reviewers approve or **request changes** (comment thread or review note).
- **Reviewers:** org admins/tutors by default; optional per-doc reviewer list (stretch).
- Notifications: email and/or in-app when submitted, approved, or changes requested.
- Audit: who changed state and when (store on doc or `org_doc_workflow_event` table).

**Acceptance criteria**

- [ ] Draft doc is visible only to owner + reviewers (not whole org).
- [ ] Approving moves doc to published and applies intended visibility.
- [ ] Rejecting returns to draft with reviewer message visible to author.
- [ ] Public URL returns 404 or “unpublished” for non-published docs.

**Non-goals (v1):** Multi-step approval chains, parallel approvers, legal e-sign.

### 1.2 Verification reminders (content freshness)

**User story:** As a KB owner, I want owners reminded to re-check docs so SOPs don’t go stale.

**Requirements**

- Per-doc **verification policy:** none | fixed date | recurring interval (e.g. every 90 days).
- Fields: `last_verified_at`, `last_verified_by`, `verification_due_at`.
- Owner (or doc owner role) marks **Verified** — updates timestamps and pushes next due date.
- UI: badge in sidebar/list (“Due soon”, “Overdue”), filter in org docs list.
- Optional: block public display when overdue (org setting — default off for v1).

**Acceptance criteria**

- [ ] Setting interval computes next due date on verify.
- [ ] Overdue docs appear in filter and optional email digest to owner.

### 1.3 Mandatory read + acknowledgement

**User story:** As an admin, I want critical docs assigned with proof of read for onboarding/compliance.

**Requirements**

- **Assignment** targets: all org members | role (admin/tutor/student) | explicit user list | cohort/group (stretch v2).
- Assignment record: `doc_id`, `assigned_by`, `due_at` optional, `message` optional.
- Reader sees **Required read** in LMS or docs inbox; must open doc and click **Acknowledge** (customizable label: “I have read and understood”).
- Store: `profile_id`, `doc_id`, `acknowledged_at`, optional `assignment_id`.
- Admin report: assigned vs acknowledged, export CSV.

**Acceptance criteria**

- [ ] Unacknowledged assignees listed per doc.
- [ ] Acknowledgement idempotent; timestamp immutable.
- [ ] Learners cannot dismiss assignment without opening doc (minimum time-on-page optional stretch).

**Dependencies:** Notification system; may reuse compliance-training patterns where they exist.

### 1.4 Org settings

- Toggle: **Share new docs with organization** (existing) + **Require approval before team/public publish** (new).
- Default verification interval for new docs (optional).

---

## Phase 2 — Reader experience (P1)

*Maps to Zoho: [collapsible sublevels](https://www.zoho.com/learn/focalpoint/learn/introducing-collapsible-sublevels-in-zoho-learn.html), structured navigation.*

### 2.1 Collapsible sections (reader mode)

**User story:** As a reader, I want to expand only the section I need in long SOPs/FAQs.

**Requirements**

- In **view** mode (public + team read-only): headings (H2/H3) or explicit **Toggle** blocks collapse/expand.
- Editor: insert “Collapsible section” block (title + body) or auto-collapse by heading level (product choice in design).
- Deep linking: URL hash opens correct section.
- Accessible: keyboard, `aria-expanded`.

**Acceptance criteria**

- [ ] Public doc page supports collapse without breaking SEO (content still in DOM or SSR-friendly).
- [ ] Print/PDF export (Phase 3) expands all sections by default.

### 2.2 Help center hub (academy)

**User story:** As a customer, I land on a help home, not a random doc.

**Requirements**

- Academy route: e.g. `/help` or org-configured path listing **featured** public docs, **categories** (tag groups or manual collections).
- Footer links on public site (curated list).
- Optional: search scoped to public docs only.

**Acceptance criteria**

- [ ] Org admin can pin 3–12 featured articles and order them.
- [ ] Hub only shows `published` + `public` docs.

### 2.3 Manual / collection (optional v2 within phase)

Zoho uses **Manual** as a container. We can defer a new entity if **root doc + children** + hub is enough for v1; if needed:

- `doc_collection` or flag `is_manual_root` with ordered children and hub card.

**Decision:** Product to confirm in review — document in implementation plan.

---

## Phase 3 — Export & packaging (P1)

*Maps to Zoho what’s new: [export manual PDF, article HTML](https://www.zoho.com/learn/whatsnew.html).*

### 3.1 Export single doc as HTML

- Download button on published doc (permission: owner/admin or public).
- Self-contained HTML or `.html` + assets folder; sanitize embedded media URLs.

### 3.2 Export doc tree as PDF (“manual”)

- Select root doc → export subtree as one PDF (cover, TOC, page breaks per doc).
- Server-side render (headless browser or PDF service); queue for large manuals.

**Acceptance criteria**

- [ ] PDF includes nested children up to N levels (config limit, e.g. 50 pages).
- [ ] Failed exports surface job status in UI.

---

## Phase 4 — Discovery & reporting (P2)

### 4.1 Help-center search

- Full-text search across public docs for academy (title + plain_text).
- Workspace search already exists; extend ranking and snippets.

### 4.2 KB analytics dashboard

Extend org analytics:

| Metric | Source |
| --- | --- |
| Public doc views | Existing `doc_page_view` |
| Top docs | Aggregate by `doc_id` |
| Stale / overdue verification | Phase 1 |
| Mandatory read completion % | Phase 1 |
| Authors active | Doc updates in range |

Export CSV/XLSX for admins (align with Zoho reporting narrative).

---

## Phase 5 — AI KB authoring (P2)

*Maps to Zoho: AI SOP generator.*

### 5.1 Generate doc from prompt

- Input: topic + audience + outline depth.
- Output: new doc draft (sections as collapsible or headings) in **draft** state.
- Uses org AI credits / fair-use; no auto-publish.

### 5.2 Enhance existing

- Keep **AI comment review**; add “Expand section” / “Simplify for customers” actions in editor.

**Non-goals:** Unsupervised auto-publish; MCP scope (separate agent PRD).

---

## Phase 6 — LMS bridge (P2)

*Maps to Zoho: “Knowledge articles as lessons”. Learning paths excluded (separate initiative).*

### 6.1 Link doc as lesson

- Course builder: add lesson type **Doc link** → pick published org doc (or public slug).
- Learner sees reader view + progress marker when scrolled/acknowledged (reuse mandatory-read UX optional).
- Editing doc updates lesson content without duplicating course structure.

### 6.2 Relationship to convert-to-course

- **Convert** remains for “build full course from outline.”
- **Link** is for single-policy or single-article readings.

---

## Out of scope (explicit)

Do **not** promise on website or in this PRD unless spun out later:

| Capability | Rationale |
| --- | --- |
| **Real-time co-authoring** (Google Docs style) | High cost; comments + versions sufficient for v1 |
| **Native iOS/Android KB apps** | Web responsive first |
| **Multiple independent branded portals** per org (partner vs customer SKU) | Use multi-workspace / multi-org pattern instead |
| **10+ nesting levels** with separate “chapter” entity | Match product need first (collapse + tree) |
| **SCORM / assessments in Docs** | Stay in courses |
| **Learning paths** | Separate PRD |
| **Zoho MCP / external LLM marketplace** | Platform integrations PRD |

---

## Success metrics

| Metric | Target (6 mo post Phase 1) |
| --- | --- |
| Orgs with ≥1 **published** public doc | +40% vs baseline |
| Docs with verification policy set | 25% of active orgs |
| Mandatory read completion rate | >80% for assigned onboarding packs |
| Marketing: Docs feature page conversion | Track signup from `/docs` or equivalent |
| Support tickets “where is policy X” | Qualitative CS feedback |

---

## Technical notes

- **Schema:** New migration(s) after `0005_docs.sql` — do not edit `0005_docs` on merged branches; add `0006_doc_governance.sql` (names illustrative).
- **Tables (illustrative):** `org_doc_workflow`, `org_doc_verification`, `org_doc_mandatory_assignment`, `org_doc_acknowledgement`, `org_doc_review_comment`.
- **API:** Extend `apps/api/src/routes/docs`; dashboard `$features/docs`.
- **Public site:** `(org-site)/doc` + new help hub route.
- **Permissions:** Reuse `resolveDocAccess`; extend for draft/reviewer roles.
- **i18n:** `docs.*` keys; lesson strings unchanged.

---

## Marketing copy alignment

| Claim | When |
| --- | --- |
| “Central knowledge base with hierarchy and public help center” | **Now** |
| “Review before publish” | Phase 1 |
| “Keep content fresh with verification reminders” | Phase 1 |
| “Required reading with acknowledgement” | Phase 1 |
| “Collapsible help articles” | Phase 2 |
| “Export manuals to PDF” | Phase 3 |
| “AI-drafted SOPs” | Phase 5 |
| “Attach a doc as a lesson” | Phase 6 |

Website section **“Coming soon”** should list Phases 1–2 until shipped; then rotate.

---

## Open questions

1. **Student role:** Can students author docs or only read mandatory assignments?
2. **Approval:** Single reviewer vs any admin sufficient for v1?
3. **Mandatory read:** Surface only in LMS home, docs inbox, or both?
4. **Help hub URL:** Global `/help` vs per-org slug path.
5. **Pricing:** Gate governance to paid plans (recommended: yes).

---

## Appendix — Zoho KB feature checklist

| Zoho KB feature | ClassroomIO |
| --- | --- |
| Structured hierarchy | ✅ Shipped |
| Collaborative editor | ✅ Async + comments (not live) |
| Templates | ✅ Shipped |
| RBAC / sharing | ✅ Shipped (extend for draft) |
| Approval flow | ☐ Phase 1 |
| Verification reminders | ☐ Phase 1 |
| Mandatory read | ☐ Phase 1 |
| Version history | ✅ Shipped |
| Search & tags | ✅ Shipped (hub search Phase 4) |
| Collapsible reader sections | ☐ Phase 2 |
| Export PDF / HTML | ☐ Phase 3 |
| AI SOP generator | ☐ Phase 5 |
| Article as lesson | ☐ Phase 6 |
| Multi-portal branding | ○ Out of scope (workspaces) |
| Mobile apps | ○ Out of scope |

---

## Next steps

1. Product review: confirm phases, open questions, plan gates.
2. Design: reviewer inbox, mandatory read banner, collapsible block, help hub.
3. Engineering: `implementation-plan.md` with migration sketch and API contracts (create when Phase 1 is approved).
