<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Item from '@cio/ui/base/item';
  import { Spinner } from '@cio/ui/base/spinner';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { Empty } from '@cio/ui/custom/empty';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';

  import AssetUsageList from './asset-usage-list.svelte';
  import { t } from '$lib/utils/functions/translations';
  import {
    formatBytes,
    formatUsageDate,
    getAssetDisplayName,
    getKindIcon,
    type AssetUsageGraph,
    type OrganizationAsset
  } from '$features/media/utils';

  interface Props {
    open?: boolean;
    selectedAsset?: OrganizationAsset | null;
    usageData?: AssetUsageGraph | null;
    isLoading?: boolean;
    onRefresh?: () => void;
    onOpenChange?: (open: boolean) => void;
  }

  let {
    open = $bindable(false),
    selectedAsset = null,
    usageData = null,
    isLoading = false,
    onRefresh = () => {},
    onOpenChange = () => {}
  }: Props = $props();

  const isUsageEmpty = $derived((usageData?.usages?.length ?? 0) === 0);

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;
    if (!isOpen) {
      onOpenChange(false);
    }
  }
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => handleOpenChange(isOpen)}>
  <Dialog.Content class="w-[95%] max-w-4xl">
    <Dialog.Header>
      <Dialog.Title>{$t('media_manager.usage.title')}</Dialog.Title>
      <Dialog.Description>
        {$t('media_manager.usage.description')}
        {#if selectedAsset}
          <span class="font-medium">{getAssetDisplayName(selectedAsset)}</span>
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    {#if selectedAsset}
      <Item.Root variant="outline" class="mb-4 p-3!">
        <Item.Content>
          <div class="flex gap-3">
            <div
              class="ui:bg-muted/40 flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded border"
            >
              {#if selectedAsset.thumbnailUrl}
                <img
                  src={selectedAsset.thumbnailUrl}
                  alt={$t('media_manager.form.thumbnail_alt')}
                  class="h-full w-full object-cover"
                />
              {:else}
                {@const KindIcon = getKindIcon(selectedAsset.kind)}
                <KindIcon class="ui:text-muted-foreground size-7" />
              {/if}
            </div>

            <div class="min-w-0 flex-1">
              <Item.Title class="line-clamp-1">{getAssetDisplayName(selectedAsset)}</Item.Title>
              <div class="mt-2 flex flex-wrap gap-2">
                <Badge variant="outline">{$t(`media_manager.kind.${selectedAsset.kind}`)}</Badge>
                <Badge variant="outline">{$t(`media_manager.provider.${selectedAsset.provider}`)}</Badge>
                <Badge variant="outline">{$t(`media_manager.status.${selectedAsset.status}`)}</Badge>
              </div>

              <div class="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p class="ui:text-muted-foreground text-xs uppercase">{$t('media_manager.table.size')}</p>
                  <p class="font-medium">{formatBytes(selectedAsset.byteSize)}</p>
                </div>
                <div>
                  <p class="ui:text-muted-foreground text-xs uppercase">{$t('media_manager.table.updated_at')}</p>
                  <p class="font-medium">{formatUsageDate(selectedAsset.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </Item.Content>
      </Item.Root>
    {/if}

    {#if isLoading}
      <Empty description={$t('media_manager.usage.loading')} icon={Spinner} class="ui:max-h-40 py-6" />
    {:else if isUsageEmpty}
      <p class="ui:text-muted-foreground text-sm">{$t('media_manager.usage.empty')}</p>
    {:else if usageData}
      <div class="mb-3 flex items-center justify-between gap-2">
        <p class="ui:text-muted-foreground text-sm">
          {$t('media_manager.usage.total')}
          {usageData.usageCount}
        </p>
        <Tooltip.Provider>
          <Tooltip.Root>
            <Tooltip.Trigger>
              {#snippet child({ props })}
                <Button
                  {...props}
                  variant="secondary"
                  size="icon"
                  onclick={() => onRefresh()}
                  aria-label={$t('media_manager.usage.refresh')}
                >
                  <RefreshCwIcon size={16} />
                </Button>
              {/snippet}
            </Tooltip.Trigger>
            <Tooltip.Content side="top" sideOffset={4}>
              {$t('media_manager.usage.refresh')}
            </Tooltip.Content>
          </Tooltip.Root>
        </Tooltip.Provider>
      </div>
      <AssetUsageList usages={usageData.usages} onNavigate={() => handleOpenChange(false)} />
    {/if}
  </Dialog.Content>
</Dialog.Root>
