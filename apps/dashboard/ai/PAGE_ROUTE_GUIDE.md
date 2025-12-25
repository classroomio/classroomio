# Page and Route Creation Guide

This guide explains how to create pages and routes in the dashboard application, following the established patterns and architecture.

## Table of Contents

1. [Route Structure Overview](#route-structure-overview)
2. [Creating Basic Pages](#creating-basic-pages)
3. [Creating Settings Pages](#creating-settings-pages)
4. [Creating Feature Pages](#creating-feature-pages)
5. [Layout Patterns](#layout-patterns)
6. [Form Patterns (Field.Group)](#form-patterns-fieldgroup)
7. [Navigation Setup](#navigation-setup)
8. [Breadcrumb Setup](#breadcrumb-setup)

---

## Route Structure Overview

The dashboard has two main route contexts:

### 1. Organization Routes (`/org/[slug]/...`)

- Uses `OrgSidebar` and `AppHeader`
- Path pattern: `/org/[slug]/[feature]`
- Example: `/org/acme/courses`, `/org/acme/settings`

### 2. LMS Routes (`/lms/...`)

- Uses `LMSSidebar` and `LmsHeader`
- Path pattern: `/lms/[feature]`
- Example: `/lms/community`, `/lms/settings`

---

## Creating Basic Pages

### Step 1: Create the Route File

**Location**: `apps/dashboard/src/routes/[context]/[feature]/+page.svelte`

**Pattern**:

```svelte
<script lang="ts">
  import { FeaturePage } from '$features/[feature]/pages';
  import { FeatureActionButton } from '$features/[feature]/components';
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

### Step 2: Create the Feature Page Component

**Location**: `apps/dashboard/src/lib/features/[feature]/pages/[feature].svelte`

**Pattern**:

```svelte
<script lang="ts">
  import { Search } from '@cio/ui/custom/search';
  import { Empty } from '@cio/ui/custom/empty';
  import * as Page from '@cio/ui/base/page';
  import * as Select from '@cio/ui/base/select';
  import SomeIcon from '@lucide/svelte/icons/...';
  import { FeatureCard, FeatureLoader } from '../components';
  import { t } from '$lib/utils/functions/translations';

  let isLoading = $state(false);
  let searchValue = $state('');
  let data = $state([]);
</script>

<Page.BodyHeader align="right">
  <Search placeholder="Search..." bind:value={searchValue} />
  <Select.Root>
    <!-- Select options -->
  </Select.Root>
</Page.BodyHeader>

<div class="w-full">
  {#if isLoading}
    <FeatureLoader />
  {:else if !data.length}
    <Empty
      title={$t('feature.empty_title')}
      description={$t('feature.empty_description')}
      icon={SomeIcon}
      variant="page"
    >
      <FeatureActionButton />
    </Empty>
  {:else}
    {#each data as item}
      <FeatureCard {item} />
    {/each}
  {/if}
</div>
```

### Step 3: Export the Page

**Location**: `apps/dashboard/src/lib/features/[feature]/pages/index.ts`

```typescript
export { default as FeaturePage } from './feature.svelte';
```

---

## Creating Settings Pages

Settings pages follow a specific pattern with layouts and subroutes.

### Step 1: Create Settings Layout

**Location**: `apps/dashboard/src/routes/[context]/settings/+layout.svelte`

```svelte
<script lang="ts">
  interface Props {
    children?: import('svelte').Snippet;
  }

  let { children }: Props = $props();
  import * as Page from '@cio/ui/base/page';
</script>

<Page.Root class="w-full pb-10 md:max-w-3xl lg:mx-auto">
  {@render children?.()}
</Page.Root>
```

### Step 2: Create Default Settings Page

**Location**: `apps/dashboard/src/routes/[context]/settings/+page.svelte`

```svelte
<script lang="ts">
  import { ProfilePage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';

  let profileComponent: ProfilePage | null = $state(null);
  let isLoading = $state(false);

  async function handleUpdate() {
    isLoading = true;
    try {
      await profileComponent?.handleUpdate();
    } finally {
      isLoading = false;
    }
  }
</script>

<svelte:head>
  <title>Settings - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.heading')}</Page.Title>
  </Page.HeaderContent>
  <Page.Action>
    <Button variant="secondary" loading={isLoading} onclick={handleUpdate}>
      {$t('settings.profile.update_profile')}
    </Button>
  </Page.Action>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <ProfilePage bind:this={profileComponent} />
  {/snippet}
</Page.Body>
```

### Step 3: Create Settings Subroute

**Location**: `apps/dashboard/src/routes/[context]/settings/[subroute]/+page.svelte`

```svelte
<script lang="ts">
  import { SubroutePage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Subroute Name - ClassroomIO</title>
</svelte:head>

<Page.Header>
  <Page.HeaderContent>
    <Page.Title>{$t('settings.subroute.heading')}</Page.Title>
  </Page.HeaderContent>
</Page.Header>
<Page.Body>
  {#snippet child()}
    <SubroutePage />
  {/snippet}
</Page.Body>
```

**Note**: Settings pages use subroutes instead of tabs. Each subroute has its own `+page.svelte` file.

---

## Creating Feature Pages

### Feature Page Structure

Feature pages contain all business logic and should be placed in `lib/features/[feature]/pages/`.

**Key Principles**:

- ✅ All business logic goes in the feature page
- ✅ Use `Page.BodyHeader` for filters, search, and view toggles
- ✅ Use `Empty` component for empty states
- ✅ Use `Search` component for search inputs
- ✅ Handle loading states with skeleton/loader components
- ❌ Don't use `Page.Header` or `Page.Action` in feature pages (these are in route files)

### Example Feature Page

```svelte
<script lang="ts">
  import { untrack } from 'svelte';
  import { Search } from '@cio/ui/custom/search';
  import { Empty } from '@cio/ui/custom/empty';
  import * as Page from '@cio/ui/base/page';
  import * as Select from '@cio/ui/base/select';
  import MessageSquareMoreIcon from '@lucide/svelte/icons/message-square-more';
  import { CommunityListLoader, AskCommunityButton } from '../components';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';

  let isLoading = $state(false);
  let searchValue = $state('');
  let discussions = $state([]);
  let selectedId = $state('');

  // Data fetching logic
  async function fetchData() {
    isLoading = true;
    // ... fetch logic
    isLoading = false;
  }

  $effect(() => {
    if ($profile.id && $currentOrg.id) {
      fetchData();
    }
  });
</script>

<Page.BodyHeader align="right">
  <Search placeholder="Search..." bind:value={searchValue} />
  <Select.Root bind:value={selectedId}>
    <Select.Trigger>
      <Select.Value placeholder="Filter..." />
    </Select.Trigger>
    <Select.Content>
      <Select.Item value="all">All</Select.Item>
      <!-- More options -->
    </Select.Content>
  </Select.Root>
</Page.BodyHeader>

<div class="w-full">
  {#if isLoading}
    <CommunityListLoader />
    <CommunityListLoader />
    <CommunityListLoader />
  {:else if !discussions.length}
    <Empty
      title={$t('community.no_question')}
      description={$t('community.ask_a_question')}
      icon={MessageSquareMoreIcon}
      variant="page"
    >
      <AskCommunityButton />
    </Empty>
  {:else}
    {#each discussions as discussion}
      <!-- Discussion content -->
    {/each}
  {/if}
</div>
```

---

## Layout Patterns

### Organization Layout

**Location**: `apps/dashboard/src/routes/org/[slug]/+layout.svelte`

```svelte
<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import { AppHeader } from '$features/ui';
  import { OrgSidebar } from '$features/ui/sidebar/org-sidebar';

  let { data, children } = $props();
</script>

<Sidebar.Provider>
  <OrgSidebar />

  <Sidebar.Inset>
    <AppHeader />

    <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4">
      {@render children?.()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
```

### LMS Layout

**Location**: `apps/dashboard/src/routes/lms/+layout.svelte`

```svelte
<script lang="ts">
  import * as Sidebar from '@cio/ui/base/sidebar';
  import LmsHeader from '$features/ui/navigation/lms-header.svelte';
  import { LMSSidebar } from '$features/ui/sidebar/lms-sidebar';

  let { children }: Props = $props();
</script>

<Sidebar.Provider>
  <LMSSidebar />

  <Sidebar.Inset>
    <LmsHeader />

    <div class="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-4 px-4">
      {@render children?.()}
    </div>
  </Sidebar.Inset>
</Sidebar.Provider>
```

**Key Differences**:

- Org routes use `AppHeader` (includes AppSetup)
- LMS routes use `LmsHeader` (no AppSetup)
- Org routes use `OrgSidebar`
- LMS routes use `LMSSidebar`

---

## Form Patterns (Field.Group)

**IMPORTANT**: Always use `Field.Group` pattern for forms. The old `Row/Grid/Column` pattern is deprecated and removed.

### Field.Group Pattern

**Location**: `apps/dashboard/src/lib/features/[feature]/pages/[feature].svelte`

```svelte
<script lang="ts">
  import * as Field from '@cio/ui/base/field';
  import { Input } from '@cio/ui/base/input';
  import { Button } from '@cio/ui/base/button';
  import { Switch } from '@cio/ui/base/switch';
  import { UploadImage, UnsavedChanges } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';

  let hasUnsavedChanges = $state(false);
  let formData = $state({
    name: '',
    email: '',
    enabled: false
  });

  export async function handleSave() {
    // Save logic
    hasUnsavedChanges = false;
  }
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<Field.Group class="max-w-md! w-full px-2">
  <Field.Set>
    <Field.Legend>{$t('form.section_title')}</Field.Legend>
    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('form.name')}</Field.Label>
        <Input bind:value={formData.name} oninput={() => (hasUnsavedChanges = true)} />
      </Field.Field>
      <Field.Field>
        <Field.Label>{$t('form.email')}</Field.Label>
        <Input bind:value={formData.email} type="email" oninput={() => (hasUnsavedChanges = true)} />
      </Field.Field>
      <Field.Field orientation="horizontal">
        <Switch bind:checked={formData.enabled} onCheckedChange={() => (hasUnsavedChanges = true)} />
        <Field.Label>{$t('form.enabled')}</Field.Label>
      </Field.Field>
    </Field.Group>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('form.another_section')}</Field.Legend>
    <Field.Field>
      <UploadImage bind:avatar src={avatarUrl} change={() => (hasUnsavedChanges = true)} />
    </Field.Field>
  </Field.Set>
</Field.Group>
```

### Field Components

- `<Field.Group>` - Main container (use `class="max-w-md! w-full px-2"`)
- `<Field.Set>` - Section container
- `<Field.Legend>` - Section title
- `<Field.Field>` - Individual field wrapper
- `<Field.Label>` - Field label
- `<Field.Description>` - Field description/help text
- `<Field.Error>` - Field error message
- `<Field.Separator />` - Visual separator between sections
- `orientation="horizontal"` - For switches/checkboxes with labels side-by-side

### Pattern Rules

- ✅ DO: Use `Field.Group` as the main container
- ✅ DO: Use `Field.Set` for logical sections
- ✅ DO: Use `Field.Separator` between sections
- ✅ DO: Use `Field.Legend` for section titles
- ✅ DO: Wrap form inputs in `Field.Field`
- ✅ DO: Use `Field.Label` for input labels
- ✅ DO: Use `orientation="horizontal"` for switches/checkboxes
- ❌ DON'T: Use `Row`, `Grid`, or `Column` components (deprecated)
- ❌ DON'T: Mix Field.Group with old layout components

---

## Navigation Setup

### Adding Items to Organization Navigation

**Location**: `apps/dashboard/src/lib/features/ui/navigation/org-navigation.ts`

```typescript
const baseNavConfig: NavItemConfig[] = [
  // ... existing items
  {
    titleKey: 'org_navigation.new_feature',
    path: '/new-feature',
    icon: NewFeatureIcon,
    matchPattern: '^/org/[^/]+/new-feature(/.*)?$',
    // Optional: requires admin access
    requiresAdmin: true,
    // Optional: nested routes
    nestedRoutes: [
      {
        path: 'subroute',
        titleKey: 'Subroute Name'
      }
    ],
    // Optional: supports dynamic segments
    supportsDynamicSegment: true
  }
];
```

### Adding Items to LMS Navigation

**Location**: `apps/dashboard/src/lib/features/ui/navigation/lms-navigation.ts`

```typescript
const baseNavConfig: NavItemConfig[] = [
  // ... existing items
  {
    titleKey: 'lms_navigation.new_feature',
    path: '/new-feature',
    icon: NewFeatureIcon,
    matchPattern: '^/lms/new-feature(/.*)?$',
    // Optional: conditional display
    show: (currentOrg) => currentOrg?.customization?.feature?.enabled === true,
    // Optional: nested routes
    nestedRoutes: [
      {
        path: 'subroute',
        titleKey: 'Subroute Name'
      }
    ],
    // Optional: supports dynamic segments
    supportsDynamicSegment: true
  }
];
```

### Navigation Item Properties

- `titleKey` - Translation key for the navigation label
- `path` - Route path (relative to context)
- `icon` - Lucide icon component
- `matchPattern` - Regex pattern for active state matching
- `requiresAdmin` - Only show for admin users (org navigation only)
- `show` - Function to conditionally show/hide item
- `nestedRoutes` - Static nested routes (like `community/ask`)
- `supportsDynamicSegment` - Supports dynamic routes (like `community/[slug]`)
- `useHashUrl` - Use '#' for collapsible parent (settings menu)
- `items` - Nested items for collapsible menus (settings sub-items)

---

## Breadcrumb Setup

Breadcrumbs are automatically generated from navigation configuration.

### For Organization Routes

Breadcrumbs use `generateBreadcrumbs()` from `breadcrumb.ts` which reads from `org-navigation.ts`.

### For LMS Routes

Breadcrumbs use `generateLmsBreadcrumbs()` from `lms-breadcrumb.ts` which reads from `lms-navigation.ts`.

### Adding Dynamic Breadcrumbs

For dynamic routes (like `community/[slug]`), add breadcrumb data in the route's `+page.ts`:

```typescript
// routes/org/[slug]/community/[slug]/+page.ts
export async function load({ params }) {
  // Fetch question data
  const question = await fetchQuestion(params.slug);

  return {
    breadcrumb: question.title // This will appear in breadcrumbs
  };
}
```

---

## Complete Examples

### Example 1: Simple Feature Page

**Route**: `routes/org/[slug]/courses/+page.svelte`

```svelte
<script lang="ts">
  import { CoursesPage } from '$features/courses/pages';
  import { t } from '$lib/utils/functions/translations';
  import * as Page from '@cio/ui/base/page';
</script>

<svelte:head>
  <title>Courses - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('courses.title')}</Page.Title>
    </Page.HeaderContent>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CoursesPage />
    {/snippet}
  </Page.Body>
</Page.Root>
```

### Example 2: Settings Page with Save Action

**Route**: `routes/org/[slug]/settings/customize-lms/+page.svelte`

```svelte
<script lang="ts">
  import { CustomizeLmsPage } from '$features/settings/pages';
  import { t } from '$lib/utils/functions/translations';
  import { Button } from '@cio/ui/base/button';
  import * as Page from '@cio/ui/base/page';

  let customizeLmsComponent: CustomizeLmsPage | null = $state(null);
  let isSaving = $state(false);

  async function handleSave() {
    isSaving = true;
    try {
      await customizeLmsComponent?.handleSave();
    } finally {
      isSaving = false;
    }
  }
</script>

<svelte:head>
  <title>Customize LMS - ClassroomIO</title>
</svelte:head>

<Page.Root class="w-full md:max-w-4xl lg:mx-auto">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Title>{$t('components.settings.customize_lms.title')}</Page.Title>
    </Page.HeaderContent>
    <Page.Action>
      <Button variant="default" loading={isSaving} disabled={isSaving} onclick={handleSave}>
        {$t('components.settings.customize_lms.save')}
      </Button>
    </Page.Action>
  </Page.Header>
  <Page.Body>
    {#snippet child()}
      <CustomizeLmsPage bind:this={customizeLmsComponent} />
    {/snippet}
  </Page.Body>
</Page.Root>
```

### Example 3: Form Page Component

**Feature Page**: `lib/features/settings/pages/profile.svelte`

```svelte
<script lang="ts">
  import { profile } from '$lib/utils/store/user';
  import { profileApi } from '$features/auth/api/profile.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { Input } from '@cio/ui/base/input';
  import { UploadImage, UnsavedChanges } from '$features/ui';
  import * as Field from '@cio/ui/base/field';

  let avatar = $state<string | File | undefined>();
  let hasUnsavedChanges = $state(false);

  export async function handleUpdate() {
    await profileApi.submit(
      {
        fullname: $profile.fullname,
        username: $profile.username,
        avatar
      },
      $profile
    );

    if (profileApi.success) {
      hasUnsavedChanges = false;
      avatar = undefined;
    }
  }
</script>

<UnsavedChanges bind:hasUnsavedChanges />

<Field.Group class="max-w-md! w-full px-2">
  <Field.Set>
    <Field.Legend>{$t('settings.profile.profile_picture.heading')}</Field.Legend>
    <Field.Field>
      <UploadImage
        bind:avatar
        src={$profile.avatarUrl}
        widthHeight="w-16 h-16 lg:w-24 lg:h-24"
        change={() => (hasUnsavedChanges = true)}
      />
    </Field.Field>
  </Field.Set>

  <Field.Separator />

  <Field.Set>
    <Field.Legend>{$t('settings.profile.personal_information.heading')}</Field.Legend>
    <Field.Group>
      <Field.Field>
        <Field.Label>{$t('settings.profile.personal_information.full_name')}</Field.Label>
        <Input bind:value={$profile.fullname} oninput={() => (hasUnsavedChanges = true)} />
        {#if profileApi.errors.fullname}
          <Field.Error>{$t(profileApi.errors.fullname)}</Field.Error>
        {/if}
      </Field.Field>
      <!-- More fields -->
    </Field.Group>
  </Field.Set>
</Field.Group>
```

---

## Checklist for New Pages

When creating a new page, follow this checklist:

### Route Setup

- [ ] Create route file at `routes/[context]/[feature]/+page.svelte`
- [ ] Add `Page.Root`, `Page.Header`, `Page.Body` structure
- [ ] Add `<svelte:head>` with page title
- [ ] Import and render feature page component

### Feature Page

- [ ] Create feature page at `lib/features/[feature]/pages/[feature].svelte`
- [ ] Export from `lib/features/[feature]/pages/index.ts`
- [ ] Use `Page.BodyHeader` for filters/search
- [ ] Use `Empty` component for empty states
- [ ] Handle loading states

### Forms (if applicable)

- [ ] Use `Field.Group` pattern (NOT Row/Grid/Column)
- [ ] Use `Field.Set` for sections
- [ ] Use `Field.Separator` between sections
- [ ] Use `Field.Legend` for section titles
- [ ] Wrap inputs in `Field.Field`
- [ ] Add `UnsavedChanges` component if needed

### Navigation (if needed)

- [ ] Add item to `org-navigation.ts` or `lms-navigation.ts`
- [ ] Set appropriate `matchPattern` for active state
- [ ] Add icon component
- [ ] Configure nested routes if needed
- [ ] Configure dynamic segments if needed

### Settings Pages (if applicable)

- [ ] Create `+layout.svelte` with `Page.Root` wrapper
- [ ] Create default `+page.svelte` for main settings
- [ ] Create subroute `+page.svelte` files for each subroute
- [ ] Export page components from `$features/settings/pages`

---

## Common Patterns

### Page Width Classes

- `class="w-full"` - Full width
- `class="w-full md:max-w-3xl lg:mx-auto"` - Centered, max width on larger screens (settings pages)
- `class="w-full md:max-w-4xl lg:mx-auto"` - Slightly wider (customize-lms)
- `class="mx-auto w-full max-w-6xl"` - Wide content area (main layouts)

### Page Actions

Actions in `Page.Action` typically include:

- Save/Update buttons
- Create/Add buttons
- Export buttons
- Feature-specific action buttons

### Loading States

Use skeleton loaders or spinner components:

```svelte
{#if isLoading}
  <FeatureLoader />
  <FeatureLoader />
  <FeatureLoader />
{:else}
  <!-- Content -->
{/if}
```

### Empty States

Always use the `Empty` component:

```svelte
<Empty title={$t('feature.empty_title')} description={$t('feature.empty_description')} icon={SomeIcon} variant="page">
  <ActionButton />
</Empty>
```

---

## Best Practices

1. **Separation of Concerns**: Route files handle routing structure, feature pages handle business logic
2. **Reusability**: Feature pages can be imported and used in different contexts
3. **Consistency**: All pages follow the same structure for maintainability
4. **Design System**: Use established components (`Page.*`, `Field.*`, `Empty`, `Search`)
5. **State Management**: Keep state local to feature pages or use feature-specific stores
6. **Translation Keys**: Always use translation keys from `$t()` function
7. **Type Safety**: Use TypeScript types for props and state
8. **Accessibility**: Use semantic HTML and proper ARIA labels

---

## Migration from Old Patterns

If you encounter old patterns, migrate them:

### Old: Row/Grid/Column Pattern

```svelte
<!-- OLD - DON'T USE -->
<Grid>
  <Row>
    <Column sm={4} md={4} lg={4}>
      <SectionTitle>Title</SectionTitle>
    </Column>
    <Column sm={8} md={8} lg={8}>
      <InputField />
    </Column>
  </Row>
</Grid>
```

### New: Field.Group Pattern

```svelte
<!-- NEW - USE THIS -->
<Field.Group class="max-w-md! w-full px-2">
  <Field.Set>
    <Field.Legend>Title</Field.Legend>
    <Field.Field>
      <Field.Label>Label</Field.Label>
      <Input />
    </Field.Field>
  </Field.Set>
</Field.Group>
```

---

## Additional Resources

- See `ROUTE_PAGE_SETUP.md` for more details on feature page structure
- See existing pages in `routes/org/[slug]/` and `routes/lms/` for examples
- See `lib/features/settings/pages/` for form examples
- See `lib/features/community/pages/` for list page examples
