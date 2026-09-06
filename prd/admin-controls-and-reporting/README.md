# Learner Usage & Lifecycle Management — Implementation Plan

> **UI behavior lives in [`UX.md`](./UX.md)** and the clickable prototype at [`prototypes/learner-lifecycle/`](../../prototypes/learner-lifecycle/), which is the UX source of truth — filtering interaction, loading states, selection, bulk confirmation, export menu, empty states, and accessibility. This file covers data, API, and sequencing.

## The actual job

The customer has **a lot of learners** and wants to answer one recurring question:

> *Who isn't using the platform, and who should we remove?*

That is a loop, not four features: **see usage → filter to the dormant → review the list → act on it in bulk → prove what happened.** Everything below is sequenced around that loop. The four questionnaire items map onto it unevenly:

| # | Ask | Role in the loop | Priority |
| --- | --- | --- | --- |
| 1 | Filter by last login / last activity / enrollment / completion | **See and filter** — the entry point | 🔴 Critical path |
| 2 | Bulk deactivate / delete / archive | **Act** — the payoff | 🔴 Critical path |
| 10 | Export reports | **Review and prove** — the sign-off step *and* the audit trail | 🟠 Critical path for the roster; secondary elsewhere |
| 4 | CSV/Excel import | Onboarding, not usage — orthogonal to this loop | 🟡 Last |

Two consequences worth stating up front, because they invert decisions in the earlier draft:

- **Scale is the design constraint, not a footnote.** An admin filtering 20 000 learners to "never logged in" gets thousands of rows. Tick-boxes and a 500-row cap do not solve their problem. Bulk-action-by-filter and uncapped export are **in scope**, not follow-ups.
- **The action is destructive and happens at volume.** Removing 400 people by accident is unrecoverable. Safety rails (archive-first, preview-before-apply, audit trail) are part of the feature, not polish.

---

## 0. Two findings from the code that shape everything

### Finding 1 — archiving frees a seat only if we change the seat count

`countActiveStudents` (`packages/db/src/queries/organization/organization.ts:675`) counts **every** student `organizationmember` row, with no status concept:

```ts
.where(and(eq(organizationmember.organizationId, orgId), eq(organizationmember.roleId, ROLE.STUDENT)))
```

It is the sole input to `assertStudentCapacityOrThrow` (`apps/api/src/services/organization/student-limit.ts`) and to the audience-limit banner. So unless this function learns about `status`, archiving 5 000 dormant learners frees **zero** seats and the whole feature misses its point.

**Decision (previously an open question, now settled by the use case):** `ARCHIVED` does not count against the plan limit; `DEACTIVATED` does. Archive becomes the meaningful "reclaim a seat" action, deactivate is the reversible "suspend access, keep the seat" action, and the difference is legible to an admin. `countActiveStudents` gains `ne(status, 'ARCHIVED')`, and the milestone-notification logic in `student-limit.ts` inherits it for free.

### Finding 2 — the access gate is already in the right place

`isUserCourseMemberOrOrgAdmin` (`packages/db/src/queries/group/group.ts:147`) requires **live org membership** for org-owned courses:

```ts
or(isNull(group.organizationId), isNotNull(orgMembership.id))
```

Good news: deleting an `organizationmember` row genuinely cuts course access today — removal is not cosmetic. And that same join is exactly where the `status = 'ACTIVE'` check belongs, so deactivate/archive revoke access through one change in one place rather than a scatter of new guards. Same for `isCourseTeamMemberOrOrgAdmin` just below it.

One gap to close while we are here: `deleteOrganizationAudienceMember` (`organization.ts:458`) deletes only the org-member row, leaving orphan `groupmember` rows behind. Access is correctly denied, but the enrolments linger — and if the same person is ever re-added, their old enrolments silently reappear. Clean them up inside the delete transaction.

---

## 1. Current state

| Capability | Today | File |
| --- | --- | --- |
| Last login | Computed, never filterable. `getLastLogin` / `getLastSeenForUserIds` used only on the single-user page. | `packages/db/src/queries/analytics/analytics.ts:45,78` |
| Last activity | No concept. Raw events in `analytics_page_event (org_id, user_id, occurred_at)`. | `packages/db/src/schema.ts:203` |
| Enrollment | Only *invite* status shown (`active/pending/expired/revoked`), derived in the service, not filterable. Course enrolment (`groupmember`) not surfaced. | `apps/api/src/utils/audience-member-status.ts` |
| Completion | Not surfaced. `course_completion_record.status` exists, indexed. | `packages/db/src/schema.ts:792` |
| Deactivate / archive | No such concept in the schema. | — |
| Bulk delete | Single-row only. Rows are multi-selectable; selection feeds "Assign courses" and nothing else. | `features/audience/pages/audience.svelte:83` |
| Roster export | Button exists, calls `alert('This feature is coming soon')`. | `routes/(app)/org/[slug]/audience/+page.svelte:16` |
| CSV import | Paste-a-list textarea, ~25 000 char cap. No file upload, preview, or per-row errors. | `features/audience/pages/import.svelte` |
| **Only working export in the product** | Course marks — CSV via `papaparse`, PDF via `jspdf` + `jspdf-autotable`. Both already dashboard deps. | `features/course/utils/marks-utils.ts:151,190` |

Other reporting surfaces with no export: org compliance, course analytics, org analytics, per-user analytics, course attendance. They matter — but not to this customer's loop, so they sequence last (§6).

---

## 2. Phase 1 — Foundation (blocks everything)

Migration `packages/db/src/migrations/<next>_learner_lifecycle.sql`; mirror into `packages/db/src/schema.ts`.

**Do not copy a migration number from this document.** Take the next free number at implementation time by
checking both `packages/db/src/migrations/` **and any in-flight branch that has already claimed one**. This
plan originally pinned `0015`; #1064 took it before the plan was even reviewed, which is the whole argument
for not pinning. Collisions are a recurring cost here (see `fix(db): renumber display_order migration after
0007 collision`, #1053) and need both the file and `packages/db/src/migrations/meta/_journal.json` repaired
by hand.

```sql
CREATE TYPE "ORGANIZATION_MEMBER_STATUS" AS ENUM ('ACTIVE', 'DEACTIVATED', 'ARCHIVED');

ALTER TABLE organizationmember
  ADD COLUMN status "ORGANIZATION_MEMBER_STATUS" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN status_changed_at timestamptz,
  ADD COLUMN status_changed_by uuid REFERENCES profile(id) ON DELETE SET NULL,
  ADD COLUMN last_active_at timestamptz;

CREATE INDEX idx_orgmember_org_role_status ON organizationmember (organization_id, role_id, status);
CREATE INDEX idx_orgmember_org_last_active ON organizationmember (organization_id, last_active_at);
CREATE INDEX idx_analytics_login_events_user_logged_in ON analytics_login_events (user_id, logged_in_at DESC);
```

- **`status` replaces nothing.** `verified` means "invite accepted", not "allowed in".
- **`last_active_at` is load-bearing at this scale.** Filtering and sorting a paginated list of 20 000 learners against a raw event table will not hold up. Maintained by `insertPageEvents` (`analytics.ts:427`) on ingest, reconciled nightly in the existing maintenance worker (`apps/jobs/src/workers/maintenance.ts`) from `analytics_page_event` and `lesson_completion.updated_at`. Backfill both in the migration.
- **Last login stays a lateral** `MAX(logged_in_at)` against `analytics_login_events` — cheap with the new index. `session.updated_at` is a fallback inside `getLastLogin`, but sessions are pruned on expiry, so login events are the durable source and the only thing we filter on.
- **Enforce status in the access gate** — add `status = 'ACTIVE'` to the org-membership join in `isUserCourseMemberOrOrgAdmin` and `isCourseTeamMemberOrOrgAdmin` (Finding 2), and treat non-`ACTIVE` as not-a-member in `getAccountData` (`apps/api/src/services/account/profile.ts`) and `orgMemberMiddleware` / `orgTeamMemberMiddleware`.
- **Exclude `ARCHIVED` from `countActiveStudents`** (Finding 1).

**Audit trail.** Bulk lifecycle changes need to be answerable six months later ("who removed these 400 people, and when?"). `status_changed_by` / `status_changed_at` cover the current state; for history, add `organization_member_audit` following the existing `organizationInviteAudit` pattern (`schema.ts:1477`) — one row per member per action, with actor, action, reason, and the filter snapshot when the action came from a filter.

---

## 3. Phase 2 — See and filter (the entry point)

### Validation — `packages/utils/src/validation/organization/audience.ts`

Extend `ZGetAudienceQuery`, keeping every existing field and default so current URLs stay valid:

```ts
export const AudienceMemberStatus = z.enum(['ACTIVE', 'DEACTIVATED', 'ARCHIVED']);
export const AudienceInviteStatus = z.enum(['active', 'pending', 'expired', 'revoked']);
export const AudienceEnrollment = z.enum(['enrolled', 'not_enrolled']);
export const AudienceCompletion = z.enum(['not_started', 'in_progress', 'completed']);
export const AudienceActivityWindow = z.enum(['7d', '30d', '90d', '180d', 'never']);
export const AudienceSortBy = z.enum(['createdAt', 'name', 'email', 'lastLoginAt', 'lastActiveAt']);
```

Added as optional `status`, `inviteStatus`, `enrollment`, `completion`, `lastLoginBefore`, `lastActiveBefore`. Note the naming: this customer thinks in **"hasn't logged in for 90 days"**, not "logged in within 90 days" — the windows are *staleness* thresholds, and getting the polarity right in the schema keeps it right in the UI. Default `status` to `'ACTIVE'` server-side so archived members drop out of the default view. `'never'` means no login event at all.

### Query — `packages/db/src/queries/organization/organization.ts`

Rewrite `getOrganizationAudience` (line 740). Same shape out, new predicates in:

- `lastLoginAt` — `LEFT JOIN LATERAL (SELECT MAX(logged_in_at) … WHERE user_id = profile.id)`.
- `lastActiveAt` — read `organizationmember.last_active_at` directly.
- `inviteStatus` — join the latest `organization_invite` per email so status filters **in SQL**; keep `deriveAudienceMemberStatus` for the final mapping so one function still owns the rule.
- `enrollment` — `EXISTS (SELECT 1 FROM groupmember gm JOIN "group" g ON g.id = gm.group_id WHERE gm.profile_id = profile.id AND g.organization_id = :orgId)`.
- `completion` — aggregate `course_completion_record` per profile scoped to this org's courses. Define the
  **per-course** state first, then fold it into **one exclusive learner state by precedence**, because the
  naive phrasing is not exclusive: "every record is completed" is vacuously true for a learner with no
  records at all, so they would match `completed` and `not_started` simultaneously.

  Per course: `completed` when a record exists with `status = 'completed'`; `in_progress` when a record
  exists that is started but not completed; otherwise `not_started` (including no record).

  Per learner, first match wins:
  1. `not_started` — enrolled in ≥1 course and **no** course is `completed` or `in_progress`.
  2. `completed` — enrolled in ≥1 course and **every** enrolled course is `completed`.
  3. `in_progress` — everything else with ≥1 enrolment.

  Learners with no enrolment at all match none of the three and are reachable only via
  `enrollment=not_enrolled`. Encode this precedence in SQL as a single `CASE`, not three independent
  predicates, so the buckets provably partition the population and the view counts sum to the total.

New item fields: `lastLoginAt`, `lastActiveAt`, `status`, `enrolledCount`, `completedCount`, `progressPercent`. The count query and the row query must keep sharing one `whereClause`, as they do today.

**Verify the plan on a seeded 20 000-row org before shipping.** Two lateral joins and two `EXISTS` subqueries per page is the kind of thing that is fine at 200 rows and not at 20 000. If the count query is the bottleneck, an approximate count is an acceptable trade **for the paginated list's own "N learners" display only** — measure first.

**Approximation must never reach an authoritative count.** `GET /organization/audience/view-counts`, the
"Select all N matching" affordance, the confirmation preview, and `expectedCount` are all exact, computed
with the same `whereClause` as the action itself. An approximate `expectedCount` would either understate the
blast radius the admin approved or fail the server's live-count check and `409` a legitimate action.

No new route: `organization.ts:263` already validates with `ZGetAudienceQuery`, so widening the schema suffices.

### Frontend

- **Saved dormancy views are the headline feature.** Because filters live in URL params, a set of one-click views is nearly free and is what the admin actually reaches for: **All learners · Never logged in · Inactive 90+ days · Inactive 180+ days · Enrolled, never started**. They ship as a single quiet view-switcher `DropdownMenu` beside search — counts muted inside the menu, not as coloured chips across the page — backed by one `GET /organization/audience/view-counts` call. This turns a five-field filter form into a one-click workflow without adding noise to the page. See `UX.md` §2.1.
- **All view state must live in the URL — a requirement, not a preference.** View, filters, sort key, sort order, search and page are query parameters, and the URL is the single source of truth: components render from it and navigate to change it, never keeping a second copy in local state. The workflow depends on it — a filtered view is the link an admin sends for sign-off before removing 3,000 people, back/forward move between filter states, a refresh survives a re-login, and the filter recorded on an audit row is replayable. Extend the existing `getAudienceQueryFromSearchParams` / `getAudienceSearchParams` pair in `features/org/utils/audience-query-utils.ts` rather than adding a parallel scheme; omit defaults from the URL so a plain `/audience` stays clean, and fall back to defaults on malformed params so a truncated link still loads. Selection is the one exception — it stays in memory, so a shared link never carries someone else's pending destructive selection. Full mechanics in `UX.md` §2.8.
- `features/org/utils/types.ts` — extend `OrganizationAudienceQuery` and the sort keys. No new types in `.svelte.ts`.
- **New** `features/audience/components/audience-filter-popover.svelte`, modelled on `features/course/components/course-filter-popover.svelte`: `Popover`, outline `Button` + `FilterIcon` trigger, active-filter dot, "Clear all" link. Body composed of `Field.Set` / `Field.Legend` / `Field.Group`, `RadioGroup` for the staleness windows, `Checkbox` for status. Keep `SortPopover` beside it — do not overload it.
- `audience-table-toolbar.svelte` — presets row, then search + filter + sort. Below, a chips row (`@cio/ui/custom/chip`) showing active filters with an ×.
- `audience-table.svelte` / `audience-member-row.svelte` — add **Last login**, **Last activity**, **Enrollment** (`3 / 5`), **Progress** columns. Sort by last login and last activity is as important as filtering: it answers "show me the worst offenders first". Progress uses `@cio/ui/custom/percent-ring-progress`. Eight columns needs `overflow-x-auto` on the table wrapper; the page body must never scroll horizontally.
- Mount `ScrollToTop` (`@cio/ui/custom/scroll-to-top`, `label={$t('common.scroll_to_top')}`) on the audience route.
- Filtered-empty state: `Empty` with a "Clear filters" action, distinct from the existing `audience.no_audience` state.

---

## 4. Phase 3 — Act in bulk (the payoff)

### Two selection modes, because tick-boxes do not scale

```ts
const ZBulkAudienceTarget = z.discriminatedUnion('mode', [
  z.object({ mode: z.literal('ids'), memberIds: z.array(z.number().int().positive()).min(1).max(500) }),
  z.object({
    mode: z.literal('filter'),
    filter: ZGetAudienceQuery.omit({ page: true, limit: true, sortBy: true, sortOrder: true }),
    // exact count AND a checksum of the ordered member ids the admin was shown
    expectedCount: z.number().int().positive(),
    expectedTargetHash: z.string().length(64)
  })
]);

export const ZBulkAudienceAction = z.object({
  target: ZBulkAudienceTarget,
  action: z.enum(['deactivate', 'reactivate', 'archive', 'unarchive', 'delete']),
  reason: z.string().trim().max(500).optional()
});
```

- **`ids`** — explicit tick-box selection on the current page, capped at 500. Unchanged from what the UI does today.
- **`filter`** — "apply to all N learners matching these filters". This is the mode this customer needs.

  **A matching count does not prove a matching target.** If one learner logs in and another goes dormant
  between preview and apply, the count is identical and the *set* is not — the admin would silently act on
  someone they never reviewed. So the preview returns both the exact `expectedCount` **and**
  `expectedTargetHash`, a SHA-256 over the sorted member ids in the matched set. The action re-derives both
  inside the transaction and rejects with `409` if either differs, returning the new count so the UI can
  re-prompt. The hash is what makes the guarantee real; the count is what makes the error message readable.

### Service — `apps/api/src/services/organization/audience.ts`

`applyBulkAudienceAction(orgId, data, actorProfileId)`:

1. One `db.transaction` at this boundary.
2. Resolve the target to member ids inside the transaction — for `filter` mode, run the same `whereClause` builder the list uses, so preview and apply cannot diverge. Re-check **both** `expectedCount` and `expectedTargetHash`; mismatch on either is a `409`, never a silent proceed.
3. Reject any member that is not `roleId = STUDENT` in this org — authorization validated before any write.
4. Apply the status change, or remove the membership (also clearing the orphan `groupmember` rows, per
   Finding 2).
5. For `delete` and `deactivate`, revoke active invites via the existing `revokeActiveOrganizationInvitesByEmails`.
6. Write `organization_member_audit` rows with the actor, action, reason, and filter snapshot.
7. Commit, **then** fire side effects (notifications, cache invalidation).
8. Return the contract below. `AppError` with `ORG_AUDIENCE_BULK_*` codes.

**One response contract covers both the synchronous and the queued path**, so the client has a single branch
rather than guessing from the status code:

```ts
type BulkAudienceActionResult =
  | { mode: 'completed'; requested: number; succeeded: number; failed: { memberId: number; reason: string }[] }
  | { mode: 'queued'; jobId: string; requested: number };
```

- **Threshold:** resolve the target inside the transaction, then take the queued path when the resolved
  target exceeds **1 000 members**. The threshold is on the *resolved* count, not the requested one, so
  `filter` mode cannot sneak past it. Define it as a single exported constant shared by API and dashboard.
- **Queued path:** a new `audience-bulk-action` job in `packages/jobs`, following the `enqueue/emails.ts` +
  `apps/jobs/src/workers` pattern, chunking into transactional batches. `GET /organization/audience/bulk-action/:jobId`
  returns `{ state: 'queued' | 'running' | 'succeeded' | 'failed'; processed: number; total: number; result?: ... }`
  where `result` on a terminal state is **the same `mode: 'completed'` payload** the synchronous path returns.
  The UI renders the identical partial-failure summary either way.
- At this customer's scale the queued path is not optional — a 12 000-row archive is not an HTTP request.

**`delete` means "remove from this organization", not "erase this person".** It removes `organizationmember`
and `groupmember` rows, revokes invites and writes audit rows. It deliberately leaves the `profile`, analytics
events, submissions and completion records intact — the person may be a member of other orgs, and their
submissions are referenced by other people's records. Say so in the confirmation copy and in the docs, so
nobody reads it as a GDPR erasure. Account-level erasure is a different feature with a different design
(`prd/account-deletion`); note that `deidentifyPageEventsForUser` anonymises page events only and is currently
unused, so it is not a shortcut to erasure either. If this customer actually needs erasure, that is open
question 1 and it routes elsewhere.

**Queries** — `bulkUpdateOrganizationMemberStatus(orgId, memberIds, status, actorProfileId, tx?)`, `bulkDeleteOrganizationAudienceMembers(orgId, memberIds, tx?)`, `deleteGroupMembershipsForOrgMembers(orgId, profileIds, tx?)`. All take an optional `DbOrTxClient`, use it for every read and write, and never open a nested transaction when one is supplied. `catch` blocks log `console.error('<fn> error:', error)`.

**Route** — `POST /organization/audience/bulk-action`, `authMiddleware, orgAdminMiddleware, zValidator('json', ZBulkAudienceAction)`, `handleError` in the catch, single return type, on the existing `organizationRouter`.

### Safety rails — part of the feature, not polish

- **Archive-first.** Order the menu Archive → Deactivate → Delete, with Archive as the default emphasis. Archive is reversible, frees the seat (Finding 1), and preserves history; it is the right answer for almost every "remove them" instinct. Copy should say so.
- **Delete is gated, and the server owns the gate.** Permanent delete requires **every** resolved member to
  already be `ARCHIVED`; the service rejects the batch with `ORG_AUDIENCE_DELETE_NOT_ARCHIVED` otherwise, and
  the check runs inside the transaction on the resolved set. Type-the-count confirmation is a **client-side
  addition on top**, never an alternative to it — an "either/or" reading lets the UI permit a deletion the
  service will refuse, or worse, lets typed confirmation stand in for the archive requirement. Archive first,
  then delete, is the only path.
- **Preview before apply.** For `filter` mode, the confirmation dialog states the exact count, shows a sample of affected learners, and offers **"Export this list first"** (reusing Phase 4) so the admin can circulate it for sign-off. This is the step that makes the loop safe, and it is the natural place export earns its keep.
- **Guard the obvious mistake.** Never let "never logged in" silently sweep up learners invited in the last N days. Exclude recent joiners by default with a visible, overridable toggle.
- **Undo acts on the exact set that succeeded, never on the filter.** Re-running a filter to undo would hit a
  different population — the action itself just changed who matches. The service persists the succeeded member
  ids and returns an `undoToken` (opaque, single-use, expiring in ~15 minutes, scoped to actor and org) on
  every reversible action. `POST /organization/audience/bulk-action/undo` takes that token and applies the
  inverse status change to precisely those ids. Archive and deactivate are reversible; delete returns no
  token, and the dialog says so.

### Frontend

Request/success types in `features/org/utils/types.ts`; `bulkAudienceAction(fields)` on `org.svelte.ts` via `this.execute<BulkAudienceActionRequest>` with client-side zod parse and translation-key snackbars. Replace the ad-hoc selection `<div>` in `audience-table-toolbar.svelte` with a bulk bar: selected count, a **"Select all N matching"** affordance that switches to `filter` mode (the piece that makes this usable at scale), "Assign courses" (existing), and a `DropdownMenu` of lifecycle actions with the destructive item styled like the row menu (`ui:text-destructive focus:ui:text-destructive`).

Generalise `audience-delete-confirmation.svelte` into `audience-bulk-confirmation.svelte` — a `Dialog` carrying the count, the sample, the reason field, the export link, and type-to-confirm for `delete`. Reset in `onOpenChange`, never in an `$effect` keyed to `!open`. Deactivated/archived rows render muted with a status `Badge` (extend `statusBadgeVariant` / `statusLabelKey`). Clear selection explicitly after a successful action.

`testId`s: `audience-bulk-actions`, `audience-bulk-select-all-matching`, `audience-bulk-confirm`.

---

## 5. Phase 4 — Export the roster (review, sign-off, proof)

Export is the **review step of the loop**, not a reporting nicety: the admin exports the dormant list, circulates it, then acts. Build it once as a shared capability so the other five surfaces can adopt it later without a rewrite.

### Shared export model — `packages/utils/src/export/`

Framework-agnostic, no Svelte imports, so the API can reuse it for queued/emailed exports:

```ts
export interface ExportColumn<Row> {
  key: string;
  header: string;      // caller passes an already-translated string
  value: (row: Row) => string | number | null;
}

export interface ExportDocument<Row> {
  filename: string;    // without extension
  title: string;       // PDF header
  subtitle?: string;   // e.g. "Acme · inactive 90+ days · 3 214 learners"
  columns: ExportColumn<Row>[];
  rows: Row[];
}
```

Headers arrive translated — the utils package does not own copy. Formatting lives in the `value` callback so CSV and PDF cannot drift.

### Shared renderers — `features/ui/export/`

Lifted from `features/course/utils/marks-utils.ts:151,190` and generalised: `downloadCsv(doc)` (`Papa.unparse` + blob), `downloadPdf(doc)` (dynamic `import('jspdf')` / `import('jspdf-autotable')`, landscape), and `ExportMenu.svelte` — an outline `Button` with `DownloadIcon` and a `loading` state opening a `DropdownMenu` of CSV / PDF, dropped into `Page.Action`. Props: `document` or `() => Promise<ExportDocument>`, `disabled`, `testId`. **Migrate the marks page onto it and delete the one-off functions** — that proves the abstraction against a working report before anything else adopts it.

### Getting the full dataset out

The page holds 20 rows; the export needs all of them, and "all of them" here may be tens of thousands. A JSON-to-client round trip with a 5 000-row cap does not serve this customer.

**`GET /organization/audience/export.csv` streams `text/csv` directly from the API** — keyset-paginated
internally, `authMiddleware, orgTeamMemberMiddleware`. No row cap, constant memory, and the browser gets a
real download. This is deliberately **not** an RPC data route (it returns a file, not a typed JSON envelope),
so the single-return-type rule does not apply; it lives beside the RPC routes as a download endpoint.

**Three export scopes, three explicit request shapes** — a filter-only endpoint cannot express "the 42 rows I
ticked", and silently widening that to the whole filtered set would hand someone a different list than the
one they asked for:

| Scope | Request | Notes |
| --- | --- | --- |
| Selected | `memberIds` (repeated query param, capped at 500) | Takes precedence over any filter params present |
| Filtered | the list's filter params, minus pagination | The current view |
| All | no filter params | The whole roster |

Precedence is server-side and explicit: if `memberIds` is present, filters are ignored entirely rather than
intersected. Above the 500-id cap the UI must offer the filtered scope instead — that is exactly the case
where the admin is in `filter` selection mode anyway, so the same filter is already to hand. The
confirmation dialog's "export this list first" uses the scope matching the pending action, so the exported
list and the acted-on list are the same list.

PDF stays client-side and **is** capped — a 20 000-row PDF helps nobody. Offer PDF only below ~2 000 rows and say why in the menu.

### Columns

Name, email, member status, invite status, joined, **last login**, **last activity**, courses enrolled, courses completed, overall progress %, average grade, certificates earned. Honours the active filters; exports only the selection when rows are ticked. The three bolded columns are the ones this customer is actually reading.

`getAudienceExportRows(orgId, query)` batches the per-profile progress lookups — do **not** `Promise.all` a per-row query across 20 000 rows.

---

## 6. Phase 5+ — Everything else

Sequenced behind the loop, in the order they help this customer:

| Phase | Scope | Why here |
| --- | --- | --- |
| 5 | **Per-user progress export** (`audience/[profileId]`) | The drill-down from a flagged learner. Reuses the existing analytics endpoint — cheap once `ExportMenu` exists. |
| 6 | **Course analytics export** | Per-student progress table answers "is this cohort using it" — the same question, one level down. Endpoint already returns `students[]`. |
| 7 | **CSV/Excel import** (§7) | Onboarding, not usage. Real, but orthogonal to the loop. |
| 8 | **Compliance export** | Genuinely valuable and the biggest gap for a *different* customer. Not this one. Endpoint already returns the learner list. |
| 9 | **Attendance and org analytics export** | Lowest leverage here. Org analytics is charts — export the underlying series as CSV, the summary as PDF; do not force funnel and geography into one table. |
| Later | Queued export + emailed link; `.xlsx` both directions | See §7 and §8. |

---

## 7. CSV import (Phase 7)

**Format:** UTF-8 `.csv`, header row required — `email` (required, `z.email()`, lower-cased, de-duplicated in-file), `name` (optional, falls back to the email local-part as `getOrganizationAudience` already does), `courses` (optional, comma-separated titles or ids; unmatched values become row warnings, not failures). Unknown columns ignored with a warning. Ship a downloadable `audience-template.csv`.

**Limits:** 1 000 rows per import (a new explicit `recipients` array on `ZImportAudienceMembers`, replacing the implicit 25 000-character cap on `recipientCsv`, which stays for back-compat); 5 MB file via `FileDropZone`'s `maxFileSize`; and the org's audience plan limit enforced server-side — over the limit gives a partial import with per-row reasons, not a blanket 4xx.

**Flow:** rework `features/audience/pages/import.svelte` into upload → preview → result. `FileDropZone` (`@cio/ui/custom/file-drop-zone`, `accept=".csv,text/csv"`) beside the existing paste box; parse with `papaparse` in a new `features/audience/utils/audience-import-utils.ts` (pure functions, all data passed in); a preview `Table` bucketing rows into *ready* / *already in audience* / *invalid with reason*; then submit to the existing `POST /organization/audience/import` extended to accept `recipients`; then a result screen with counts and a "Download error rows" CSV. Over 200 rows, enqueue via a new `audience-import` job following the `enqueue/emails.ts` pattern.

While the file is open, refactor its raw `Label` + `RadioGroup` blocks into `Field.Group` / `Field.Set` / `Field.Legend` / `Field.Separator`, and either wire up or delete the commented-out `sendEmail` checkbox.

---

## 8. `.xlsx` — one decision, both directions

Nothing in the repo reads or writes spreadsheets; `.xlsx` is the only item here that adds a dependency (`exceljs` or `xlsx`). CSV opens natively in Excel, and this customer's workflow is filter → export → circulate → act, which CSV serves fully.

**Recommendation: CSV + PDF at launch, no new dependency.** If `.xlsx` is contractually required, add `exceljs` and a third renderer in `features/ui/export/` — `ExportDocument` is already the right shape, so it is purely additive — and the same library covers import parsing. Decide both directions at once.

---

## 9. Cross-cutting requirements

- **URL is the source of truth for view state.** View, filters, sort, search and page are query parameters — never component-local state mirrored behind the URL. Selection is the deliberate exception. See `UX.md` §2.8.
- **Translations.** All strings in `apps/dashboard/src/lib/utils/translations/en.json` (`audience.views.*`, `audience.filter.*`, `audience.bulk.*`, `audience.import.*`, `export.*`), then `cd apps/dashboard && pnpm translate`, then verify every `{}` placeholder survived before staging. Snackbars take translation keys directly. Export headers are passed in translated by the caller.
- **Design system.** `Page.*` shells with `ExportMenu` in `Page.Action`; `@cio/ui/custom/*-field` wrappers for standard controls; `Field.*` primitives for the grouped filter and import forms; no native `<input>`/`<label>`; icon-only buttons `variant="secondary"`; colour utilities carry the `ui:` prefix in dashboard code including inside variants (`hover:ui:bg-muted`, `focus:ui:text-destructive`), layout utilities do not.
- **Reactive collections.** Selection already uses `SvelteSet` — keep it, unwrapped by `$state()`. The new "all N matching" mode is a separate `$state` flag, not a set of 12 000 ids.
- **UI package.** Anything landing in `packages/ui/src` gets documented in `packages/ui/README.md` and a Storybook story under `packages/storybook/src` covering its variants, in the same change. `ExportMenu` is dashboard-level (`features/ui/export/`) unless it needs to be shared beyond the dashboard.
- **Test hooks.** `audience-view-switcher`, `audience-filter-trigger`, `audience-bulk-actions`, `audience-bulk-select-all-matching`, `audience-bulk-confirm`, `export-menu-trigger`. Register in `e2e/README.md`.
- **Tests.** Non-negotiable given the blast radius: a db-backed integration test proving a failed bulk action rolls back entirely; a test that `filter`-mode resolution and list-mode `whereClause` return identical member sets; a test that `expectedCount` drift produces a `409`; a test that `countActiveStudents` excludes `ARCHIVED` and includes `DEACTIVATED`. Export column formatters are pure — unit-test them.

---

## 10. Sequencing

| Phase | Scope | Depends on |
| --- | --- | --- |
| 1 | Schema, `last_active_at` backfill + maintenance, status enforcement in the access gate, `countActiveStudents` change, audit table | — |
| 2 | Filters, saved dormancy views, new columns, sort by last login/activity | 1 |
| 3 | Bulk actions — ids + filter modes, queued above 1 000, safety rails, audit rows | 1, 2 (filter mode reuses the `whereClause` builder) |
| 4 | Shared export module + `ExportMenu`, migrate marks onto it, streaming roster export | — (can start in parallel with 1); the confirmation dialog's "export this list first" needs 3 |
| 5+ | Per-user, course analytics, import, compliance, attendance, org analytics | 4 |

Phases 1 and 4 touch nothing in common and can run in parallel. **Phases 1–4 are the deliverable this customer asked for**; everything after is roadmap.

---

## 11. Open questions

1. **What does "remove from the platform" mean to them — reclaim seats, revoke access, or erase data?** The plan assumes seats: archive frees a seat, keeps history, is reversible. If they mean erasure (GDPR-style), that is a different feature and should route through the existing `prd/account-deletion` work and the `deidentifyPageEventsForUser` path rather than through bulk delete.
2. **How many learners, and on what plan?** The 20 000-row assumption drives the streaming export, the queued bulk action, and the query-plan verification. If it is 2 000, phases 3 and 4 get materially simpler and cheaper.
3. **Does "activity" mean logins, or real engagement?** `last_active_at` from page events counts opening a page. If they want "made progress" (lesson completions, submissions), that is a different signal and should be a separate column and filter rather than a redefinition — some admins want both.
4. **Is there an approval step?** If removals need sign-off, the export-then-act flow in §4 is enough. If it needs to be enforced in-product (propose → approve → execute), say so now — it changes the bulk-action model from one call to a stateful review queue.
5. **Completion at member level** — "completed" = *all* enrolled courses, or *any*? The plan assumes all; per-course completion filtering belongs on the course people page.
