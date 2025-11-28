# Route Page Setup Documentation

This document outlines the pattern for setting up page routes in the dashboard application. Follow this structure to maintain consistency across the codebase.

## Overview

The application follows a feature-based architecture where:

- **Route files** (`src/routes/org/[slug]/[feature]/+page.svelte`) are minimal wrappers that set up the Page structure
- **Feature pages** (`src/lib/features/[feature]/pages/[feature].svelte`) contain all business logic, state management, and UI components
- **Components** are organized in `src/lib/features/[feature]/components/` and exported via `index.ts`
- **Pages** are exported from `src/lib/features/[feature]/pages/index.ts`

## Directory Structure

```bash
apps/dashboard/src/
├── routes/
│   └── org/
│       └── [slug]/
│           └── [feature]/
│               └── +page.svelte          # Minimal route wrapper
└── lib/
    └── features/
        └── [feature]/
            ├── components/
            │   ├── [component].svelte
            │   └── index.ts               # Export all components
            ├── pages/
            │   ├── [feature].svelte      # Main feature page with all logic
            │   └── index.ts               # Export page component
            ├── utils/                     # Feature-specific utilities
            └── api/                       # Feature-specific API calls
```

## Route File Pattern (`+page.svelte`)

The route file should be minimal and only contain:

1. **Page structure** using `@cio/ui/base/page` components
2. **Import and render** the feature page component
3. **Page metadata** (title, etc.)

### Example Route File

```svelte
<script>
  import { FeaturePage } from '$lib/features/[feature]/pages';
  import { FeatureActionButton } from '$lib/features/[feature]/components';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Feature Name - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('feature.title')}</Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <FeatureActionButton />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <FeaturePage />
    {/snippet}
  </Page.Body>
</Page.Root>
```

### Route File Rules

- ✅ DO: Keep it minimal - only Page structure
- ✅ DO: Import feature page from `$lib/features/[feature]/pages`
- ✅ DO: Import action buttons/components from `$lib/features/[feature]/components`
- ✅ DO: Use `Page.Root`, `Page.Header`, `Page.HeaderContent`, `Page.Title`, `Page.Action`, `Page.Body`
- ❌ DON'T: Put business logic in route files
- ❌ DON'T: Put state management in route files
- ❌ DON'T: Put data fetching in route files
- ❌ DON'T: Put filters/search in route files (use `Page.BodyHeader` in feature page)

## Feature Page Pattern (`pages/[feature].svelte`)

The feature page contains all the business logic, state management, and UI components.

### Feature Page Structure

```svelte
<script lang="ts">
  // 1. UI Component Imports
  import { Empty } from '@cio/ui/custom/empty';
  import { Search } from '@cio/ui/custom/search';
  import * as Page from '@cio/ui/base/page';
  import * as Select from '@cio/ui/base/select';
  import { SomeIcon } from '@lucide/svelte/icons/...';

  // 2. Feature Component Imports
  import { FeatureCard, FeatureLoader, FeatureModal } from '../components';

  // 3. Utility Imports
  import { t } from '$lib/utils/functions/translations';
  import { someStore } from '../utils/store';
  import { fetchFeatureData } from '../api';

  // 4. State Management
  let isLoading = $state(false);
  let searchValue = $state('');
  let selectedId = $state('');

</script>

<FeatureModal />

<Page.BodyHeader align="right">
  <Search placeholder="Search..." bind:value={searchValue} />
  <Select.Root bind:value={selectedId}>
    <!-- Select options -->
  </Select.Root>
</Page.BodyHeader>

<!-- Main Content with States -->
<div class="w-full">
  {#if isLoading}
    <!-- Loading State -->
    <FeatureLoader />
    <FeatureLoader />
    <FeatureLoader />
  {:else if !data.length}
    <!-- Empty State -->
    <Empty
      title={$t('feature.empty_title')}
      description={$t('feature.empty_description')}
      icon={SomeIcon}
      variant="page"
    >
      <FeatureActionButton />
    </Empty>
  {:else}
    <!-- Content -->
    {#each data as item}
      <FeatureCard {item} />
    {/each}
  {/if}
</div>
```

### Feature Page Rules

- ✅ DO: Use `Page.BodyHeader` for filters, search, and view toggles
- ✅ DO: Use `Empty` component from `@cio/ui/custom/empty` for empty states
- ✅ DO: Use `Search` component from `@cio/ui/custom/search` for search inputs
- ✅ DO: Handle loading states with skeleton/loader components
- ✅ DO: Export the page component from `pages/index.ts` as `[Feature]Page`
- ✅ DO: Keep all business logic in the feature page
- ❌ DON'T: Use `Page.Header` or `Page.Action` in feature pages (these are in route files)
- ❌ DON'T: Put route-specific logic in feature pages

## Component Organization

### Components Directory

Create reusable components specific to the feature:

```bash
components/
├── feature-card.svelte
├── feature-loader.svelte
├── feature-modal.svelte
└── index.ts
```

### Components Index (`components/index.ts`)

```typescript
export { default as FeatureCard } from './feature-card.svelte';
export { default as FeatureLoader } from './feature-loader.svelte';
export { default as FeatureModal } from './feature-modal.svelte';
export { default as FeatureActionButton } from './feature-action-button.svelte';
```

## Pages Index (`pages/index.ts`)

```typescript
export { default as FeaturePage } from './feature.svelte';
```

## Complete Example

### Route File: `routes/org/[slug]/community/+page.svelte`

```svelte
<script>
  import { CommunityPage } from '$lib/features/community/pages';
  import { AskCommunityButton } from '$lib/features/community/components';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Community - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('community.title')}</Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <AskCommunityButton />
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CommunityPage />
    {/snippet}
  </Page.Body>
</Page.Root>
```

### Feature Page: `lib/features/community/pages/community.svelte`

```svelte
<script lang="ts">
  import { Search } from '@cio/ui/custom/search';
  import { Empty } from '@cio/ui/custom/empty';
  import * as Page from '@cio/ui/base/page';
  import * as Select from '@cio/ui/base/select';
  import MessageSquareMoreIcon from '@lucide/svelte/icons/message-square-more';
  import { CommunityListLoader, AskCommunityButton } from '../components';
  // ... other imports

  let isLoading = $state(false);
  let searchValue = $state('');
  let discussions = $state([]);

  // ... logic
</script>

<Page.BodyHeader>
  <Search placeholder="Search..." bind:value={searchValue} />
  <Select.Root>
    <!-- Select options -->
  </Select.Root>
</Page.BodyHeader>

{#if isLoading}
  <CommunityListLoader />
{:else}
  {#each discussions as discussion}
    <!-- Discussion content -->
  {:else}
    <Empty
      title={$t('community.no_question')}
      description={$t('community.ask_a_question')}
      icon={MessageSquareMoreIcon}
    >
      <AskCommunityButton />
    </Empty>
  {/each}
{/if}
```

## Key Patterns

1. **Separation of Concerns**: Route files handle routing structure, feature pages handle business logic
2. **Reusability**: Feature pages can be imported and used in different contexts
3. **Consistency**: All pages follow the same structure for maintainability
4. **Design System**: Use `Page.BodyHeader` for filters, `Empty` for empty states, `Search` for search inputs
5. **State Management**: Keep state local to feature pages or use feature-specific stores

## Migration Checklist

When refactoring an existing route:

- [ ] Create feature directory structure (`lib/features/[feature]/`)
- [ ] Move business logic from route file to feature page
- [ ] Extract components to `components/` directory
- [ ] Create `components/index.ts` with exports
- [ ] Create `pages/index.ts` with page export
- [ ] Update route file to be minimal wrapper
- [ ] Add `Page.BodyHeader` for filters/search if needed
- [ ] Replace custom empty states with `Empty` component
- [ ] Replace custom search inputs with `Search` component
- [ ] Test all functionality works correctly
