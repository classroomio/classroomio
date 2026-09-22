<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import { resolve } from '$app/paths';
  import { SvelteURLSearchParams } from 'svelte/reactivity';

  import { t } from '$lib/utils/functions/translations';
  import { user } from '$lib/utils/store/user';

  import { PoweredBy } from '$features/ui';
  import { appInitApi } from '$features/app/init.svelte';
  import { getOrgLandingAuthAction } from '$features/org/utils/org-landing-auth-action';
  import { normalizeLandingPageSettings, themeRendersNavInsideHero } from '$features/org/utils/landing-page';
  import LayersIcon from '@lucide/svelte/icons/layers';
  import XIcon from '@lucide/svelte/icons/x';
  import SearchIcon from '@lucide/svelte/icons/search';

  import { LandingThemeScope, LearningPathCard, OrgLandingPageFooter } from '@cio/ui/custom/org-landing-page';

  import * as InputGroup from '@cio/ui/base/input-group';
  import { Empty } from '@cio/ui/custom/empty';
  import * as Pagination from '@cio/ui/base/pagination';

  let { data } = $props();

  let activeSearch = $derived(data.activeSearch || '');
  let searchInput = $state('');

  $effect(() => {
    searchInput = activeSearch;
  });

  const landingSettings = $derived(normalizeLandingPageSettings(data.org.landingpage));

  const authAction = $derived(
    getOrgLandingAuthAction({
      isLoggedIn: $user.isLoggedIn,
      isInitialized: appInitApi.isInitializedAndReady,
      org: data.org,
      organizations: appInitApi.data?.success ? appInitApi.data.organizations : [],
      hasPendingInvite: !!appInitApi.pendingOrgInvite
    })
  );

  const navInsideHero = $derived(themeRendersNavInsideHero(landingSettings.theme));

  const NavComponent = $derived(data.theme.Nav);
  const HeroComponent = $derived(data.theme.Hero);

  const heroProps = $derived({
    ...landingSettings.hero,
    heading: t.get('public_learning_paths.heading'),
    subheading: t.get('public_learning_paths.subtitle'),
    image: ''
  });

  const cardLabels = $derived({
    learningPathLabel: t.get('public_learning_paths.label'),
    learningPathCertificateLabel: t.get('public_learning_paths.certificate_label'),
    freeLabel: t.get('public_learning_paths.free_label'),
    learningPathCourseCountLabel: (count: number) => t.get('public_learning_paths.course_count_label', { count }),
    enrolledLabel: (count: number) => t.get('public_learning_paths.enrolled_label', { count })
  });

  async function applySearch(nextSearch: string) {
    const params = new SvelteURLSearchParams(page.url.searchParams);

    nextSearch ? params.set('search', nextSearch) : params.delete('search');
    params.delete('page');

    const query = params.toString();
    const suffix = query ? `?${query}` : '';

    await goto(resolve(`/learning-paths${suffix}`, {}), {
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

    await goto(resolve(`/learning-paths${suffix}`, {}), { invalidateAll: true });
  }

  let searchDebounce: ReturnType<typeof setTimeout>;
  function onSearchInput(value: string) {
    searchInput = value;
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => applySearch(value), 300);
  }

  function onSearchKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      clearTimeout(searchDebounce);
      applySearch(searchInput);
    }
  }

  function clearSearch() {
    searchInput = '';
    clearTimeout(searchDebounce);
    applySearch('');
  }
</script>

{#snippet searchField()}
  <div class="mx-auto w-full max-w-xl">
    <InputGroup.Root>
      <InputGroup.Addon>
        <SearchIcon />
      </InputGroup.Addon>
      <InputGroup.Input
        type="text"
        value={searchInput}
        oninput={(e) => onSearchInput(e.currentTarget.value)}
        onkeydown={onSearchKeydown}
        placeholder={$t('public_learning_paths.search_placeholder')}
      />
      {#if searchInput}
        <InputGroup.Addon align="inline-end">
          <button
            type="button"
            onclick={clearSearch}
            class="ui:text-muted-foreground ui:hover:text-foreground"
            aria-label={$t('public_learning_paths.clear_search')}
          >
            <XIcon class="size-4" />
          </button>
        </InputGroup.Addon>
      {/if}
    </InputGroup.Root>
  </div>
{/snippet}

<PoweredBy />

<LandingThemeScope theme={landingSettings.theme} class="font-sans">
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

    <section class="mx-auto w-full max-w-4xl px-4 py-10 md:px-6">
      {#if data.learningPaths.length === 0}
        <Empty
          icon={LayersIcon}
          title={$t('public_learning_paths.empty.title')}
          description={$t('public_learning_paths.empty.description')}
          variant="page"
        />
      {:else}
        <div class="flex flex-col gap-5">
          {#each data.learningPaths as path (path.id)}
            <LearningPathCard {path} labels={cardLabels} />
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
    </section>

    <OrgLandingPageFooter
      orgName={data.org.name}
      logoUrl={data.org.avatarUrl ?? undefined}
      footer={landingSettings.footer}
      variant={landingSettings.theme}
    />
  </main>
</LandingThemeScope>
