<script lang="ts">
  import { goto } from '$app/navigation';
  import { page } from '$app/state';
  import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
  import SearchXIcon from '@lucide/svelte/icons/search-x';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import * as Alert from '@cio/ui/base/alert';
  import * as Card from '@cio/ui/base/card';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import { Empty } from '@cio/ui/custom/empty';
  import { PUBLIC_IS_SELFHOSTED } from '$env/static/public';
  import { ZAPIER_PARTNER_APPS } from '@cio/utils/constants/zapier';

  import ZapierAppCard from '$features/automation/components/zapier-app-card.svelte';
  import ZapierDirectoryFilters from '$features/automation/components/zapier-directory-filters.svelte';
  import ZapierOpenButton from '$features/automation/components/zapier-open-button.svelte';
  import type { ZapierDirectoryCategory, ZapierDirectoryState } from '$features/automation/utils/types';
  import {
    countZapierApps,
    filterZapierApps,
    parseZapierDirectoryState,
    sortZapierApps,
    toZapierDirectorySearch,
    ZAPIER_URLS
  } from '$features/automation/utils/zapier-utils';
  import { UpgradeBanner } from '$features/ui';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrgPath, hasPublicApiAccess, isOrgAdmin } from '$lib/utils/store/org';

  const T = 'automation.zapier.directory';
  const isSelfHosted = PUBLIC_IS_SELFHOSTED === 'true';
  const SEARCH_DEBOUNCE_MS = 250;

  const initialDirectoryState = parseZapierDirectoryState(page.url.searchParams);
  const directoryState = $derived(parseZapierDirectoryState(page.url.searchParams));
  const counts = $derived(countZapierApps(ZAPIER_PARTNER_APPS));

  let searchValue = $state(initialDirectoryState.query);
  let lastRequestedQuery = $state(initialDirectoryState.query);

  const results = $derived(
    sortZapierApps(
      filterZapierApps(ZAPIER_PARTNER_APPS, directoryState, (app) =>
        $t(`automation.zapier.apps.${app.slug}.description`)
      )
    )
  );

  const resultCount = $derived.by(() => {
    const total = results.length;
    const query = directoryState.query;
    const values = { count: total, query };

    if (total === 1) {
      return query ? $t(`${T}.count.one_matching`, values) : $t(`${T}.count.one`);
    }

    return query ? $t(`${T}.count.all_matching`, values) : $t(`${T}.count.all`, values);
  });

  $effect(() => {
    if (directoryState.query === lastRequestedQuery) return;

    lastRequestedQuery = directoryState.query;
    searchValue = directoryState.query;
  });

  $effect(() => {
    const normalizedQuery = searchValue.trim();
    if (normalizedQuery === directoryState.query) return;

    const timeoutId = setTimeout(() => {
      lastRequestedQuery = normalizedQuery;
      void applyState({ query: normalizedQuery });
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timeoutId);
  });

  async function applyState(patch: Partial<ZapierDirectoryState>) {
    const nextState = { ...directoryState, ...patch };
    const nextSearch = toZapierDirectorySearch(nextState);

    if (nextSearch === page.url.searchParams.toString()) return;

    const nextUrl = `${page.url.pathname}${nextSearch ? `?${nextSearch}` : ''}${page.url.hash}`;
    await goto(nextUrl, { replaceState: true, keepFocus: true, noScroll: true });
  }

  function handleCategoryChange(category: ZapierDirectoryCategory) {
    void applyState({ category });
  }
</script>

{#if $isOrgAdmin === false}
  <Alert.Callout
    variant="information"
    title={$t('automation.permissions.disabled_title')}
    description={$t('automation.zapier.permissions_description')}
    class="w-full"
  />
{:else if $isOrgAdmin === null}
  <div class="space-y-2">
    {#each [0, 1, 2] as index (index)}
      <Skeleton class="h-12 w-full" />
    {/each}
  </div>
{:else if isSelfHosted}
  <Alert.Callout
    variant="information"
    title={$t('automation.zapier.selfhosted.title')}
    description={$t('automation.zapier.selfhosted.description')}
    class="w-full"
  />
{:else}
  {#if !$hasPublicApiAccess}
    <UpgradeBanner visible>{$t('upgrade.zapier_required')}</UpgradeBanner>
  {/if}

  <div
    class="mx-auto flex w-full max-w-[1080px] flex-col gap-6 min-[860px]:flex-row min-[860px]:items-start min-[860px]:gap-7"
  >
    <aside class="w-full shrink-0 min-[860px]:sticky min-[860px]:top-4 min-[860px]:w-[210px]">
      <ZapierDirectoryFilters
        bind:query={searchValue}
        category={directoryState.category}
        {counts}
        onCategoryChange={handleCategoryChange}
      />
    </aside>

    <div class="min-w-0 flex-1">
      <p class="ui:text-muted-foreground mb-4 text-[13px]" data-testid="zapier-directory-count">{resultCount}</p>

      {#if results.length === 0}
        <Empty
          title={$t(`${T}.empty.title`)}
          description={$t(`${T}.empty.description`)}
          icon={SearchXIcon}
          variant="page"
        >
          {#if $hasPublicApiAccess}
            <ZapierOpenButton href={ZAPIER_URLS.editor} testId="zapier-directory-search-in-zapier">
              {$t(`${T}.empty.search_zapier`)}
              <ArrowUpRightIcon size={16} />
            </ZapierOpenButton>
          {/if}
        </Empty>
      {:else}
        <div class="grid grid-cols-1 gap-3 min-[600px]:grid-cols-2 min-[980px]:grid-cols-3">
          {#each results as app (app.slug)}
            <ZapierAppCard {app} href={`${$currentOrgPath}/automation/zapier/apps/${app.slug}`} />
          {/each}
        </div>

        <Card.Root class="ui:bg-muted/50 mt-5 flex-row items-center gap-3.5 border-dashed px-4 py-4">
          <span
            class="ui:bg-card ui:border-border flex size-[34px] shrink-0 items-center justify-center rounded-md border"
          >
            <ZapIcon class="custom ui:text-muted-foreground size-4" />
          </span>

          <div class="min-w-0 flex-1">
            <p class="text-[13px] font-semibold">{$t(`${T}.end.title`)}</p>
            <p class="ui:text-muted-foreground mt-0.5 text-[12.5px]">{$t(`${T}.end.description`)}</p>
          </div>

          {#if $hasPublicApiAccess}
            <ZapierOpenButton variant="outline" size="sm" href={ZAPIER_URLS.editor} testId="zapier-directory-continue">
              {$t(`${T}.end.cta`)}
            </ZapierOpenButton>
          {/if}
        </Card.Root>
      {/if}
    </div>
  </div>
{/if}
