<script lang="ts">
  import BellIcon from '@lucide/svelte/icons/bell';
  import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw';
  import { Button } from '@cio/ui/base/button';
  import * as Empty from '@cio/ui/base/empty';
  import { t } from '$lib/utils/functions/translations';
  import NotificationRow from './notification-row.svelte';
  import type { NotificationItem } from '../utils/types';

  interface Props {
    items: NotificationItem[];
    isLoading: boolean;
    hasLoaded: boolean;
    onSelect: (item: NotificationItem) => void;
    onRefresh: () => void;
  }

  let { items, isLoading, hasLoaded, onSelect, onRefresh }: Props = $props();
</script>

{#if !hasLoaded}
  <!-- Nothing until the first fetch settles, so the empty state cannot flash. -->
  <div class="space-y-3 px-4 py-4">
    {#each [0, 1, 2] as row (row)}
      <div class="flex items-start gap-3">
        <div class="ui:bg-muted size-8 shrink-0 animate-pulse rounded-full"></div>
        <div class="flex-1 space-y-1.5">
          <div class="ui:bg-muted h-3 w-1/3 animate-pulse rounded"></div>
          <div class="ui:bg-muted h-3 w-2/3 animate-pulse rounded"></div>
        </div>
      </div>
    {/each}
  </div>
{:else if items.length === 0}
  <Empty.Root>
    <Empty.Header>
      <Empty.Media variant="icon">
        <BellIcon />
      </Empty.Media>
      <Empty.Title>{$t('notifications.empty_title')}</Empty.Title>
      <Empty.Description>{$t('notifications.empty_description')}</Empty.Description>
    </Empty.Header>
    <Empty.Content>
      <Button variant="outline" size="sm" loading={isLoading} onclick={onRefresh}>
        <RefreshCcwIcon />
        {$t('notifications.refresh')}
      </Button>
    </Empty.Content>
  </Empty.Root>
{:else}
  <p class="ui:text-muted-foreground px-4 pt-2 pb-1 text-xs font-medium">{$t('notifications.latest')}</p>

  <div class="max-h-80 overflow-y-auto">
    {#each items as item (item.id)}
      <NotificationRow {item} {onSelect} />
    {/each}
  </div>
{/if}
