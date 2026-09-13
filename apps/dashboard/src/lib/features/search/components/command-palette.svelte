<script lang="ts">
  import { goto } from '$app/navigation';
  import { resolve } from '$app/paths';
  import * as Command from '@cio/ui/base/command';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { BookOpen, Boxes, Clock, Goal, LayoutGrid, Settings, Tag, UserRound } from '@lucide/svelte';
  import { t } from '$lib/utils/functions/translations';
  import { currentOrg, currentOrgPath, isOrgAdmin } from '$lib/utils/store/org';
  import { searchApi } from '../api/search.svelte';
  import { searchStore } from '../store/search-store.svelte';
  import { addRecent, clearRecents, getRecents } from '../utils/recents';
  import { buildLmsStaticCatalog, buildStaticCatalog, filterStaticCatalog } from '../utils/static-catalog';
  import type { SearchResultItem } from '../utils/types';
  import SearchResultGroup from './search-result-group.svelte';

  let query = $state('');
  let recents = $state<SearchResultItem[]>([]);

  const scope = $derived(searchStore.scope);
  const translate = (key: string) => t.get(key);
  const staticCatalog = $derived(
    scope === 'lms'
      ? buildLmsStaticCatalog(translate, $currentOrg)
      : buildStaticCatalog(translate, $currentOrgPath, $isOrgAdmin)
  );
  const placeholder = $derived(
    scope === 'lms'
      ? $t('app.search.command_palette.lms_placeholder')
      : $t('app.search.command_palette.org_placeholder')
  );
  const description = $derived(
    scope === 'lms' ? $t('app.search.command_palette.lms_description') : $t('app.search.command_palette.description')
  );
  const filteredStaticCatalog = $derived(filterStaticCatalog(staticCatalog, query));
  const filteredRecents = $derived(filterStaticCatalog(recents, query));
  const hasQuery = $derived(query.trim().length > 0);
  const hasServerResults = $derived(
    searchApi.results.course.length > 0 ||
      searchApi.results.cohort.length > 0 ||
      searchApi.results.widget.length > 0 ||
      searchApi.results.tag.length > 0 ||
      searchApi.results.audience.length > 0
  );
  const hasVisibleResults = $derived(
    hasQuery
      ? hasServerResults || filteredStaticCatalog.length > 0
      : filteredRecents.length > 0 || filteredStaticCatalog.length > 0
  );

  $effect(() => {
    if (!searchStore.isOpen) {
      searchApi.cancelSearch();
      searchApi.clearResults();
      query = '';
      return;
    }

    recents = getRecents($currentOrg.id, scope);
  });

  $effect(() => {
    if (!searchStore.isOpen) {
      return;
    }

    searchApi.runSearch(query, $currentOrgPath, scope);
  });

  function handleSelect(item: SearchResultItem) {
    addRecent($currentOrg.id, item, scope);
    recents = getRecents($currentOrg.id, scope);
    searchStore.close();
    void goto(resolve(item.url, {}));
  }

  function handleClearRecents() {
    clearRecents($currentOrg.id, scope);
    recents = [];
  }

  function groupItems(kind: SearchResultItem['kind']) {
    return searchApi.results[kind];
  }
</script>

<Command.Dialog
  bind:open={searchStore.isOpen}
  shouldFilter={false}
  title={$t('app.search.command_palette.title')}
  {description}
>
  <Command.Input bind:value={query} {placeholder} />

  <Command.List class="max-h-[460px] p-2">
    {#if searchApi.isLoading}
      <div class="ui:text-muted-foreground flex items-center gap-2 px-3 py-3 text-sm">
        <Spinner class="size-4" />
        {$t('app.search.command_palette.loading')}
      </div>
    {/if}

    {#if !hasVisibleResults && !searchApi.isLoading}
      <Command.Empty>{$t('app.search.command_palette.empty')}</Command.Empty>
    {/if}

    {#if !hasQuery && filteredRecents.length > 0}
      <Command.Group heading={$t('app.search.command_palette.groups.recent')}>
        <div class="flex items-center justify-end px-2 pb-1">
          <Button variant="ghost" size="sm" class="h-6 px-2 text-xs" onclick={handleClearRecents}>
            {$t('app.search.command_palette.clear_recents')}
          </Button>
        </div>
        {#each filteredRecents as item (item.kind + item.id)}
          <Command.Item value={`${item.kind}:${item.id}`} onSelect={() => handleSelect(item)}>
            <Clock class="size-4" />
            <div class="min-w-0 flex-1">
              <div class="truncate font-medium">{item.title}</div>
              {#if item.subtitle}
                <div class="ui:text-muted-foreground truncate text-xs">{item.subtitle}</div>
              {/if}
            </div>
          </Command.Item>
        {/each}
      </Command.Group>
    {/if}

    {#if hasQuery}
      <SearchResultGroup
        heading={$t('app.search.command_palette.groups.courses')}
        items={groupItems('course')}
        fallbackIcon={BookOpen}
        onSelect={handleSelect}
      />
      <SearchResultGroup
        heading={$t('app.search.command_palette.groups.cohorts')}
        items={groupItems('cohort')}
        fallbackIcon={Goal}
        onSelect={handleSelect}
      />
      {#if scope === 'org'}
        <SearchResultGroup
          heading={$t('app.search.command_palette.groups.widgets')}
          items={groupItems('widget')}
          fallbackIcon={LayoutGrid}
          onSelect={handleSelect}
        />
        <SearchResultGroup
          heading={$t('app.search.command_palette.groups.tags')}
          items={groupItems('tag')}
          fallbackIcon={Tag}
          onSelect={handleSelect}
        />
        <SearchResultGroup
          heading={$t('app.search.command_palette.groups.students')}
          items={groupItems('audience')}
          fallbackIcon={UserRound}
          onSelect={handleSelect}
        />
      {/if}
      <SearchResultGroup
        heading={$t('app.search.command_palette.groups.settings')}
        items={filteredStaticCatalog.filter((item) => item.kind === 'settings')}
        fallbackIcon={Settings}
        onSelect={handleSelect}
      />
    {:else}
      <SearchResultGroup
        heading={$t('app.search.command_palette.groups.suggested')}
        items={filteredStaticCatalog}
        fallbackIcon={Boxes}
        onSelect={handleSelect}
      />
    {/if}
  </Command.List>
</Command.Dialog>
