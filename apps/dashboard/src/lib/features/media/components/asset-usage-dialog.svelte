<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Item from '@cio/ui/base/item';

  import { t } from '$lib/utils/functions/translations';
  import {
    formatBytes,
    formatUsageDate,
    getAssetDisplayName,
    getKindIcon,
    getTargetTypeLabel,
    type AssetUsageGraph,
    type OrganizationAsset
  } from '$features/media/utils';

  interface Props {
    open?: boolean;
    selectedAsset?: OrganizationAsset | null;
    usageData?: AssetUsageGraph | null;
    isLoading?: boolean;
    onOpenChange?: (open: boolean) => void;
  }

  let {
    open = $bindable(false),
    selectedAsset = null,
    usageData = null,
    isLoading = false,
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
      <p class="ui:text-muted-foreground text-sm">{$t('media_manager.usage.loading')}</p>
    {:else if isUsageEmpty}
      <p class="ui:text-muted-foreground text-sm">{$t('media_manager.usage.empty')}</p>
    {:else if usageData}
      <p class="ui:text-muted-foreground mb-3 text-sm">
        {$t('media_manager.usage.total')}
        {usageData.usageCount}
      </p>
      <div class="max-h-[420px] overflow-auto rounded-lg border">
        <div class="divide-y">
          {#each usageData.usages as usage (usage.id)}
            <div class="grid grid-cols-1 gap-2 p-3 text-sm md:grid-cols-5 md:items-center md:gap-4">
              <div>
                <p class="ui:text-muted-foreground text-xs">{$t('media_manager.usage.table.target_type')}</p>
                <p>{getTargetTypeLabel(usage.targetType)}</p>
              </div>
              <div>
                <p class="ui:text-muted-foreground text-xs">{$t('media_manager.usage.table.target_id')}</p>
                <p class="font-mono text-xs">{usage.targetId}</p>
              </div>
              <div>
                <p class="ui:text-muted-foreground text-xs">{$t('media_manager.usage.table.slot')}</p>
                <p>{usage.slotType}{usage.slotKey ? ` (${usage.slotKey})` : ''}</p>
              </div>
              <div>
                <p class="ui:text-muted-foreground text-xs">{$t('media_manager.usage.table.position')}</p>
                <p>{usage.position ?? t.get('media_manager.common.not_available')}</p>
              </div>
              <div>
                <p class="ui:text-muted-foreground text-xs">{$t('media_manager.usage.table.added')}</p>
                <p>{formatUsageDate(usage.createdAt)}</p>
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </Dialog.Content>
</Dialog.Root>
