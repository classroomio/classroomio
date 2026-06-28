<script lang="ts">
  import * as Alert from '@cio/ui/base/alert';
  import * as Dialog from '@cio/ui/base/dialog';
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import * as Tooltip from '@cio/ui/base/tooltip';
  import { Empty } from '@cio/ui/custom/empty';
  import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

  import AssetUsageList from './asset-usage-list.svelte';
  import { t } from '$lib/utils/functions/translations';
  import { getAssetDisplayName, type AssetUsageGraph, type OrganizationAsset } from '$features/media/utils';

  interface Props {
    open?: boolean;
    asset?: OrganizationAsset | null;
    usageData?: AssetUsageGraph | null;
    isLoadingUsage?: boolean;
    isDeleting?: boolean;
    onConfirm?: () => void;
    onRefresh?: () => void;
    onOpenChange?: (open: boolean) => void;
  }

  let {
    open = $bindable(false),
    asset = null,
    usageData = null,
    isLoadingUsage = false,
    isDeleting = false,
    onConfirm = () => {},
    onRefresh = () => {},
    onOpenChange = () => {}
  }: Props = $props();

  const isInUse = $derived((usageData?.usageCount ?? 0) > 0);

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;
    if (!isOpen) {
      onOpenChange(false);
    }
  }
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => handleOpenChange(isOpen)}>
  <Dialog.Content class="w-[95%] max-w-2xl">
    <Dialog.Header>
      <Dialog.Title>{$t('media_manager.delete.title')}</Dialog.Title>
      <Dialog.Description>
        {#if asset}
          <span class="font-medium">{getAssetDisplayName(asset)}</span>
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    {#if isLoadingUsage}
      <Empty description={$t('media_manager.usage.loading')} icon={Spinner} class="ui:max-h-40 py-6" />
    {:else if isInUse}
      <Alert.Root variant="warning">
        <TriangleAlertIcon />
        <Alert.Title>{$t('media_manager.delete.in_use_title')}</Alert.Title>
        <Alert.Description>{$t('media_manager.delete.in_use_description')}</Alert.Description>
      </Alert.Root>

      <div class="mt-2 mb-1 flex items-center justify-between gap-2">
        <p class="ui:text-muted-foreground text-sm">
          {$t('media_manager.usage.total')}
          {usageData?.usageCount}
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
      <AssetUsageList usages={usageData?.usages ?? []} onNavigate={() => handleOpenChange(false)} />

      <Dialog.Footer>
        <Button variant="outline" onclick={() => handleOpenChange(false)}>
          {$t('media_manager.delete.close')}
        </Button>
      </Dialog.Footer>
    {:else}
      <Alert.Root variant="destructive">
        <TriangleAlertIcon />
        <Alert.Title>{$t('media_manager.delete.irreversible_title')}</Alert.Title>
        <Alert.Description>{$t('media_manager.delete.irreversible_description')}</Alert.Description>
      </Alert.Root>

      <Dialog.Footer>
        <Button variant="outline" disabled={isDeleting} onclick={() => handleOpenChange(false)}>
          {$t('media_manager.delete.cancel')}
        </Button>
        <Button variant="destructive" disabled={isDeleting} onclick={onConfirm}>
          {$t('media_manager.delete.confirm')}
        </Button>
      </Dialog.Footer>
    {/if}
  </Dialog.Content>
</Dialog.Root>
