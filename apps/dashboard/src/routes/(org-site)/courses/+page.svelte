<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { SvelteSet, SvelteURLSearchParams } from 'svelte/reactivity';

  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';
  import { basePath } from '$lib/utils/store/app';

  import { PoweredBy } from '$features/ui';
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';
  import XIcon from '@lucide/svelte/icons/x';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import { normalizeLandingPageSettings, themeRendersNavInsideHero } from '$features/org/utils/landing-page';

  import { LandingButton, LandingThemeScope, OrgLandingPageFooter } from '@cio/ui/custom/org-landing-page';

  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Input } from '@cio/ui/base/input';
  import { Empty } from '@cio/ui/custom/empty';
  import { Separator } from '@cio/ui/base/separator';
  import * as Pagination from '@cio/ui/base/pagination';
  import * as Sheet from '@cio/ui/base/sheet';
  import { Accordion } from '@cio/ui';

  let { data } = $props();

  let selectedTags = $derived<string[]>(data.activeTags || []);
  let selectedTypes = $derived<string[]>(data.activeTypes || []);
  let activeSearch = $derived(data.activeSearch || '');
  let activePricing = $derived<'free' | 'paid' | undefined>(data.activePricing);
  let searchInput = $state('');
  let filterSheetOpen = $state(false);
  type FilterSection = 'types' | 'pricing' | 'tags';
  // let openFilterSection = $state<FilterSection | null>('types');
  let openFilterSection = $state<FilterSection | string[] | undefined>('types');

  $effect(() => {
    searchInput = activeSearch;
  });

  const COURSE_TYPES = [
    { value: 'SELF_PACED', label: t.get('analytics.popularTypes.types.SELF_PACED') },
    { value: 'LIVE_CLASS', label: t.get('analytics.popularTypes.types.LIVE_CLASS') },
    { value: 'COMPLIANCE', label: t.get('analytics.popularTypes.types.COMPLIANCE') },
    { value: 'PUBLIC', label: t.get('analytics.popularTypes.types.PUBLIC') }
  ] as const;

  const landingSettings = $derived(normalizeLandingPageSettings(data.org.landingpage));

  const authAction = $derived(
    $user.isLoggedIn
      ? {
          label: t.get($basePath === '/lms' || $basePath === '#' ? 'navigation.goto_lms' : 'navigation.goto_dashboard'),
          href: resolve($basePath !== '#' ? $basePath : '/lms', {})
        }
      : {
          label: t.get('navigation.login'),
          href: '/login'
        }
  );

  const navInsideHero = $derived(themeRendersNavInsideHero(landingSettings.theme));

  const NavComponent = $derived(data.theme.Nav);
  const HeroComponent = $derived(data.theme.Hero);
  const CourseCardComponent = $derived(data.theme.CourseCard);
  const courseGridClass = $derived(data.theme.coursesGridClass);

  const heroProps = $derived({
    ...landingSettings.hero,
    heading: t.get('public_courses.heading'),
    image: ''
  });

  const activeFilterCount = $derived(selectedTags.length + selectedTypes.length + (activePricing ? 1 : 0));

  async function applyFilters(next: {
    tags?: string[];
    types?: string[];
    search?: string;
    pricing?: 'free' | 'paid' | null;
  }) {
    const params = new SvelteURLSearchParams(page.url.searchParams);
    const nextTags = next.tags ?? selectedTags;
    const nextTypes = next.types ?? selectedTypes;
    const nextSearch = next.search !== undefined ? next.search : activeSearch;
    const nextPricing = 'pricing' in next ? next.pricing : activePricing;

    nextTags.length ? params.set('tags', nextTags.join(',')) : params.delete('tags');
    nextTypes.length ? params.set('types', nextTypes.join(',')) : params.delete('types');
    nextSearch ? params.set('search', nextSearch) : params.delete('search');
    nextPricing ? params.set('pricing', nextPricing) : params.delete('pricing');
    params.delete('page');

    const query = params.toString();
    const suffix = query ? `?${query}` : '';

    await goto(resolve(`/courses${suffix}`, {}), {
      keepFocus: true,
      noScroll: true,
      invalidateAll: true
    });
  }

  let isDesktop = $state(false);

  let restoreSheetOnMobile = $state(false);

  $effect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(min-width: 1024px)');

    function syncViewport(matches: boolean) {
      isDesktop = matches;

      if (matches) {
        openFilterSection = ['types', 'pricing', 'tags'];

        if (filterSheetOpen) {
          restoreSheetOnMobile = true;
          filterSheetOpen = false;
        }
      } else {
        openFilterSection = 'types';

        if (restoreSheetOnMobile) {
          filterSheetOpen = true;
          restoreSheetOnMobile = false;
        }
      }
    }

    syncViewport(mql.matches);

    const onChange = (e: MediaQueryListEvent) => syncViewport(e.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  });

  async function goToPage(nextPage: number) {
    if (nextPage === data.pagination.page) {
      return;
    }

    const params = new SvelteURLSearchParams(page.url.searchParams);

    if (nextPage > 1) {
      params.set('page', String(nextPage));
    } else {
      params.delete('page');
    }

    const query = params.toString();
    const suffix = query ? `?${query}` : '';

    await goto(resolve(`/courses${suffix}`, {}), { invalidateAll: true });
  }

  function toggleTag(tagSlug: string, checked: boolean) {
    const next = new SvelteSet(selectedTags);
    if (checked) {
      next.add(tagSlug);
    } else {
      next.delete(tagSlug);
    }

    applyFilters({ tags: Array.from(next) });
  }

  function toggleType(typeValue: string, checked: boolean) {
    const next = new SvelteSet(selectedTypes);
    if (checked) {
      next.add(typeValue);
    } else {
      next.delete(typeValue);
    }

    applyFilters({ types: Array.from(next) });
  }

  function clearFilters() {
    if (selectedTags.length === 0 && selectedTypes.length === 0 && !activeSearch && !activePricing) {
      return;
    }

    searchInput = '';
    applyFilters({ tags: [], types: [], search: '', pricing: null });
  }

  let searchDebounce: ReturnType<typeof setTimeout>;
  function onSearchInput(value: string) {
    searchInput = value;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => applyFilters({ search: value }), 300);
  }

  function onSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      clearTimeout(searchDebounce);
      applyFilters({ search: searchInput });
    }
  }

  function clearSearch() {
    searchInput = '';
    clearTimeout(searchDebounce);
    applyFilters({ search: '' });
  }

  function isTagSelected(tagSlug: string) {
    return selectedTags.includes(tagSlug);
  }

  const displayTagGroups = $derived.by(() => {
    const sourceGroups = data.tagGroups ?? [];
    const tagsByGroupId: Record<string, (typeof sourceGroups)[number]['tags']> = {};

    for (const group of sourceGroups) {
      for (const tag of group.tags ?? []) {
        const groupId = tag.groupId || group.id;
        const existing = tagsByGroupId[groupId] ?? [];

        if (!existing.some((item) => item.id === tag.id)) {
          existing.push(tag);
          tagsByGroupId[groupId] = existing;
        }
      }
    }

    return sourceGroups.map((group) => ({
      ...group,
      tags: tagsByGroupId[group.id] ?? []
    }));
  });

  const hasActiveFilters = $derived(
    selectedTags.length > 0 || selectedTypes.length > 0 || !!activeSearch || !!activePricing
  );
</script>

{#snippet searchField()}
  <div class="ui:relative ui:mx-auto ui:w-full ui:max-w-xl">
    <Input
      type="text"
      value={searchInput}
      oninput={(e) => onSearchInput(e.currentTarget.value)}
      onkeydown={onSearchKeydown}
      placeholder={$t('public_courses.filters.search_placeholder')}
      class="ui:pr-8"
    />
    {#if searchInput}
      <button
        type="button"
        onclick={clearSearch}
        class="ui:text-muted-foreground ui:hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
        aria-label={$t('public_courses.filters.clear_search')}
      >
        <XIcon class="ui:size-4" />
      </button>
    {/if}
  </div>
{/snippet}

{#snippet filtersContent(showHeader = true)}
  {#if showHeader}
    <div class="p-4 pb-3">
      <h2 class="text-base font-semibold">{$t('public_courses.filters.title')}</h2>
      <p class="ui:text-[var(--landing-fg-muted)] text-xs">{$t('public_courses.filters.help')}</p>
    </div>
    <Separator class="ui:bg-[var(--landing-border)]" />
  {/if}

  <div class="px-2 pb-2">
    {#key isDesktop}
      <Accordion.Root type={isDesktop ? 'multiple' : 'single'} bind:value={openFilterSection as never} class="w-full">
        <!-- TYPES -->
        <Accordion.Item value="types" class="ui:border-border">
          <Accordion.Trigger class="ui:px-2 ui:text-sm ui:font-semibold ui:uppercase ui:tracking-wide">
            {$t('public_courses.filters.types_title')}
          </Accordion.Trigger>
          <Accordion.Content>
            <div class="space-y-2 px-1 pb-2">
              {#each COURSE_TYPES as courseType (courseType.value)}
                <label
                  class="ui:border-border ui:hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2"
                >
                  <Checkbox
                    checked={selectedTypes.includes(courseType.value)}
                    onCheckedChange={(checked) => toggleType(courseType.value, Boolean(checked))}
                  />
                  <span class="text-sm">{courseType.label}</span>
                </label>
              {/each}
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <!-- PRICING -->
        <Accordion.Item value="pricing" class="ui:border-border">
          <Accordion.Trigger class="ui:px-2 ui:text-sm ui:font-semibold ui:uppercase ui:tracking-wide">
            {$t('public_courses.filters.pricing_title')}
          </Accordion.Trigger>
          <Accordion.Content>
            <div class="space-y-2 px-1 pb-2">
              {#each [{ value: 'free', label: $t('public_courses.filters.pricing_free') }, { value: 'paid', label: $t('public_courses.filters.pricing_paid') }] as option (option.value)}
                <label
                  class="ui:border-border ui:hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2"
                >
                  <Checkbox
                    checked={activePricing === option.value}
                    onCheckedChange={(checked) =>
                      applyFilters({ pricing: checked ? (option.value as 'free' | 'paid') : null })}
                  />
                  <span class="text-sm">{option.label}</span>
                </label>
              {/each}
            </div>
          </Accordion.Content>
        </Accordion.Item>

        <!-- TAGS -->
        {#if displayTagGroups.length > 0}
          <Accordion.Item value="tags" class="ui:border-border">
            <Accordion.Trigger class="ui:px-2 ui:text-sm ui:font-semibold ui:uppercase ui:tracking-wide">
              {$t('public_courses.filters.tags_title')}
            </Accordion.Trigger>
            <Accordion.Content>
              <div class="space-y-5 px-1 pb-2">
                {#each displayTagGroups as group (group.id)}
                  <div class="space-y-2">
                    <div class="space-y-1">
                      <h3 class="text-sm font-semibold">{group.name}</h3>
                      {#if group.description}
                        <p class="ui:text-muted-foreground text-xs">{group.description}</p>
                      {/if}
                    </div>

                    <div class="space-y-2">
                      {#each group.tags as tag (tag.id)}
                        <label
                          class="ui:border-border ui:hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-md border px-3 py-2"
                        >
                          <div class="flex items-center gap-2">
                            <Checkbox
                              checked={isTagSelected(tag.slug)}
                              onCheckedChange={(checked) => toggleTag(tag.slug, Boolean(checked))}
                            />
                            <span
                              class="inline-block h-2.5 w-2.5 rounded-full border"
                              style={`background-color: ${tag.color}`}
                              aria-hidden="true"
                            ></span>
                            <span class="text-sm">{tag.name}</span>
                          </div>
                          <span class="ui:text-muted-foreground text-xs">{tag.courseCount}</span>
                        </label>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            </Accordion.Content>
          </Accordion.Item>
        {/if}
      </Accordion.Root>
    {/key}
  </div>
{/snippet}

<PoweredBy />

<LandingThemeScope theme={landingSettings.theme} class="ui:font-sans">
  <main>
    {#if navInsideHero}
      <HeroComponent hero={heroProps} orgName={data.org.name} showActions={false} compact={true}>
        {#snippet navigation()}
          <NavComponent
            orgName={data.org.name}
            logoUrl={data.org.avatarUrl ?? undefined}
            navItems={landingSettings.navItems}
            {authAction}
          />
        {/snippet}
        {#snippet children()}
          {@render searchField()}
        {/snippet}
      </HeroComponent>
    {:else}
      <NavComponent
        orgName={data.org.name}
        logoUrl={data.org.avatarUrl ?? undefined}
        navItems={landingSettings.navItems}
        {authAction}
      />
      <HeroComponent hero={heroProps} orgName={data.org.name} showActions={false} compact={true}>
        {#snippet children()}
          {@render searchField()}
        {/snippet}
      </HeroComponent>
    {/if}

    <section class="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <!-- Actions row -->
      <div class="mb-6 flex items-center justify-between gap-3">
        <!-- Mobile only -->
        <div class="lg:hidden">
          <LandingButton variant="secondary" onclick={() => (filterSheetOpen = true)}>
            <FilterIcon class="ui:size-4" />
            {$t('public_courses.filters.title')}
            {#if activeFilterCount > 0}
              <span
                class="ui:bg-primary ui:text-primary-foreground ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs"
              >
                {activeFilterCount}
              </span>
            {/if}
          </LandingButton>
        </div>

        <div class="ml-auto">
          <LandingButton variant="secondary" onclick={clearFilters} disabled={!hasActiveFilters}>
            {$t('public_courses.clear_filters')}
          </LandingButton>
        </div>
      </div>

      <!-- Layout: 1 col mobile, sidebar + content on desktop -->
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
        <!-- Desktop sidebar -->
        <aside
          class="ui:bg-[var(--landing-card)] ui:text-[var(--landing-fg)] ui:border-[var(--landing-border)] sticky top-4 hidden max-h-[calc(100dvh-2rem)] flex-col self-start overflow-hidden rounded-lg border lg:flex"
        >
          <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {@render filtersContent(true)}
          </div>
        </aside>

        <!-- Course list -->
        <div class="ui:@container min-w-0 space-y-4">
          {#if data.courses.length === 0}
            <Empty
              icon={LibraryBigIcon}
              title={$t('public_courses.empty.title')}
              description={$t('public_courses.empty.description')}
              variant="page"
            />
          {:else}
            <div class={courseGridClass}>
              {#each data.courses as course, index (course.id)}
                <CourseCardComponent {course} {index} />
              {/each}
            </div>

            {#if data.pagination.totalPages > 1}
              <Pagination.Root
                count={data.pagination.total}
                perPage={data.pagination.perPage}
                page={data.pagination.page}
                onPageChange={goToPage}
                class="mt-8"
              >
                {#snippet children({ pages, currentPage })}
                  <Pagination.Content>
                    <Pagination.Item>
                      <Pagination.PrevButton />
                    </Pagination.Item>
                    {#each pages as pageItem (pageItem.key)}
                      {#if pageItem.type === 'ellipsis'}
                        <Pagination.Item>
                          <Pagination.Ellipsis />
                        </Pagination.Item>
                      {:else}
                        <Pagination.Item>
                          <Pagination.Link page={pageItem} isActive={currentPage === pageItem.value}>
                            {pageItem.value}
                          </Pagination.Link>
                        </Pagination.Item>
                      {/if}
                    {/each}
                    <Pagination.Item>
                      <Pagination.NextButton />
                    </Pagination.Item>
                  </Pagination.Content>
                {/snippet}
              </Pagination.Root>
            {/if}
          {/if}
        </div>
      </div>
    </section>

    <!-- Mobile filter sheet -->
    <Sheet.Root bind:open={filterSheetOpen}>
      <Sheet.Content
        side="right"
        portalProps={{ disabled: true }}
        class="ui:flex ui:w-full ui:flex-col ui:p-0 ui:sm:max-w-md"
      >
        <Sheet.Header class="ui:border-b ui:px-4 ui:py-4">
          <Sheet.Title>{$t('public_courses.filters.title')}</Sheet.Title>
          <Sheet.Description>
            {$t('public_courses.filters.selected')}
            <span
              class="ui:bg-muted ui:text-foreground ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium"
            >
              {activeFilterCount}
            </span>
          </Sheet.Description>
        </Sheet.Header>

        <div class="ui:min-h-0 ui:flex-1 ui:overflow-y-auto">
          {@render filtersContent(false)}
        </div>

        <div class="ui:flex ui:gap-3 ui:border-t ui:p-4">
          <LandingButton variant="secondary" class="ui:flex-1" onclick={clearFilters}>
            {$t('public_courses.clear_filters')}
          </LandingButton>
          <LandingButton class="ui:flex-1" onclick={() => (filterSheetOpen = false)}
            >{$t('public_courses.filters.save_changes')}</LandingButton
          >
        </div>
      </Sheet.Content>
    </Sheet.Root>

    <OrgLandingPageFooter
      orgName={data.org.name}
      logoUrl={data.org.avatarUrl ?? undefined}
      footer={landingSettings.footer}
      variant={landingSettings.theme}
    />
  </main>
</LandingThemeScope>
