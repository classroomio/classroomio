<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Select from '@cio/ui/base/select';
  import * as Tabs from '@cio/ui/base/tabs';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Search } from '@cio/ui/custom/search';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';

  import { t } from '$lib/utils/functions/translations';
  import type { AssetKindFilter, AssetStatusFilter } from '$features/media/utils';
  import { ASSET_KIND_OPTIONS, ASSET_STATUS_OPTIONS } from '$features/media/utils';

  interface Props {
    search?: string;
    kind?: AssetKindFilter;
    status?: AssetStatusFilter;
    isRefreshing?: boolean;
    onApply?: () => void;
    onRefresh?: () => void;
  }

  let {
    search = $bindable(''),
    kind = $bindable('all' as AssetKindFilter),
    status = $bindable('all' as AssetStatusFilter),
    isRefreshing = false,
    onApply = () => {},
    onRefresh = () => {}
  }: Props = $props();

  function handleKindChange() {
    onApply();
  }
</script>

<Tabs.Root bind:value={kind} class="min-w-0 flex-1" onValueChange={handleKindChange}>
  <Tabs.List class="grid h-auto w-full grid-cols-3 md:grid-cols-6">
    {#each ASSET_KIND_OPTIONS as option (option)}
      <Tabs.Trigger value={option}>
        {$t(`media_manager.filters.kind_options.${option}`)}
      </Tabs.Trigger>
    {/each}
  </Tabs.List>
</Tabs.Root>

<div class="flex flex-wrap items-center gap-2">
  <Search
    class="w-full sm:w-[120px]"
    placeholder={$t('media_manager.filters.search_placeholder')}
    bind:value={search}
  />
  <Select.Root type="single" bind:value={status}>
    <Select.Trigger class="min-w-[100px]">
      <p>{$t(`media_manager.filters.status_options.${status}`)}</p>
    </Select.Trigger>
    <Select.Content>
      {#each ASSET_STATUS_OPTIONS as option (option)}
        <Select.Item value={option}>
          {$t(`media_manager.filters.status_options.${option}`)}
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
  <Button onclick={onApply} loading={isRefreshing} disabled={isRefreshing}>
    {$t('media_manager.filters.apply')}
  </Button>
  <IconButton
    onclick={onRefresh}
    disabled={isRefreshing}
    aria-label={$t('media_manager.filters.refresh')}
    tooltip={$t('media_manager.filters.refresh')}
  >
    <RotateCcwIcon size={16} />
  </IconButton>
</div>
