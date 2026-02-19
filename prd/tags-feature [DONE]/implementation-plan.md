# Tags Feature Implementation Plan (v1)

## Scope Lock (From Product Decisions)
1. Tags are organization-scoped only (`organization_id` required everywhere).
2. Tag lifecycle (create/edit/archive/restore) is `ROLE.ADMIN` only.
3. Teachers can assign/unassign existing tags on managed courses.
4. Students are filter-only in v1.
5. Grouped/faceted tags are required.
6. Every tag must belong to a group (default fallback group: `General`).
7. `SINGLE_SELECT` groups auto-replace conflicting tag assignments.
8. Public org `/courses` route must support grouped tag filtering.
9. Public filter groups are admin-controlled.

## Delivery Phases
1. Phase A: Data model + validation + DB queries.
2. Phase B: API services/routes + existing endpoint extensions.
3. Phase C: Admin dashboard (tag groups/tags management + course tagging).
4. Phase D: Student discovery integration (LMS + public `/courses`).
5. Phase E: Analytics events + hardening + rollout.

## Ticket Breakdown

| ID | Area | Task | Key Files | Dependencies | Done When |
| --- | --- | --- | --- | --- | --- |
| TG-A1 | DB | Add `tag_group` schema | `packages/db/src/schema.ts` | None | Table has org scoping, status, filter mode, public flag, indexes |
| TG-A2 | DB | Add `tag` schema with required `group_id` | `packages/db/src/schema.ts` | TG-A1 | Tag row cannot exist without group; org constraints enforced |
| TG-A3 | DB | Add `tag_assignment` schema | `packages/db/src/schema.ts` | TG-A2 | Unique and indexed assignment table exists |
| TG-A4 | DB | Add DB constraints for same-org integrity | migration + schema constraints | TG-A1,TG-A2,TG-A3 | Cross-org assignment impossible at DB/service level |
| TG-A5 | DB | Add `SINGLE_SELECT` enforcement strategy | query/service logic (+ optional constraint helper) | TG-A3 | New assignment replaces conflicting assignment in same group |
| TG-A6 | DB | Seed default `General` group per org (on-demand or migration-safe bootstrap) | `packages/db/src/scripts/*` or service bootstrap | TG-A1 | Existing orgs can create/use tags immediately without missing group errors |
| TG-A7 | Utils | Add validation schemas for groups/tags/filter params (including fixed 10-color palette validation) | `packages/utils/src/validation/tag/tag.ts` + exports | None | Zod schemas cover CRUD + filter query + assignment payloads and restrict tag color to allowed palette |
| TG-A8 | DB Queries | Implement group query module | `packages/db/src/queries/tag/tag.ts` | TG-A1,TG-A7 | CRUD/list/archive for tag groups works |
| TG-A9 | DB Queries | Implement tag query module | `packages/db/src/queries/tag/tag.ts` | TG-A2,TG-A7 | CRUD/list/archive for tags works |
| TG-A10 | DB Queries | Implement assignment query module | `packages/db/src/queries/tag/tag.ts` | TG-A3,TG-A5 | Course tag set/replace/list works with group rules |
| TG-B1 | API | Add tag services | `apps/api/src/services/tag.ts` | TG-A8,TG-A9,TG-A10 | Service layer enforces role and org policies |
| TG-B2 | API | Add routes under organization/course | `apps/api/src/routes/tag/tag.ts` + index exports | TG-B1 | Endpoints compile and respond with standard success/error shape |
| TG-B3 | API | Register tag routes in app/router tree | `apps/api/src/routes/organization/index.ts`, `apps/api/src/app.ts` | TG-B2 | Routes are reachable from RPC client |
| TG-B4 | API | Extend `GET /organization/courses/public` with grouped tag filters | `apps/api/src/routes/organization/organization.ts`, service/query layer | TG-B1 | Public published courses can be filtered by grouped tags |
| TG-B5 | API | Extend org/LMS course list endpoints to return tags/group metadata needed by UI | `apps/api/src/services/organization.ts`, `packages/db/src/queries/course/course.ts` | TG-A10 | Org courses/explore/mylearning payloads include tag context |
| TG-B6 | API | Add analytics event hooks for filter usage and tag assignment | services where filters/assignments are handled | TG-B1 | Events captured for future personalization baseline |
| TG-C1 | Dashboard Types | Add tag feature request/response types | `apps/dashboard/src/lib/features/tag/utils/types.ts` | TG-B2 | Strongly typed RPC request/response types available |
| TG-C2 | Dashboard API | Add tag API class | `apps/dashboard/src/lib/features/tag/api/tag.svelte.ts` | TG-C1 | CRUD + assign + filter helpers available |
| TG-C3 | Admin UI | Add top-level org tags page + create/edit modal with 10-color popover swatch selector | `apps/dashboard/src/routes/org/[slug]/tags/+page.server.ts`, `+page.svelte` | TG-C2 | Admin can manage groups/tags from UI and select only allowed palette colors |
| TG-C4 | Navigation | Add Tags entry to org sidebar navigation (same level as Courses/Media) | `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts` | TG-C3 | Tags page discoverable in org sidebar |
| TG-C5 | Course Settings | Add tag selector in course settings | `apps/dashboard/src/lib/features/course/pages/settings.svelte` + shared tag component | TG-C2 | Admin/teacher can assign/unassign tags on a course |
| TG-C6 | Admin Tags Table | Add `Total Courses` deep-link column | admin tags page/components | TG-C3,TG-B5 | Clicking count routes to `/org/[slug]/courses?tags=<tagSlug>` |
| TG-C7 | Org Courses | Add grouped tag filters, URL hydration, and bulk actions in org courses view | `apps/dashboard/src/routes/org/[slug]/courses/+page.svelte`, `apps/dashboard/src/lib/features/course/pages/courses.svelte` | TG-C5,TG-C6 | Catalog filters by groups/tags, supports bulk assignment, and honors `tags` query param on load |
| TG-D1 | LMS Explore | Add grouped tag filtering in explore | `apps/dashboard/src/lib/features/lms/pages/explore.svelte` | TG-B5 | Student can filter explore results by facet groups |
| TG-D2 | LMS My Learning | Add grouped tag filtering in my learning | `apps/dashboard/src/lib/features/lms/pages/mylearning.svelte` | TG-B5 | Student can filter enrolled/in-progress/completed by tags |
| TG-D3 | Public Route | Add public org `/courses` route with faceted filters | new route files under `apps/dashboard/src/routes/courses/+*` or org-site-aware equivalent | TG-B4 | Public org catalog exists and filters published courses by groups/tags |
| TG-D4 | Landing Integration | Add link from landing page courses section to `/courses` | `apps/dashboard/src/lib/features/org/components/landing-page/landing-page.svelte` | TG-D3 | “View all courses” navigates to filterable `/courses` catalog |
| TG-E1 | Copy/Translations | Add i18n keys for tag/group/filter UI | `apps/dashboard/src/lib/utils/translations/en.json` (+ other locales later) | TG-C3 | No hardcoded strings in new UI |
| TG-E2 | Observability | Add logs/metrics for failed assignments and filter query performance | API services/routes | TG-B2 | Error + perf signals visible in logs/monitoring |
| TG-E3 | Access Tests | Add auth/role tests for admin-only lifecycle and teacher assignment | API tests | TG-B2 | Unauthorized role actions return expected 403 |
| TG-E4 | Regression Tests | Add query/service tests for org isolation and single-select replacement | DB/API tests | TG-A10,TG-B1 | Cross-org and group conflict regressions prevented |
| TG-E5 | Rollout | Feature flag and staged rollout plan | env/config + UI guards | TG-D3 | Can enable per environment with rollback path |

## API Contract Additions (Target)

### Tag Groups
1. `GET /organization/tag-groups`
2. `POST /organization/tag-groups`
3. `PUT /organization/tag-groups/:groupId`
4. `DELETE /organization/tag-groups/:groupId`

### Tags
1. `GET /organization/tags`
2. `POST /organization/tags`
3. `PUT /organization/tags/:tagId`
4. `DELETE /organization/tags/:tagId`
5. `POST /organization/tags/:tagId/restore`

### Course Tag Assignment
1. `GET /course/:courseId/tags`
2. `PUT /course/:courseId/tags`

### Public Course Catalog Filtering
1. Extend `GET /organization/courses/public` query:
   - `groupSlug[]`
   - `tagSlug[]`
   - or grouped map style (`filters[difficulty]=beginner,advanced`)

## Public `/courses` Route Notes
1. Route should be org-site aware (same host behavior as current landing page and `/course/[slug]` flow).
2. Only published and active courses are shown.
3. Only groups with `is_public_filterable=true` are displayed as filter facets.
4. `INTERNAL` tags are never shown publicly.
5. URL query params should reflect selected filters for shareable links.

## Data/Behavior Rules to Enforce
1. `tag.group_id` is mandatory.
2. All group/tag/assignment writes must check org ownership.
3. Teacher actions:
   - allowed: assign/unassign existing tags on managed courses.
   - not allowed: group/tag lifecycle changes.
4. `SINGLE_SELECT` conflict resolution:
   - Replace old assignment with new one in same group and target.
5. Archive behavior:
   - archived groups/tags are not assignable.
   - historical rendering is allowed with muted appearance.
6. Admin tags deep-link behavior:
   - `Total Courses` click on a tag navigates to `/org/[slug]/courses?tags=<tagSlug>`.
   - courses page hydrates query and applies tag filter automatically.
7. Tag color rule:
   - create/edit must use popover swatch selector with exactly 10 palette colors.
   - API validation rejects colors outside the allowed palette.

## Acceptance Criteria by Phase

### Phase A Accept
1. Migration applies cleanly.
2. Existing orgs can create first tag without manual DB intervention.
3. Cross-org assignment attempts fail.

### Phase B Accept
1. Admin lifecycle endpoints enforce `orgAdminMiddleware`.
2. Teacher cannot create/edit/archive tags or groups.
3. Course assignment endpoint supports teacher (course team member) flow.

### Phase C Accept
1. Admin can create groups and tags from `/org/[slug]/tags`.
2. Course settings can assign tags with single-select auto-replacement.
3. Admin tags table shows clickable `Total Courses` per tag.
4. Clicking `Total Courses` opens admin courses with `tags` query param applied.
5. Org courses page can filter by grouped facets and hydrated URL query filters.

### Phase D Accept
1. LMS Explore and My Learning both support grouped filters.
2. Public `/courses` page exists and supports faceted filtering.
3. Public filters hide non-public groups and `INTERNAL` tags.

### Phase E Accept
1. Filter usage events are recorded.
2. P95 latency targets for tag endpoints and filtered catalogs are met.
3. Rollback path documented and tested.

## Verification Commands
1. `pnpm --filter @cio/db build`
2. `pnpm --filter @cio/utils build`
3. `pnpm --filter @cio/api build`
4. `pnpm --filter @cio/dashboard build`
5. Run relevant unit/integration tests for DB queries and API routes.

## Suggested First Sprint Slice
1. TG-A1 to TG-A10
2. TG-B1 to TG-B3
3. TG-C1 to TG-C5

This first slice delivers admin-managed groups/tags and course-level assignment in dashboard, with strict org isolation and role permissions.
