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
  import {
    normalizeLandingPageSettings,
    themeHeaderShellClass,
    themeStyle,
    themeRendersNavInsideHero
  } from '$features/org/utils/landing-page';

  import { LandingButton, OrgLandingPageFooter } from '@cio/ui/custom/org-landing-page';

  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Input } from '@cio/ui/base/input';
  import { Empty } from '@cio/ui/custom/empty';
  import { Separator } from '@cio/ui/base/separator';
  import * as Pagination from '@cio/ui/base/pagination';

  let { data } = $props();

  let selectedTags = $derived<string[]>(data.activeTags || []);
  let selectedTypes = $derived<string[]>(data.activeTypes || []);
  let activeSearch = $derived(data.activeSearch || '');
  let activePricing = $derived<'free' | 'paid' | undefined>(data.activePricing);
  let searchInput = $state('');

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

  const shellClass = $derived(`ui:min-h-screen ${themeHeaderShellClass(landingSettings.theme)}`);
  const shellStyle = $derived(themeStyle(landingSettings.theme));
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

<PoweredBy />

<main class={shellClass} style={shellStyle}>
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
        <div class="ui:w-full ui:max-w-xl ui:mx-auto relative">
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
              aria-label="Clear search"
            >
              <XIcon class="ui:size-4" />
            </button>
          {/if}
        </div>
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
        <div class="ui:w-full ui:max-w-xl ui:mx-auto relative">
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
              aria-label="Clear search"
            >
              <XIcon class="ui:size-4" />
            </button>
          {/if}
        </div>
      {/snippet}
    </HeroComponent>
  {/if}

  <section class="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
    <div class="mb-6 flex items-center justify-end gap-4">
      <LandingButton variant="secondary" onclick={clearFilters} disabled={!hasActiveFilters}>
        {$t('public_courses.clear_filters')}
      </LandingButton>
    </div>

    <div class="grid grid-cols-[minmax(0,9.5rem)_minmax(0,1fr)] gap-4 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
      <aside
        class="ui:bg-[var(--landing-card)] ui:text-[var(--landing-fg)] ui:border-[var(--landing-border)] sticky top-4 flex max-h-[calc(100dvh-2rem)] flex-col self-start rounded-lg border"
      >
        <div class="p-4 pb-3">
          <h2 class="text-base font-semibold">{$t('public_courses.filters.title')}</h2>
          <p class="ui:text-[var(--landing-fg-muted)] text-xs">{$t('public_courses.filters.help')}</p>
        </div>

        <Separator class="ui:bg-[var(--landing-border)]" />

        <div class="flex-1 overflow-y-auto p-4">
          <div class="space-y-5">
            <div class="space-y-2">
              <h3 class="text-sm font-semibold">{$t('public_courses.filters.types_title')}</h3>
              <div class="space-y-2">
                {#each COURSE_TYPES as courseType (courseType.value)}
                  <label
                    class="ui:border-[var(--landing-border)] ui:hover:bg-[var(--landing-card-soft)] flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2"
                  >
                    <Checkbox
                      checked={selectedTypes.includes(courseType.value)}
                      onCheckedChange={(checked) => toggleType(courseType.value, Boolean(checked))}
                    />
                    <span class="text-sm">{courseType.label}</span>
                  </label>
                {/each}
              </div>
            </div>

            <Separator class="ui:bg-[var(--landing-border)]" />

            <div class="space-y-2">
              <h3 class="text-sm font-semibold">{$t('public_courses.filters.pricing_title')}</h3>
              <div class="space-y-2">
                {#each [{ value: 'free', label: $t('public_courses.filters.pricing_free') }, { value: 'paid', label: $t('public_courses.filters.pricing_paid') }] as option (option.value)}
                  <label
                    class="ui:border-[var(--landing-border)] ui:hover:bg-[var(--landing-card-soft)] flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2"
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
            </div>

            {#if displayTagGroups.length > 0}
              <Separator class="ui:bg-[var(--landing-border)]" />

              <div class="space-y-2">
                <h3 class="text-sm font-semibold">{$t('public_courses.filters.tags_title')}</h3>
              </div>

              <div class="space-y-5">
                {#each displayTagGroups as group (group.id)}
                  <div class="space-y-2">
                    <div class="space-y-1">
                      <h3 class="text-sm font-semibold">{group.name}</h3>
                      {#if group.description}
                        <p class="ui:text-[var(--landing-fg-muted)] text-xs">{group.description}</p>
                      {/if}
                    </div>

                    <div class="space-y-2">
                      {#each group.tags as tag (tag.id)}
                        <label
                          class="ui:border-[var(--landing-border)] ui:hover:bg-[var(--landing-card-soft)] flex cursor-pointer items-center justify-between rounded-md border px-3 py-2"
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
                          <span class="ui:text-[var(--landing-fg-muted)] text-xs">{tag.courseCount}</span>
                        </label>
                      {/each}
                    </div>
                  </div>
                {/each}
              </div>
            {/if}
          </div>
        </div>
      </aside>

      <div class="ui:@container space-y-4">
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

  <OrgLandingPageFooter
    orgName={data.org.name}
    logoUrl={data.org.avatarUrl ?? undefined}
    footer={landingSettings.footer}
    variant={landingSettings.theme}
  />
</main>
