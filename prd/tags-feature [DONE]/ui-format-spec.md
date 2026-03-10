# Tags UI Format Spec (v1)

## Goal
Define how the tags UI should be structured and formatted across admin, teacher, and student flows.

This spec focuses on layout, information hierarchy, and interaction design, not backend behavior.

## Global UI Principles
1. Keep filters visible and understandable at a glance.
2. Use grouped facets (not flat tag cloud) as the primary mental model.
3. Make selected filters persistent and removable from a single “active filters” region.
4. Preserve existing Classroomio page shell patterns (`Page.Root`, `Page.Header`, `Page.Body`).
5. Ensure mobile-first usability with drawer/sheet patterns for filters.

## Shared Component Formatting

### Tag Chip
1. Shape: rounded, compact (`h-7` to `h-8`), no truncation until > 24 chars.
2. Variants:
   - `default`: active/public tag.
   - `muted`: archived/internal/historical render.
   - `outline`: inactive selectable option.
3. Content:
   - optional color dot.
   - label text.
   - optional remove icon for selected filters only.

### Facet Group Block
1. Title row:
   - group name (for example `Learning Difficulty`).
   - metadata hint (`Single Select` or `Multi Select`).
2. Body:
   - `SINGLE_SELECT`: radio-like segmented options.
   - `MULTI_SELECT`: chip/toggle grid with wrap.
3. Footer:
   - optional “clear group” action.

### Active Filters Bar
1. Location: directly below search/sort row.
2. Content:
   - `X filters active` counter.
   - list of selected chips.
   - `Clear all` action.
3. Behavior: sticky in long scroll contexts (org courses/public courses).

## Screen-by-Screen Format

## 1) Admin Tags Page (`/org/[slug]/tags`)

This section is the implementation contract for the admin page.

### Sidebar Requirement
1. Tags must be a top-level org sidebar item.
2. Placement should be alongside core org items (same level as `Courses`, `Media`, etc), not nested under settings.

### Required Page Structure
1. Use existing dashboard page shell:
   - `Page.Root`
   - `Page.Header`
   - `Page.HeaderContent`
   - `Page.Action`
   - `Page.BodyHeader`
   - `Page.Body`
2. Keep title in header as `Tags`.
3. Use `Page.BodyHeader align="right"` for top-of-table controls (search/filter).

### Required Header Action Pattern (Storybook-aligned)
1. Use `ButtonGroup + DropdownMenu` for creation actions (matching Storybook patterns in:
   - `packages/storybook/src/molecules/page/page.stories.svelte`
   - `packages/storybook/src/molecules/button-group/button-group.stories.svelte`)
2. Header action format:
   - Primary button label: `Create`
   - Adjacent dropdown trigger button (chevron icon)
   - Dropdown items:
     - `Create Tag Group`
     - `Create Tag`

### Required Table Format
1. Use `@cio/ui/base/table` components (table style, not card grid).
2. Display groups as section headers in table:
   - Group row appears first.
   - Tag rows render as sub-items under each group.
3. Group header row should include:
   - Group name
   - Group mode badge (`Single`/`Multi`)
   - Optional group-level metadata (`Public Filter`)

### Required Tag Row Format
1. Left-most cell contains:
   - circle color badge (`rounded-full`) using tag color
   - tag name next to badge
2. Include columns for:
   - `Tag`
   - `Total Courses` (second column, required)
   - `Description`
   - `Category` (group name)
   - `Visibility`
   - `Usage`
   - `Actions`
3. `Total Courses` cell behavior:
   - render count as a clickable control (link/button style).
   - on click, navigate to admin courses page with tag query param:
     - `/org/[slug]/courses?tags=<tagSlug>`
   - support comma-separated format for future multi-tag deep links:
     - `/org/[slug]/courses?tags=<tagSlugA>,<tagSlugB>`
4. Each row must include a `secondary` button for edit:
   - use `Button variant="secondary"`
   - label: `Edit`
   - edits: tag name, description, category

### Required Edit Interaction
1. `Edit` (`secondary` button) opens edit UI (sheet/modal) for the selected tag.
2. Edit form fields:
   - `name`
   - `description`
   - `category` (group selector)
   - `color` (required fixed 10-color swatch picker in popover with live preview)
3. Save/cancel controls follow existing form action conventions.

### Required Create Tag Modal Fields
1. `name` (required)
2. `category` (required)
3. `slug` (required; auto-generated and editable)
4. `description` (optional)
5. `visibility` (required)
6. `color` (required fixed 10-color swatch picker in popover; preselect default color)
7. Save button disabled until required fields including color are valid.

### Required Color Selector Behavior
1. Use a popover selector (not free-form hex input and not full-spectrum picker).
2. Show exactly 10 predefined colors.
3. Selecting a swatch immediately updates preview dot and pending form state.
4. Persist selected value as the tag color token/hex.
5. Color palette (v1):
   - `#EF4444`
   - `#F97316`
   - `#EAB308`
   - `#22C55E`
   - `#14B8A6`
   - `#3B82F6`
   - `#6366F1`
   - `#A855F7`
   - `#EC4899`
   - `#64748B`

### Mobile Layout
1. Keep table semantics but allow stacked responsive rows.
2. Preserve group header + sub-item relationship.
3. Keep `Create` ButtonGroup + dropdown accessible at top.
4. Keep row-level `secondary` edit action visible without opening overflow menus.

## 2) Course Settings: Tag Assignment (`/courses/[id]/settings`)

### Placement
1. Add a `Tags` fieldset inside course settings, below course details section.
2. Keep existing unsaved-change pattern.

### Format
1. Group-by-group assignment UI:
   - group heading.
   - option controls based on mode.
2. `SINGLE_SELECT` group:
   - radio-card options (one active).
3. `MULTI_SELECT` group:
   - selectable chips with check state.
4. Footer summary:
   - `n selected`.
   - validation warnings (if any limits reached).

### Editing Behavior
1. Teacher/admin can only select from existing tags.
2. Archived tags are visible only when currently assigned (muted, non-selectable).
3. Save uses existing page `handleSave` flow.

## 3) Org Courses Catalog (`/org/[slug]/courses`)

### Desktop Format
1. Keep current top controls (`Search`, `Sort`, `View toggle`).
2. Add `Filters` trigger that opens left sidebar/panel with grouped facets.
3. Show active filters bar under controls.
4. Course grid/list remains unchanged structurally.
5. Hydrate filters from URL query parameters on first load:
   - if `tags` is present, pre-select those tag filters.
   - courses list must be filtered immediately using hydrated tag filters.

### Bulk Actions
1. Add checkbox selection mode for admins.
2. Selection action bar appears when one or more rows/cards selected.
3. Actions:
   - add tags.
   - remove tags.
4. Bulk action modal uses group-aware selector UI.

### Mobile Format
1. Facets open in bottom sheet/full-screen sheet.
2. Sticky footer in sheet:
   - `Apply`.
   - `Reset`.

## 4) LMS Explore (`/lms/explore`)

### Format
1. Keep existing search/sort bar.
2. Add compact facet strip:
   - horizontal chips of group names.
   - opens group selector panel.
3. Active filters bar above course cards.

### Mobile
1. One `Filter` button opens full-screen facet sheet.
2. Group accordions in sheet.
3. Apply/reset controls pinned to bottom.

## 5) LMS My Learning (`/lms/mylearning`)

### Format
1. Keep existing tabs (`In Progress`, `Complete`).
2. Add shared facet filter bar above tab content.
3. Selected filters persist across tab switches.

## 6) Public Org Courses (`/courses`)

### Page Structure
1. Header:
   - page title (`All Courses`).
   - subtitle with result count.
2. Body:
   - desktop: left facet sidebar + right course grid.
   - mobile: top filter button + sheet pattern.

### Facet Rules
1. Show only `is_public_filterable=true` groups.
2. Show only `PUBLIC` tags.
3. Preserve selected filters in URL query string.

### Pagination/Loading
1. Use infinite scroll or numbered pagination (pick one; numbered recommended for sharable pages).
2. Skeleton cards during load.

## States and Empty Cases
1. No groups configured:
   - admin surfaces: prompt to create first group.
   - student/public surfaces: hide facet UI, show courses normally.
2. No matching courses:
   - show empty state with `Clear filters`.
3. Network error:
   - inline alert + retry action.
4. Archived selection state:
   - show muted chip with tooltip (`Archived tag`).

## Accessibility Formatting
1. All chip toggles keyboard focusable.
2. `SINGLE_SELECT` groups expose radio semantics.
3. `MULTI_SELECT` groups expose checkbox semantics.
4. Sheet/drawer focus trap and escape close.
5. `Clear all` and `Apply` must have accessible labels.

## Translation and Copy Structure
1. No hardcoded text in Svelte files.
2. Add key namespace:
   - `tags.settings.*`
   - `tags.filters.*`
   - `tags.groups.*`
   - `tags.public_courses.*`
3. Keep labels short:
   - `Single Select`
   - `Multi Select`
   - `Public Filter`
   - `Internal`

## Suggested New UI Components
1. `apps/dashboard/src/lib/features/tag/components/tag-chip.svelte`
2. `apps/dashboard/src/lib/features/tag/components/facet-group.svelte`
3. `apps/dashboard/src/lib/features/tag/components/facet-panel.svelte`
4. `apps/dashboard/src/lib/features/tag/components/active-filters-bar.svelte`
5. `apps/dashboard/src/lib/features/tag/components/tag-admin-grouped-table.svelte`
6. `apps/dashboard/src/lib/features/tag/components/tag-edit-sheet.svelte`
7. `apps/dashboard/src/lib/features/tag/components/tag-create-dropdown.svelte`

## UI Acceptance Checklist
1. Admin tags page uses `Page` shell + header `ButtonGroup + DropdownMenu` create actions.
2. Admin tags page uses grouped table format (group header rows + tag sub-item rows).
3. Each tag row has left color circle badge and `secondary` edit button.
4. `Total Courses` is the second column and is clickable.
5. Clicking `Total Courses` navigates to `/org/[slug]/courses?tags=<tagSlug>` and applies filtering automatically.
6. Edit flow updates tag name, description, and category.
7. Create/Edit tag modal includes required color picker and prevents save without color.
8. Color selector is a popover with exactly 10 swatches (no arbitrary color input).
9. Course settings supports grouped assignment with single-select and multi-select formatting.
10. Org courses supports filter panel + active filters bar + bulk tag actions.
11. LMS Explore/My Learning supports grouped filters with mobile sheet UX.
12. Public `/courses` supports faceted filtering with URL state.
13. All new copy is translation-key based.
