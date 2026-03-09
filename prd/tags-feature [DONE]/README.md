# Scalable Tags Feature PRD (Classroomio)

## Purpose
Define a scalable tagging system for Classroomio that improves course discoverability, organization, and personalization across admin, teacher, and student experiences.

## Problem Statement
Classroomio currently supports course type labels (`LIVE_CLASS`, `SELF_PACED`) but does not have a reusable, organization-scoped tagging model for catalog management and discovery.

This creates gaps:
- Course catalogs become harder to browse as organizations scale.
- Students cannot filter learning paths by topic/level/format.
- Teachers cannot consistently classify content.
- Analytics cannot answer questions like “which topics drive enrollments/completion?”
- Tag usage is not standardized across features (courses, explore, community, media, quiz).

## Product Vision
Tags should become a lightweight taxonomy layer that powers:
- Better organization for educators.
- Faster discovery for learners.
- Reusable filtering primitives for every major content surface.
- Future recommendation and analytics models.

Hard requirement:
- Tags are strictly organization-scoped and cannot be shared across organizations.

## Goals
1. Introduce organization-scoped tags with governance controls.
2. Support course tagging in v1 with grouped/faceted filtering for scalable discovery.
3. Add role-aware workflows for admin, teacher, and student.
4. Integrate tags into existing Classroomio surfaces without breaking current flows.
5. Keep query performance strong for large catalogs.

## Confirmed Decisions
1. Only `ROLE.ADMIN` can create, edit, archive, and restore tags.
2. Students are filter-only in v1; event tracking should still lay groundwork for future personalization.
3. Invite/email campaign integrations with tags are out of scope for v1.
4. Grouped/faceted tags are required (not flat-only tags).
5. Every tag must belong to a group; create a default `General` group for fallback.
6. For `SINGLE_SELECT` groups, assigning a new tag auto-replaces the existing tag in that group.
7. On public `/courses`, admins control which groups appear as public filters.

## Non-Goals (v1)
- AI-generated tags.
- Cross-organization/global tag sharing.
- Full recommendation engine rewrite.
- Free-form student-created tags.
- Migration of every entity type in the first release.
- Invite/email campaign integrations using tags.

## Current-State Audit

Legend: `available now`, `partial`, `missing`

| Capability | Availability | Notes |
| --- | --- | --- |
| Course type labels | partial | Present in UI as course-type badges, but not taxonomy tags |
| Org-level tag management | missing | No CRUD for tags |
| Course-tag assignment | missing | No first-class relation in DB/API |
| Tag filtering in org courses page | missing | Current filters are date/published/lessons only |
| Tag filtering in LMS explore/mylearning | missing | Search/sort only |
| Public org `/courses` catalog with tag filters | missing | No dedicated org-wide public catalog route today |
| Grouped/faceted tag filtering | missing | No taxonomy/group model for ecommerce-style filters |
| Tag analytics | missing | No usage or performance by tag |
| Tag-based API query params | missing | Existing course endpoints return untagged data |

## Data Sources Checked
- `apps/website/src/routes/roadmap/+page.svelte`
- `packages/db/src/schema.ts`
- `apps/api/src/routes/organization/organization.ts`
- `apps/api/src/services/organization.ts`
- `packages/db/src/queries/course/course.ts`
- `apps/dashboard/src/routes/org/[slug]/courses/+page.svelte`
- `apps/dashboard/src/lib/features/course/pages/courses.svelte`
- `apps/dashboard/src/lib/features/lms/pages/explore.svelte`
- `apps/dashboard/src/lib/features/lms/pages/mylearning.svelte`
- `packages/utils/src/constants/roles.ts`

## Personas and Permissions

### Admin (`ROLE.ADMIN`)
- Create, update, archive, restore tags.
- Set tag metadata (name, slug, color, visibility).
- Configure governance limits.
- Bulk assign/unassign tags across courses.
- View tag analytics and audit history.

### Teacher (`ROLE.TUTOR`)
- Assign/unassign existing tags on courses they manage.
- Search/select existing tags in course settings and course creation flows.
- Cannot create/update/archive tags in v1.

### Student (`ROLE.STUDENT`)
- View tags on course cards and course pages.
- Filter browse/discovery pages by tags.
- Use tag filters in `Explore` and `My Learning`.
- No create/update/delete permissions.

## Functional Requirements

### 0. Organization Isolation (Hard Requirement)
- Every tag must belong to exactly one `organization_id`.
- Tag assignment is valid only when the tag and target entity belong to the same organization.
- No cross-organization tag reuse, lookup, or assignment is allowed.

### 1. Tag Lifecycle (Org Scope)
- Only `ROLE.ADMIN` can create, update, archive, and restore tags.
- Create tag with:
  - `name` (required)
  - `slug` (auto-generated + editable)
  - `description` (optional)
  - `color` (required visual token selected from 10-color popover palette)
  - `visibility` (`PUBLIC` or `INTERNAL`)
- Prevent duplicates by normalized name/slug within an organization.
- Archive tags instead of hard-delete to avoid breaking history.
- Restore archived tags.

Color rule:
- Tag color must be one of the predefined v1 palette values (exactly 10 options).

### 2. Tag Grouping (Faceted Taxonomy)
- Introduce organization-scoped tag groups (facets) to support ecommerce-style filtering.
- Every tag belongs to one group.
- Example starter groups:
  - `Learning Difficulty`: `beginner`, `intermediate`, `advanced`
  - `Technologies`: `react`, `svelte`, `vue`
  - `Job Offering`: `product-management`, `developer`, `qa`
- Group filter mode:
  - `SINGLE_SELECT`: only one tag in that group per course (example: Difficulty)
  - `MULTI_SELECT`: multiple tags in that group per course (example: Technologies)
- Filter semantics:
  - OR within a group (if multiple values selected in same group)
  - AND across groups

### 3. Tag Assignment (v1 Target: Courses)
- Assign up to configurable max tags per course (default: 20).
- Unassign tags without deleting tag definitions.
- Support bulk assignment/unassignment for admins in org courses view.
- Render assigned tags in course cards and list rows.
- Enforce group rules on assignment (for `SINGLE_SELECT`, auto-replace existing conflicting tag in the same group).

### 4. Discovery and Filtering
- Filter org course catalog by one or more tags.
- Filter LMS Explore and My Learning by tags.
- Support combined filters: `search + tags + existing sort`.
- Expose tag chips on course details and public course landing.
- Add public org course catalog route: `/courses` (on org site/custom domain) with faceted tag filtering.
- In admin tags table, `Total Courses` per tag is clickable and deep-links to admin courses with pre-applied tag query filter.

### 5. Governance and Quality
- Configurable limits per org:
  - max number of active tags (default: 500)
  - max number of tag groups (default: 25)
  - max tags per course (default: 20)
- Tag usage count and “unused tags” visibility.
- Audit events for admin-level lifecycle actions.

### 6. Analytics
- Tag usage metrics:
  - number of tagged courses
  - enrollments by tag
  - completion rate by tag
- Trend-ready event stream for tag assignment and filter usage.
- Persist filter interaction events as foundation for future personalization (students still filter-only in v1).

## Taxonomy Clarification
Taxonomy in this PRD means a structured way to classify courses, not just a flat tag list.

- Flat tags: all tags in one pool, harder to filter at scale.
- Grouped taxonomy (facets): tags are organized into groups like `Difficulty`, `Technology`, `Job Offering`.

Why grouped taxonomy is useful:
- Better UX: users can filter like ecommerce (`Difficulty=Beginner`, `Technology=React`).
- Better data quality: prevents mixed/duplicate meaning tags.
- Better analytics: compare performance by consistent dimensions.

## Integration Map

| Surface | Integration | Role Impact |
| --- | --- | --- |
| Org sidebar | Add top-level `Tags` item (same level as `Courses`, `Media`) -> `/org/[slug]/tags` | Admin/Teacher |
| `org/[slug]/courses` | Multi-select tag filter + bulk tagging actions | Admin/Teacher |
| `courses/[id]/settings` | Tag assignment editor in course settings | Admin/Teacher |
| New course modal | Optional tag selection during creation | Admin |
| `lms/explore` | Tag chips + multi-select tag filtering | Student |
| `lms/mylearning` | Filter enrolled courses by tags | Student |
| Public org catalog `/courses` | Faceted filtering (grouped tags) across published courses | Student/Public |
| Public course page (`/course/[slug]`) | Display public tags | Student/Public |
| Community (future phase) | Optional tag alignment for posts/questions | Admin/Teacher/Student |
| Media Manager (future phase) | Tag assets for reuse/search | Admin/Teacher |
| Quiz (future phase) | Tag quizzes by topic/outcome | Admin/Teacher |

## UX Flows

### Admin Flow
1. Navigate to `Org -> Tags` (`/org/[slug]/tags`).
2. Create a tag (`Data Science`, `Beginner`, `Project-Based`, etc).
3. Set visibility and choose tag color from 10-color popover swatch selector.
4. Assign tags from:
   - Course settings (single course).
   - Org courses page (bulk action).
5. Click a tag’s `Total Courses` count to open admin courses filtered by that tag.
6. Open tag analytics panel to monitor usage and performance.
7. Archive stale tags and resolve low-quality duplicates.

### Teacher Flow
1. Open a managed course in `courses/[id]/settings`.
2. Use tag selector to add/remove approved tags.
3. Save course updates.
4. Confirm tags appear in org catalog and student discovery pages.

### Student Flow
1. Open `LMS Explore`.
2. See featured/popular tags as quick filter chips.
3. Select one or more tags to narrow course cards.
4. Combine tags with text search.
5. Open `My Learning` and apply tag filters to focus in-progress/completed courses.
6. On org public site, use `/courses` faceted filters to browse all published courses by grouped tags.

## UX States and Rules
- Empty state (no tags in org): show admin CTA to create first tag.
- Empty state (student filter no results): clear message + “reset filters”.
- Archived tag behavior:
  - visible in historical views as muted chip.
  - hidden from new assignment by default.
- Validation feedback:
  - duplicate tag names/slugs.
  - max tags per course.
  - forbidden characters in slug.

## Technical Design (Proposed)

## Data Model

### `tag_group`
- `id` (uuid, pk)
- `organization_id` (uuid, fk, indexed)
- `name` (text, required)
- `slug` (text, required)
- `description` (text, nullable)
- `filter_mode` (`SINGLE_SELECT` | `MULTI_SELECT`)
- `is_public_filterable` (boolean, default `true`)
- `display_order` (int, default 0)
- `status` (`ACTIVE` | `ARCHIVED`)
- `created_by_profile_id` (uuid)
- `updated_by_profile_id` (uuid)
- `created_at`, `updated_at`

Constraints and indexes:
- unique `(organization_id, slug)`
- normalized unique on `(organization_id, lower(name))`
- index `(organization_id, status, display_order)`

### `tag`
- `id` (uuid, pk)
- `organization_id` (uuid, fk, indexed)
- `group_id` (uuid, fk to `tag_group.id`, indexed)
- `name` (text, required)
- `slug` (text, required)
- `description` (text, nullable)
- `color` (text, required hex value from fixed 10-color palette)
- `visibility` (`PUBLIC` | `INTERNAL`)
- `status` (`ACTIVE` | `ARCHIVED`)
- `usage_count` (int, default 0)
- `created_by_profile_id` (uuid)
- `updated_by_profile_id` (uuid)
- `created_at`, `updated_at`

Rule:
- `group_id` is required for all tags. No ungrouped tags.

Constraints and indexes:
- unique `(organization_id, slug)`
- normalized unique on `(organization_id, lower(name))`
- unique `(organization_id, group_id, slug)`
- index `(organization_id, status)`
- index `(organization_id, usage_count desc)`

### `tag_assignment`
- `id` (uuid, pk)
- `organization_id` (uuid, indexed)
- `tag_id` (uuid, fk to `tag.id`, indexed)
- `target_type` (`course` in v1; extensible enum later)
- `target_id` (uuid)
- `assigned_by_profile_id` (uuid)
- `source` (`manual` | `bulk` | `api`)
- `created_at`

Constraints and indexes:
- unique `(tag_id, target_type, target_id)`
- index `(organization_id, target_type, target_id)`
- index `(organization_id, target_type, tag_id)`
- enforce same-org integrity in service/query checks:
  - `tag.group_id` must belong to same `organization_id`
  - `tag_assignment.organization_id` must match `tag.organization_id`
  - target entity organization must equal `tag_assignment.organization_id`
  - for `SINGLE_SELECT` groups, only one tag assignment per `(target_type, target_id, group_id)`

## Validation Layer
- `packages/utils/src/validation/tag/tag.ts`
  - `ZCreateTagGroup`
  - `ZUpdateTagGroup`
  - `ZListTagGroupsQuery`
  - `ZCreateTag`
  - `ZUpdateTag`
  - `ZListTagsQuery`
  - `ZAssignCourseTags`
  - `ZBulkAssignCourseTags`

## Query Layer
- `packages/db/src/queries/tag/tag.ts`
  - `createTagGroup`
  - `updateTagGroup`
  - `archiveTagGroup`
  - `listTagGroupsByOrg`
  - `createTag`
  - `updateTag`
  - `archiveTag`
  - `restoreTag`
  - `listTagsByOrg`
  - `assignTagsToCourse`
  - `setCourseTags`
  - `listCourseTags`
  - `getTagUsageSummary`

## Service Layer
- `apps/api/src/services/tag.ts`
  - `createOrganizationTagGroupService`
  - `updateOrganizationTagGroupService`
  - `archiveOrganizationTagGroupService`
  - `createOrganizationTagService`
  - `updateOrganizationTagService`
  - `archiveOrganizationTagService`
  - `setCourseTagsService`
  - `bulkAssignCourseTagsService`
  - `getOrganizationTagAnalyticsService`

## Route Layer
- `apps/api/src/routes/tag/tag.ts`
  - `GET /organization/tag-groups`
  - `POST /organization/tag-groups`
  - `PUT /organization/tag-groups/:groupId`
  - `DELETE /organization/tag-groups/:groupId` (archive)
  - `GET /organization/tags`
  - `POST /organization/tags`
  - `PUT /organization/tags/:tagId`
  - `DELETE /organization/tags/:tagId` (archive)
  - `POST /organization/tags/:tagId/restore`
  - `GET /course/:courseId/tags`
  - `PUT /course/:courseId/tags`

Auth/authorization:
- Tag lifecycle endpoints: `authMiddleware + orgAdminMiddleware`
- Course tag assignment: `authMiddleware + courseTeamMemberMiddleware`
- Student read/filter endpoints: `authMiddleware + orgMemberMiddleware` or existing public route behavior
- Public catalog filtering: extend existing `GET /organization/courses/public` query with grouped tag filters.

## Frontend Plan

### Feature module
- `apps/dashboard/src/lib/features/tag/`
  - `api/tag.svelte.ts`
  - `utils/types.ts`
  - `components/tag-manager.svelte`
  - `components/tag-selector.svelte`
  - `components/tag-chip.svelte`
  - `components/tag-filter-bar.svelte`

### Route additions
- `apps/dashboard/src/routes/org/[slug]/tags/+page.server.ts`
- `apps/dashboard/src/routes/org/[slug]/tags/+page.svelte`
- Public catalog route (organization site/custom domain): `/courses`

### Navigation
- Add top-level org sidebar item for tags:
  - update `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`
  - path: `/tags`

### Existing page integration
- `apps/dashboard/src/routes/org/[slug]/courses/+page.svelte`
- `apps/dashboard/src/lib/features/course/pages/courses.svelte`
- `apps/dashboard/src/lib/features/lms/pages/explore.svelte`
- `apps/dashboard/src/lib/features/lms/pages/mylearning.svelte`
- `apps/dashboard/src/lib/features/course/pages/settings.svelte`
- Public org courses page with faceted filters and grouped chips.

### UI/Copy rules
- Add translation keys in `apps/dashboard/src/lib/utils/translations/en.json`.
- No hardcoded user-facing strings.

## Scalability Requirements
- Support organizations with:
  - 1,000+ courses
  - 500+ tags
  - high filter read volume from LMS views
- Response targets:
  - tag list endpoint P95 < 250ms
  - course list with tag filters P95 < 400ms
- Pagination for tag list and analytics endpoints.
- Query plans must rely on org-scoped indexes.
- Cache tag dictionary per org in app layer to reduce repeated reads.

## Security and Data Isolation
- Strict org scoping on all tag and assignment queries.
- Validate target ownership before assignment (course must belong to org).
- Reject any cross-org assignment attempt, even if tag ID is valid.
- Audit logging for admin lifecycle actions.
- Rate-limit bulk operations.

## Rollout Plan

### Phase 0: Foundation
1. Schema + migrations (`tag_group`, `tag`, `tag_assignment`).
2. Validation, queries, services, routes for groups and tags.
3. Minimal assignment support on course settings.

### Phase 1: Core UX
1. Org sidebar tags manager page (`/org/[slug]/tags`).
2. Org courses tag filter and bulk assignment.
3. LMS Explore/My Learning tag filtering.
4. Public `/courses` catalog with faceted grouped filtering.
5. Tag rendering on course cards/public pages.

### Phase 2: Analytics and Governance
1. Tag usage/performance dashboard.
2. Audit history.
3. Org-level governance settings and limits.

### Phase 3: Cross-Feature Expansion
1. Community content tagging.
2. Media/quiz tagging.
3. Optional rule-based and recommendation integrations.

## Success Metrics
- >= 70% of active orgs create at least 5 tags within 60 days.
- >= 60% of org courses tagged within 90 days.
- >= 30% of LMS Explore sessions use at least one tag filter.
- Improved course discovery:
  - reduced time-to-first-course-open in Explore.
  - increased enroll conversion from Explore.

## Risks and Mitigations
- Risk: Tag sprawl/low-quality taxonomy.
  - Mitigation: admin governance, archive flow, usage stats.
- Risk: Query slowdown on large catalogs.
  - Mitigation: scoped indexes, pagination, caching, P95 SLO tracking.
- Risk: Permission confusion between admin and tutor.
  - Mitigation: explicit capability matrix in UI and endpoint guards.
- Risk: Inconsistent copy and UX patterns.
  - Mitigation: shared `tag` feature components + translation keys.

## Open Questions
None for v1 scope.

## Kanban (Ideation)

| Ticket | Title | Todo | In Progress | Verification | Done |
| --- | --- | --- | --- | --- | --- |
| TG-1 | DB schema for tags and assignments | [ ] | [ ] | [ ] | [ ] |
| TG-2 | Validation + query layer | [ ] | [ ] | [ ] | [ ] |
| TG-3 | API routes and service guards | [ ] | [ ] | [ ] | [ ] |
| TG-4 | Org sidebar tags page UI (`/org/[slug]/tags`) | [ ] | [ ] | [ ] | [ ] |
| TG-5 | Course settings assignment UI | [ ] | [ ] | [ ] | [ ] |
| TG-6 | Org/LMS filtering integration | [ ] | [ ] | [ ] | [ ] |
| TG-7 | Analytics and governance | [ ] | [ ] | [ ] | [ ] |
