<script lang="ts">
  /*
   * routes/(org-site)/courses/+page.svelte, with the server load replaced by an in-page filter over the
   * published courses the host hands in. Same structure as production: the theme's nav and hero (search field in
   * the hero), a filter sidebar (Types, Pricing, Tags) on desktop and a Filter sheet on mobile, the theme's course
   * cards, pagination, the empty state and the footer. The API's filters are reproduced in `queryCourses`
   * (apps/api getPublicCourses): types in list, search on title or description, pricing by cost, tags, 6 per page.
   */
  import { onDestroy, onMount, untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import LibraryBigIcon from '@lucide/svelte/icons/library-big';
  import XIcon from '@lucide/svelte/icons/x';
  import FilterIcon from '@lucide/svelte/icons/filter';
  import { LandingButton, LandingThemeScope, OrgLandingPageFooter } from '@cio/ui/custom/org-landing-page';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Input } from '@cio/ui/base/input';
  import { Empty } from '@cio/ui/custom/empty';
  import { Separator } from '@cio/ui/base/separator';
  import * as Pagination from '@cio/ui/base/pagination';
  import * as Sheet from '@cio/ui/base/sheet';
  import * as Accordion from '@cio/ui/base/accordion';
  import { t } from './copy';
  import { THEME_BUNDLES, themeRendersNavInsideHero } from './themes';

  type CatalogCourse = {
    id: string;
    typeValue: string;
    paid: boolean;
    tags?: Array<{ id: string; slug: string }>;
    title: string;
    description: string;
  } & Record<string, unknown>;

  type TagGroup = {
    id: string;
    name: string;
    description?: string;
    tags: Array<{ id: string; slug: string; name: string; color: string; courseCount: number; groupId: string }>;
  };

  interface Props {
    theme: string;
    orgName: string;
    logoUrl?: string;
    navItems: Array<{ label: string; href: string }>;
    authAction?: { label: string; href: string };
    learnerAccount?: unknown;
    hero: Record<string, unknown>;
    footer: unknown;
    courses: CatalogCourse[];
    tagGroups?: TagGroup[];
    perPage?: number;
  }

  let { theme, orgName, logoUrl, navItems, authAction, learnerAccount, hero, footer, courses, tagGroups = [], perPage = 6 }: Props =
    $props();

  const COURSE_TYPES = [
    { value: 'SELF_PACED', label: t('analytics.popularTypes.types.SELF_PACED') },
    { value: 'LIVE_CLASS', label: t('analytics.popularTypes.types.LIVE_CLASS') },
    { value: 'COMPLIANCE', label: t('analytics.popularTypes.types.COMPLIANCE') },
    { value: 'PUBLIC', label: t('analytics.popularTypes.types.PUBLIC') }
  ] as const;

  const bundle = $derived(THEME_BUNDLES[theme] ?? THEME_BUNDLES.quartz);
  const NavComponent = $derived(bundle.nav);
  const HeroComponent = $derived(bundle.hero);
  const CourseCardComponent = $derived(bundle.courseCard);
  const courseGridClass = $derived(bundle.coursesGridClass);
  const navInsideHero = $derived(themeRendersNavInsideHero(theme));
  const heroProps = $derived({ ...hero, heading: t('public_courses.heading'), image: '' });

  function readQuery() {
    const params = new URLSearchParams(window.location.search);
    const list = (name: string) =>
      (params.get(name) ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    const rawPricing = params.get('pricing');
    const requestedPage = Number(params.get('page'));

    return {
      tags: list('tags'),
      types: list('types'),
      search: params.get('search')?.trim() ?? '',
      pricing: (rawPricing === 'free' || rawPricing === 'paid' ? rawPricing : null) as 'free' | 'paid' | null,
      page: Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1
    };
  }

  const initial = readQuery();
  let selectedTags = $state<string[]>(initial.tags);
  let selectedTypes = $state<string[]>(initial.types);
  let activePricing = $state<'free' | 'paid' | null>(initial.pricing);
  let activeSearch = $state(initial.search);
  let currentPage = $state(initial.page);
  let searchDraft = $state(initial.search);
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  let filterSheetOpen = $state(false);
  let openFilterSection = $state<string | string[] | undefined>('types');
  let isDesktop = $state(false);
  let restoreSheetOnMobile = false;

  function pushQuery(replace = false) {
    const params = new URLSearchParams();

    if (selectedTags.length) params.set('tags', selectedTags.join(','));
    if (selectedTypes.length) params.set('types', selectedTypes.join(','));
    if (activeSearch) params.set('search', activeSearch);
    if (activePricing) params.set('pricing', activePricing);
    if (currentPage > 1) params.set('page', String(currentPage));

    const query = params.toString();
    const url = `${window.location.pathname}${query ? `?${query}` : ''}`;

    if (replace) history.replaceState(null, '', url);
    else history.pushState(null, '', url);
  }

  function queryCourses() {
    const normalizedSearch = activeSearch.toLowerCase();
    const matches = courses.filter((course) => {
      if (selectedTypes.length && !selectedTypes.includes(course.typeValue)) return false;
      if (activePricing === 'free' && course.paid) return false;
      if (activePricing === 'paid' && !course.paid) return false;
      if (selectedTags.length && !(course.tags ?? []).some((tag) => selectedTags.includes(tag.slug))) return false;

      if (normalizedSearch) {
        const haystack = `${course.title} ${course.description}`.toLowerCase();

        if (!haystack.includes(normalizedSearch)) return false;
      }

      return true;
    });
    const totalPages = Math.ceil(matches.length / perPage);
    const page = Math.min(currentPage, Math.max(totalPages, 1));

    return {
      courses: matches.slice((page - 1) * perPage, page * perPage),
      total: matches.length,
      totalPages,
      page
    };
  }

  const result = $derived(queryCourses());
  const activeFilterCount = $derived(selectedTags.length + selectedTypes.length + (activePricing ? 1 : 0));
  const hasActiveFilters = $derived(
    selectedTags.length > 0 || selectedTypes.length > 0 || !!activeSearch || !!activePricing
  );

  function applySearch(next: string) {
    clearTimeout(searchTimer);

    const trimmed = next.trim();

    if (trimmed === activeSearch) return;

    activeSearch = trimmed;
    currentPage = 1;
    pushQuery();
  }

  function onSearchInput(value: string) {
    searchDraft = value;
    clearTimeout(searchTimer);

    if (value.trim() === '') {
      applySearch('');
      return;
    }

    searchTimer = setTimeout(() => applySearch(value), 300);
  }

  function onSearchKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter') applySearch(searchDraft);
  }

  function toggleType(typeValue: string, checked: boolean) {
    const next = new SvelteSet(selectedTypes);

    if (checked) next.add(typeValue);
    else next.delete(typeValue);

    selectedTypes = [...next];
    currentPage = 1;
    applySearchPending();
    pushQuery();
  }

  function toggleTag(tagSlug: string, checked: boolean) {
    const next = new SvelteSet(selectedTags);

    if (checked) next.add(tagSlug);
    else next.delete(tagSlug);

    selectedTags = [...next];
    currentPage = 1;
    applySearchPending();
    pushQuery();
  }

  function togglePricing(nextPricing: 'free' | 'paid' | null) {
    activePricing = nextPricing;
    currentPage = 1;
    applySearchPending();
    pushQuery();
  }

  function applySearchPending() {
    clearTimeout(searchTimer);
    activeSearch = searchDraft.trim();
  }

  function clearFilters() {
    if (!hasActiveFilters) return;

    clearTimeout(searchTimer);
    searchDraft = '';
    activeSearch = '';
    selectedTags = [];
    selectedTypes = [];
    activePricing = null;
    currentPage = 1;
    pushQuery();
  }

  function goToPage(nextPage: number) {
    if (nextPage === result.page) return;

    applySearchPending();
    currentPage = nextPage;
    pushQuery();
    window.scrollTo({ top: 0 });
  }

  function onPopState() {
    const query = readQuery();

    selectedTags = query.tags;
    selectedTypes = query.types;
    activePricing = query.pricing;
    activeSearch = query.search;
    searchDraft = query.search;
    currentPage = query.page;
  }

  onMount(() => {
    window.addEventListener('popstate', onPopState);

    const mediaQuery = window.matchMedia('(min-width: 1024px)');

    function syncViewport(matches: boolean) {
      isDesktop = matches;

      if (matches) {
        openFilterSection = ['types', 'pricing', 'tags'];

        if (untrack(() => filterSheetOpen)) {
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

    syncViewport(mediaQuery.matches);

    const onChange = (event: MediaQueryListEvent) => syncViewport(event.matches);

    mediaQuery.addEventListener('change', onChange);

    return () => {
      window.removeEventListener('popstate', onPopState);
      mediaQuery.removeEventListener('change', onChange);
    };
  });

  onDestroy(() => clearTimeout(searchTimer));
</script>

{#snippet searchField()}
  <div class="relative mx-auto w-full max-w-xl">
    <Input
      type="text"
      value={searchDraft}
      oninput={(event) => onSearchInput(event.currentTarget.value)}
      onkeydown={onSearchKeydown}
      placeholder={t('public_courses.filters.search_placeholder')}
      class="ui:text-foreground pr-8!"
    />
    {#if searchDraft}
      <button
        type="button"
        onclick={() => onSearchInput('')}
        class="ui:text-muted-foreground ui:hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2"
        aria-label={t('public_courses.filters.clear_search')}
      >
        <XIcon class="size-4" />
      </button>
    {/if}
  </div>
{/snippet}

{#snippet filtersContent(showHeader = true)}
  {#if showHeader}
    <div class="p-4 pb-3">
      <h2 class="text-base font-semibold">{t('public_courses.filters.title')}</h2>
      <p class="text-xs text-(--landing-fg-muted)">{t('public_courses.filters.help')}</p>
    </div>
    <Separator class="bg-(--landing-border)" />
  {/if}

  <div class="px-2 pb-2">
    {#key isDesktop}
      <Accordion.Root type={isDesktop ? 'multiple' : 'single'} bind:value={openFilterSection as never} class="w-full">
        <Accordion.Item value="types" class="ui:border-border">
          <Accordion.Trigger class="px-2 text-sm font-semibold tracking-wide uppercase">
            {t('public_courses.filters.types_title')}
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

        <Accordion.Item value="pricing" class="ui:border-border">
          <Accordion.Trigger class="px-2 text-sm font-semibold tracking-wide uppercase">
            {t('public_courses.filters.pricing_title')}
          </Accordion.Trigger>
          <Accordion.Content>
            <div class="space-y-2 px-1 pb-2">
              {#each [{ value: 'free', label: t('public_courses.filters.pricing_free') }, { value: 'paid', label: t('public_courses.filters.pricing_paid') }] as option (option.value)}
                <label
                  class="ui:border-border ui:hover:bg-muted/50 flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2"
                >
                  <Checkbox
                    checked={activePricing === option.value}
                    onCheckedChange={(checked) => togglePricing(checked ? (option.value as 'free' | 'paid') : null)}
                  />
                  <span class="text-sm">{option.label}</span>
                </label>
              {/each}
            </div>
          </Accordion.Content>
        </Accordion.Item>

        {#if tagGroups.length > 0}
          <Accordion.Item value="tags" class="ui:border-border">
            <Accordion.Trigger class="px-2 text-sm font-semibold tracking-wide uppercase">
              {t('public_courses.filters.tags_title')}
            </Accordion.Trigger>
            <Accordion.Content>
              <div class="space-y-5 px-1 pb-2">
                {#each tagGroups as group (group.id)}
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
                              checked={selectedTags.includes(tag.slug)}
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

<LandingThemeScope theme={theme as never} class="font-sans">
  <main>
    {#if navInsideHero}
      <HeroComponent hero={heroProps} {orgName} showActions={false} compact={true}>
        {#snippet navigation()}
          <NavComponent {orgName} {logoUrl} {navItems} {authAction} {learnerAccount} />
        {/snippet}
        {#snippet children()}
          {@render searchField()}
        {/snippet}
      </HeroComponent>
    {:else}
      <NavComponent {orgName} {logoUrl} {navItems} {authAction} {learnerAccount} />
      <HeroComponent hero={heroProps} {orgName} showActions={false} compact={true}>
        {#snippet children()}
          {@render searchField()}
        {/snippet}
      </HeroComponent>
    {/if}

    <section class="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
      <div class="mb-6 flex items-center justify-between gap-3">
        <div class="lg:hidden">
          <LandingButton variant="secondary" onclick={() => (filterSheetOpen = true)}>
            <FilterIcon class="size-4" />
            {t('public_courses.filters.title')}
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
            {t('public_courses.clear_filters')}
          </LandingButton>
        </div>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:gap-8">
        <aside
          class="sticky top-4 hidden max-h-[calc(100dvh-2rem)] flex-col self-start overflow-hidden rounded-lg border border-(--landing-border) bg-(--landing-card) text-(--landing-fg) lg:flex"
        >
          <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
            {@render filtersContent(true)}
          </div>
        </aside>

        <div class="ui:@container min-w-0 space-y-4">
          {#if result.courses.length === 0}
            <Empty
              icon={LibraryBigIcon}
              title={t('public_courses.empty.title')}
              description={t('public_courses.empty.description')}
              variant="page"
            />
          {:else}
            <div class={courseGridClass}>
              {#each result.courses as course, index (course.id)}
                <CourseCardComponent {course} {index} />
              {/each}
            </div>

            {#if result.totalPages > 1}
              <Pagination.Root
                count={result.total}
                perPage={perPage}
                page={result.page}
                onPageChange={goToPage}
                class="mt-8"
              >
                {#snippet children({ pages, currentPage: activePage })}
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
                          <Pagination.Link page={pageItem} isActive={activePage === pageItem.value}>
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

    <Sheet.Root bind:open={filterSheetOpen}>
      <Sheet.Content side="right" portalProps={{ disabled: true }} class="flex w-full flex-col p-0 sm:max-w-md">
        <Sheet.Header class="border-b">
          <Sheet.Title>{t('public_courses.filters.title')}</Sheet.Title>
          <Sheet.Description>
            {t('public_courses.filters.selected')}
            <span
              class="ui:bg-muted ui:text-foreground ml-1 inline-flex min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium"
            >
              {activeFilterCount}
            </span>
          </Sheet.Description>
        </Sheet.Header>

        <div class="min-h-0 flex-1 overflow-y-auto">
          {@render filtersContent(false)}
        </div>

        <div class="flex gap-3 border-t p-4">
          <LandingButton variant="secondary" class="flex-1" onclick={clearFilters}>
            {t('public_courses.clear_filters')}
          </LandingButton>
          <LandingButton class="flex-1" onclick={() => (filterSheetOpen = false)}
            >{t('public_courses.filters.save_changes')}</LandingButton
          >
        </div>
      </Sheet.Content>
    </Sheet.Root>

    <OrgLandingPageFooter {orgName} {logoUrl} {footer} variant={theme as never} />
  </main>
</LandingThemeScope>
