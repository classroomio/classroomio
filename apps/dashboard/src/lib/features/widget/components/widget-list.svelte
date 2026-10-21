<script lang="ts">
  import type { WidgetListItem, WidgetListPagination } from '../utils/types';
  import { Empty } from '@cio/ui/custom/empty';
  import { Button } from '@cio/ui/base/button';
  import SearchXIcon from '@lucide/svelte/icons/search-x';
  import type { Component, Snippet } from 'svelte';
  import WidgetCard from './widget-card.svelte';
  import { TablePagination } from '$features/ui';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    widgets: WidgetListItem[];
    mode?: 'active' | 'archived';
    pagination?: WidgetListPagination;
    isFiltering?: boolean;
    emptyTitle: string;
    emptyDescription: string;
    emptyIcon: Component;
    emptyAction?: Snippet;
    onClearFilters?: () => void | Promise<void>;
    onPageChange?: (page: number) => void;
  }

  let {
    widgets = [],
    mode = 'active',
    pagination,
    isFiltering = false,
    emptyTitle,
    emptyDescription,
    emptyIcon: EmptyIcon,
    emptyAction,
    onClearFilters,
    onPageChange
  }: Props = $props();

  const total = $derived(pagination?.total ?? widgets.length);
  const page = $derived(pagination?.page ?? 1);
  const limit = $derived(pagination?.limit ?? widgets.length);
  const totalPages = $derived(pagination?.totalPages ?? 1);

  /**
   * Filtering away the last widget on page 3 leaves an empty grid and no way back:
   * the filters that would rescue it live above an already-empty page. Treat this as
   * its own state and offer the way out.
   */
  const isPageOutOfRange = $derived(widgets.length === 0 && total > 0 && page > totalPages);
  const showNoMatches = $derived(widgets.length === 0 && isFiltering && !isPageOutOfRange);
</script>

{#if isPageOutOfRange}
  <Empty
    title={t.get('widgets.filters.no_results_page_title')}
    description={t.get('widgets.filters.no_results_page_description')}
    icon={SearchXIcon}
    variant="page"
  >
    <Button variant="secondary" onclick={() => onPageChange?.(1)}>
      {t.get('widgets.filters.back_to_first_page')}
    </Button>
  </Empty>
{:else if showNoMatches}
  <Empty
    title={t.get('widgets.filters.no_results_title')}
    description={t.get('widgets.filters.no_results_description')}
    icon={SearchXIcon}
    variant="page"
  >
    {#if onClearFilters}
      <Button variant="secondary" onclick={() => onClearFilters()}>
        {t.get('widgets.filters.clear_all')}
      </Button>
    {/if}
  </Empty>
{:else if widgets.length === 0}
  <Empty title={emptyTitle} description={emptyDescription} icon={EmptyIcon} variant="page">
    {#if emptyAction}
      {@render emptyAction()}
    {/if}
  </Empty>
{:else}
  <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
    {#each widgets as widget (widget.id)}
      <WidgetCard {widget} {mode} isAdmin={$isOrgAdmin} />
    {/each}
  </div>

  {#if onPageChange && totalPages > 1}
    <div class="pt-6">
      <TablePagination count={total} perPage={limit} {page} onPageChange={(nextPage) => onPageChange(nextPage)} />
    </div>
  {/if}
{/if}
