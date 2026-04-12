# Org Landing Page Theme Picker + Unified Content Editor

## Context
The org has 3 landing page theme templates (Minimal, Bold, Classic) in `packages/ui/` that all accept `OrgLandingPageProps` uniformly. However:
1. The templates are **only used in Storybook** — the actual public landing page (`landing-page.svelte`) renders its own custom legacy HTML
2. The stored `OrgLandingPageJson` is a complex format (header, aboutUs, faq, contact, mailinglist, etc.) that **doesn't align** with what the templates need
3. There is no theme selection UI
4. There is no edit flow like the course landing page (split-screen with live preview)

This plan: simplifies the stored format to match `OrgLandingPageProps`, replaces the legacy public landing page renderer with the theme components, adds a theme picker in settings, and adds a split-screen content editor modeled after the course landing page editor.

---

## Simplified Data Model

Replace `OrgLandingPageJson` (the DB-stored type) with a structure that maps 1:1 to `OrgLandingPageProps`:

```ts
// apps/dashboard/src/lib/utils/types/org.ts
export interface OrgLandingPageJson {
  theme: 'minimal' | 'bold' | 'classic';
  hero: {
    heading: string;
    subheading: string;
    primaryAction: { label: string; href: string };
    secondaryAction?: { label: string; href: string };
    image?: string;
  };
  navItems: Array<{ label: string; href: string }>;
  footerLinks: Array<{ label: string; href: string }>;
  footerText: string;
}
```

Sections removed from old format: `header` (with banner/background/show toggles), `aboutUs`, `courses`, `faq`, `contact`, `mailinglist`, `customLinks`, `footer` (social links only).

Fields from org data (not stored in `landingpage`): `orgName` → `org.name`, `logoUrl` → `org.avatarUrl`, `courses` → `orgApi.publicCourses`.

---

## Changes

### 1. Update `OrgLandingPageJson` type
**File:** `apps/dashboard/src/lib/utils/types/org.ts`

Replace the full type with the simplified version above.

### 2. Update settings store with new defaults
**File:** `apps/dashboard/src/lib/features/settings/utils/store.ts`

Replace `landingPageSettings` writable defaults with the new schema:
```ts
{
  theme: 'minimal',
  hero: {
    heading: 'Master the Skills of Tomorrow',
    subheading: 'Join thousands of learners and accelerate your career.',
    primaryAction: { label: 'Explore Courses', href: '#courses' },
    secondaryAction: { label: 'Learn More', href: '#about' },
    image: ''
  },
  navItems: [
    { label: 'Courses', href: '#courses' },
    { label: 'About', href: '#about' }
  ],
  footerLinks: [
    { label: 'Terms', href: '#terms' },
    { label: 'Privacy', href: '#privacy' }
  ],
  footerText: '© 2026 All rights reserved.'
}
```

Also update (or delete and inline) the old store at:
`apps/dashboard/src/lib/features/org/components/settings/landing-page-store.ts`
(currently used by the legacy landing-page.svelte — this store will go away when we replace the renderer).

### 3. Redesign `landingpage.svelte` settings page — theme picker only
**File:** `apps/dashboard/src/lib/features/settings/pages/landingpage.svelte`

Remove all existing form fields. The page now shows only:
- **Theme picker** (`Field.Set` "Choose a Theme"): 3 cards in `grid grid-cols-3 gap-4` using `RadioGroup.Root bind:value={$landingPageSettings.theme}`. Each card:
  - Inline SVG thumbnail (distinct per theme — see SVG specs below)
  - Theme name label
  - Radio selection state: `border-primary ring-2 ring-primary/20` vs `border-border`
  - `onValueChange={() => (hasUnsavedChanges = true)}`
- **Save button** already in the route page header — saves only `theme` (plus full JSON as fallback)
- **"Edit Content"** button below the theme picker (`Button variant="outline"`) → navigates to `/org/[slug]/settings/landingpage/edit`
- `UnsavedChanges` component stays

SVG thumbnail specs:
- **Minimal**: white bg, light gray nav bar top, 2 text lines (heading/subheading), 2 course card outlines in a 2-col grid, thin footer line
- **Bold**: dark `#111` bg top-half, large bold heading text block, course cards with image-left layout, dark inverted footer
- **Classic**: dark navy `#1e3a5f` header bar, white body, centered heading, 3-col course card grid, minimal footer

Subscriber fallback for old data (users who previously saved the old format):
```ts
if (!landingpage.theme || !landingpage.hero) {
  // Set minimal defaults — discard old incompatible structure
  $landingPageSettings = { ...defaultLandingPageSettings };
} else {
  $landingPageSettings = landingpage;
}
```

### 4. New split-screen content editor route
**File (new):** `apps/dashboard/src/routes/org/[slug]/settings/landingpage/edit/+page.svelte`

Modeled after `apps/dashboard/src/routes/courses/[id]/landingpage/+page.svelte`.

Layout:
```svelte
<!-- Fixed full-screen overlay, fly transition -->
<div class="fixed inset-0 z-250 h-screen w-screen">
  <Sidebar.Provider>
    <Sidebar.Root side="left" collapsible="icon">
      <OrgLandingPageEditor bind:settings={landingPageSettings} {org} onSave={handleSave} onClose={handleClose} />
    </Sidebar.Root>
    <Sidebar.Inset class="relative h-screen overflow-y-auto">
      <!-- Live theme preview -->
      {#if $landingPageSettings.theme === 'bold'}
        <BoldLandingPage {...previewProps} />
      {:else if $landingPageSettings.theme === 'classic'}
        <ClassicLandingPage {...previewProps} />
      {:else}
        <MinimalLandingPage {...previewProps} />
      {/if}
    </Sidebar.Inset>
  </Sidebar.Provider>
</div>
```

`previewProps` is derived from `$landingPageSettings` + `$currentOrg` + `orgApi.publicCourses` (mapped to `OrgLandingPageProps`).

`handleClose()` → `goto('/org/[slug]/settings/landingpage')`.

### 5. New editor sidebar component
**File (new):** `apps/dashboard/src/lib/features/settings/pages/landingpage-editor.svelte`

Mirrors the section-based structure of the course landing page `editor.svelte`.

Sections (left sidebar menu → click to edit):
1. **Hero** — heading, subheading, primaryAction (label + href), secondaryAction (optional label + href toggle), image (upload widget, used by Bold/Classic)
2. **Navigation** — list of nav items (label + href), add/remove rows
3. **Footer** — footer text, list of footer links (label + href), add/remove rows

Header: "Save" button + close button (back to settings).

Section form pattern: inline `Input` / `Textarea` / `UploadWidget` fields, two-way bound to `settings` prop, changes reflect live in the preview panel.

### 6. Replace legacy public landing page renderer
**File:** `apps/dashboard/src/lib/features/org/components/landing-page/landing-page.svelte`

Replace the full custom HTML renderer with:
- Import `MinimalLandingPage`, `BoldLandingPage`, `ClassicLandingPage` from `@cio/ui/custom/org-landing-page`
- Load `org.landingpage` into local state with defaults fallback
- Build `previewProps: OrgLandingPageProps` = `{ orgName: org.name, logoUrl: org.avatarUrl, ...landingpage, courses: orgApi.publicCourses }`
- Render the correct theme component based on `landingpage.theme`
- Remove all legacy section rendering (aboutUs, faq, contact, mailinglist, etc.)
- Keep `orgApi.getPublicCoursesBySiteName(orgSiteName)` call for course loading
- Keep `<svelte:head>` and `<PoweredBy />`

---

## Critical Files

| File | Change |
|------|--------|
| `apps/dashboard/src/lib/utils/types/org.ts` | Replace `OrgLandingPageJson` type |
| `apps/dashboard/src/lib/features/settings/utils/store.ts` | New defaults matching new type |
| `apps/dashboard/src/lib/features/org/components/settings/landing-page-store.ts` | Delete or update (old format no longer needed) |
| `apps/dashboard/src/lib/features/settings/pages/landingpage.svelte` | Theme picker + Edit Content button only |
| `apps/dashboard/src/routes/org/[slug]/settings/landingpage/+page.svelte` | Minor adjustments if needed |
| `apps/dashboard/src/lib/features/org/components/landing-page/landing-page.svelte` | Replace renderer with theme components |
| `apps/dashboard/src/routes/org/[slug]/settings/landingpage/edit/+page.svelte` | **New** — split-screen editor route |
| `apps/dashboard/src/lib/features/settings/pages/landingpage-editor.svelte` | **New** — editor sidebar component |

## Reused Patterns
- `Sidebar.Provider/Root/Inset` from `@cio/ui/base/sidebar` — same as course landing page editor route
- `RadioGroup.Root/Item` — already imported in `landingpage.svelte`
- `Field.Set/Field.Legend/Field.Separator` — already imported in `landingpage.svelte`
- `UploadWidget` — already imported in `landingpage.svelte`
- `orgApi.update($currentOrg.id, { landingpage: ... })` — same save pattern
- `UnsavedChanges` component — already in `landingpage.svelte`
- `goto()` for close/navigate — same as course editor

## Verification
1. **Theme picker**: `/org/[slug]/settings/landingpage` shows 3 cards with distinct SVG previews; clicking a card highlights it; saving persists the selection; reload reflects saved theme
2. **Edit Content**: clicking "Edit Content" navigates to `/org/[slug]/settings/landingpage/edit`; the editor opens as a full-screen overlay with the selected theme visible on the right; editing fields updates the preview live
3. **Public landing page**: visiting the org's public URL renders the selected theme (Minimal/Bold/Classic) using actual org courses; switching theme in settings and saving changes what public visitors see
4. **Backward compat**: orgs with old `OrgLandingPageJson` format get reset to minimal defaults gracefully (no crash)
