# Org Landing Page Editor Parity Plan

## Scope Lock

1. Keep the existing org landing page feature set, but refactor the editor and preview shell to match the course landing page structure.
2. Preserve the query-parameter handoff for theme preview so content can be edited against a selected theme without publishing it.
3. Do not add section descriptions in the org editor if the course editor does not use them.
4. The editor preview pane must scroll like the course landing page preview pane, not like the current org implementation.
5. The sidebar shell must use the same composition and visual rhythm as the course editor.
6. Keep the editor sections limited to the existing org landing page content areas, including embed support.

## Delivery Phases

1. Phase A: Align the org editor route shell with the course landing page editor shell.
2. Phase B: Split the org editor into small section components.
3. Phase C: Fix scroll behavior, sidebar layout, and header/action placement.
4. Phase D: Clean up remaining copy, state handling, and regression risks.

## Ticket Breakdown

| ID | Area | Task | Key Files | Depends On | Done When |
| --- | --- | --- | --- | --- | --- |
| OLP-1 | Route Shell | Rebuild the org editor route around the same `Sidebar.Provider` / `Sidebar.Root` / `Sidebar.Inset` structure used by the course editor | `apps/dashboard/src/routes/org/[slug]/settings/landingpage/edit/+page.svelte` | None | Full-screen editor behaves like the course editor and preview is rendered in the inset pane |
| OLP-2 | Sidebar Width | Match the course editor sidebar width and spacing defaults | `apps/dashboard/src/routes/org/[slug]/settings/landingpage/edit/+page.svelte` | OLP-1 | Sidebar no longer looks visually broken or oversized |
| OLP-3 | Component Split | Break the monolithic org editor into focused section components | `apps/dashboard/src/lib/features/settings/pages/landingpage-editor.svelte` + new section components | OLP-1 | Editor shell stays thin and section logic is isolated |
| OLP-4 | Hero Section | Extract hero editing into its own form component | `apps/dashboard/src/lib/features/settings/pages/landingpage-editor/*` | OLP-3 | Hero controls render independently and update preview state live |
| OLP-5 | Navigation Section | Extract navigation editing into its own form component | `apps/dashboard/src/lib/features/settings/pages/landingpage-editor/*` | OLP-3 | Nav items can be added, removed, and edited without a long conditional tree |
| OLP-6 | Embed Section | Extract embed editing into its own form component | `apps/dashboard/src/lib/features/settings/pages/landingpage-editor/*` | OLP-3 | Embed fields render cleanly and iframe preview settings remain supported |
| OLP-7 | Footer Section | Extract footer editing into its own form component | `apps/dashboard/src/lib/features/settings/pages/landingpage-editor/*` | OLP-3 | Footer text and links edit cleanly in a dedicated section |
| OLP-8 | Menu Copy | Remove section descriptions from the org editor section list and section header | `apps/dashboard/src/lib/features/settings/pages/landingpage-editor.svelte` | OLP-3 | Sidebar matches the simpler course editor tone and density |
| OLP-9 | Scroll Behavior | Make preview scrolling match the course editor behavior | `apps/dashboard/src/routes/org/[slug]/settings/landingpage/edit/+page.svelte`, org landing page theme components | OLP-1 | The preview pane scrolls independently and the sidebar stays stable |
| OLP-10 | Theme Query Param | Keep theme preview driven by `?theme=` without publishing the theme on content edits | `apps/dashboard/src/lib/features/settings/pages/landingpage.svelte`, `apps/dashboard/src/routes/org/[slug]/settings/landingpage/edit/+page.svelte` | None | Clicking Edit Content previews the selected theme while leaving the live theme unchanged until an explicit settings save |
| OLP-11 | Header Actions | Keep save/close behavior aligned with the course editor style | `apps/dashboard/src/lib/features/settings/pages/landingpage-editor.svelte` | OLP-1 | Save remains explicit and the editor header remains consistent |
| OLP-12 | Regression Check | Verify build and key interaction flows after the refactor | workspace build commands | OLP-1 to OLP-11 | Dashboard build passes and the editor flow is stable |

## Structure Targets

### Route Shell

The org edit route should follow the same outer structure as the course landing page editor:

1. Full-screen fixed overlay.
2. `Sidebar.Provider` as the top-level layout container.
3. `Sidebar.Root` for the left editor panel.
4. `Sidebar.Inset` for the live preview pane.
5. One trigger button in the preview pane, consistent with the course editor.

### Editor Component Shape

The org editor should be a thin orchestration layer that:

1. Tracks selected section state.
2. Renders a compact section list.
3. Delegates form rendering to section-specific components.
4. Handles save and close actions.
5. Binds dirty state to the parent settings page.

### Section Components

Keep the editable sections aligned with the current org landing page model:

1. Hero
2. Navigation
3. Embed
4. Footer

## UX Rules

1. No section descriptions in the org editor if the course editor does not show them.
2. No long `if`/`else` chains in the main editor component when a section registry or split components can express the same behavior.
3. The preview pane should be the only scrollable surface inside the editor shell.
4. Save remains explicit. Theme selection alone should not publish the selected theme when the user is only editing content.
5. The query-param theme preview should be preserved when navigating into and out of the content editor.

## Acceptance Criteria

1. The org landing page editor matches the course landing page editor composition closely enough that the two routes feel like siblings, not separate implementations.
2. The org sidebar no longer appears broken or mis-sized.
3. The preview pane scrolls correctly and does not trap or duplicate scrolling behavior.
4. The org editor sections are split into small, readable components.
5. Section descriptions are removed from the org editor UI.
6. Opening the editor with a selected theme preview does not publish that theme until the user explicitly saves the settings page.
7. `pnpm --filter @cio/dashboard build` passes after the refactor.

## Verification Commands

1. `pnpm --filter @cio/dashboard build`
2. Manually verify `/org/[slug]/settings/landingpage`
3. Manually verify `/org/[slug]/settings/landingpage/edit?theme=minimal`
4. Manually verify `/org/[slug]/settings/landingpage/edit?theme=bold`
5. Manually verify `/org/[slug]/settings/landingpage/edit?theme=classic`

