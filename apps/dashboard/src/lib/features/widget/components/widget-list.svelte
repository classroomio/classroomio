<script lang="ts">
  import type { WidgetListItem } from '../utils/types';
  import { Empty } from '@cio/ui/custom/empty';
  import type { Component, Snippet } from 'svelte';
  import WidgetCard from './widget-card.svelte';
  import { isOrgAdmin } from '$lib/utils/store/org';

  interface Props {
    widgets: WidgetListItem[];
    mode?: 'active' | 'archived';
    emptyTitle: string;
    emptyDescription: string;
    emptyIcon: Component;
    emptyAction?: Snippet;
  }

  let {
    widgets = [],
    mode = 'active',
    emptyTitle,
    emptyDescription,
    emptyIcon: EmptyIcon,
    emptyAction
  }: Props = $props();
</script>

{#if widgets.length === 0}
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
{/if}
