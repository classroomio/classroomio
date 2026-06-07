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
  import {
    normalizeLandingPageSettings,
    themeHeaderShellClass,
    themeStyle,
    themeRendersNavInsideHero
  } from '$features/org/utils/landing-page';

  import { LandingButton, OrgLandingPageFooter } from '@cio/ui/custom/org-landing-page';

  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Empty } from '@cio/ui/custom/empty';
  import { Separator } from '@cio/ui/base/separator';
  import * as Pagination from '@cio/ui/base/pagination';

  let { data } = $props();

  let selectedTags = $derived<string[]>(data.activeTags || []);

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

  async function applyTagFilters(nextTags: string[]) {
    const params = new SvelteURLSearchParams(page.url.searchParams);

    if (nextTags.length > 0) {
      params.set('tags', nextTags.join(','));
    } else {
      params.delete('tags');
    }

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

    applyTagFilters(Array.from(next));
  }

  function clearFilters() {
    if (selectedTags.length === 0) {
      return;
    }

    applyTagFilters([]);
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
</script>

<PoweredBy />

<main class={shellClass} style={shellStyle}>
  {#if navInsideHero}
    <HeroComponent hero={heroProps} orgName={data.org.name} showActions={false}>
      {#snippet navigation()}
        <NavComponent
          orgName={data.org.name}
          logoUrl={data.org.avatarUrl ?? undefined}
          navItems={landingSettings.navItems}
          {authAction}
        />
      {/snippet}
    </HeroComponent>
  {:else}
    <NavComponent
      orgName={data.org.name}
      logoUrl={data.org.avatarUrl ?? undefined}
      navItems={landingSettings.navItems}
      {authAction}
    />
    <HeroComponent hero={heroProps} orgName={data.org.name} showActions={false} />
  {/if}

  <section class="mx-auto w-full max-w-7xl px-4 py-8 md:px-6">
    <div class="mb-6 flex items-center justify-end gap-4">
      <LandingButton variant="secondary" onclick={clearFilters} disabled={selectedTags.length === 0}>
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
          {#if displayTagGroups.length === 0}
            <p class="ui:text-[var(--landing-fg-muted)] text-sm">{$t('public_courses.filters.empty')}</p>
          {:else}
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
