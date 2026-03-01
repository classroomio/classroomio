<script lang="ts">
  import * as Item from '@cio/ui/base/item';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import VideoIcon from '@lucide/svelte/icons/video';

  import type { TAssetUpdate } from '@cio/utils/validation/assets';

  import { AssetCard, AssetUsageDialog, EditAssetDialog, MediaFilters, StorageCards } from '$features/media/components';
  import { mediaApi } from '$features/media/api';
  import type { AssetKindFilter, AssetStatusFilter, AssetUsageGraph, OrganizationAsset } from '$features/media/utils';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    search?: string;
    kind?: AssetKindFilter;
    status?: AssetStatusFilter;
  }

  let {
    search = $bindable(''),
    kind = $bindable('all' as AssetKindFilter),
    status = $bindable('all' as AssetStatusFilter)
  }: Props = $props();

  let isRefreshing = $state(false);
  let editOpen = $state(false);
  let usageOpen = $state(false);
  let isSavingAsset = $state(false);
  let isUsageLoading = $state(false);
  let downloadingAssetId = $state<string | null>(null);
  let selectedAsset = $state<OrganizationAsset | null>(null);
  let usageData = $state<AssetUsageGraph | null>(null);

  const assets = $derived(mediaApi.assets);
  const storageSummary = $derived(mediaApi.storageSummary);
  const pagination = $derived(mediaApi.pagination);

  async function refreshAssets(page = 1) {
    isRefreshing = true;
    try {
      await mediaApi.listAssets({
        page,
        limit: pagination?.limit ?? 20,
        search: search.trim() || undefined,
        kind: kind === 'all' ? undefined : kind,
        status: status === 'all' ? undefined : status
      });
    } finally {
      isRefreshing = false;
    }
  }

  async function refreshStorageSummary() {
    await mediaApi.getStorageSummary();
  }

  async function refreshMediaData() {
    await Promise.all([refreshAssets(1), refreshStorageSummary()]);
  }

  function openEditAsset(asset: OrganizationAsset) {
    selectedAsset = asset;
    editOpen = true;
  }

  async function saveAsset(fields: TAssetUpdate) {
    if (!selectedAsset) return;

    isSavingAsset = true;
    try {
      const updated = await mediaApi.updateAsset(selectedAsset.id, fields);
      if (!updated) return;

      selectedAsset = updated;
      editOpen = false;
      snackbar.success('snackbar.media_manager.update_success');
      await refreshStorageSummary();
    } finally {
      isSavingAsset = false;
    }
  }

  async function openUsage(asset: OrganizationAsset) {
    selectedAsset = asset;
    usageOpen = true;
    isUsageLoading = true;
    usageData = null;
    try {
      usageData = await mediaApi.getAssetUsage(asset.id);
    } finally {
      isUsageLoading = false;
    }
  }

  function resetUsageModalState() {
    selectedAsset = null;
    usageData = null;
    isUsageLoading = false;
  }

  async function downloadAsset(asset: OrganizationAsset) {
    downloadingAssetId = asset.id;
    try {
      const url = await mediaApi.getAssetDownloadUrl(asset);
      if (!url) {
        snackbar.error('snackbar.media_manager.download_failed');
        return;
      }
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      downloadingAssetId = null;
    }
  }

  function handleUsageOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetUsageModalState();
    }
  }

  const prevPage = $derived(Math.max(1, (pagination?.page ?? 1) - 1));
  const nextPage = $derived((pagination?.page ?? 1) + 1);
</script>

<StorageCards {storageSummary} />

<Page.BodyHeader class="flex-col flex-wrap! items-start! gap-3 lg:flex-row">
  <MediaFilters
    bind:search
    bind:kind
    bind:status
    {isRefreshing}
    onApply={() => refreshAssets(1)}
    onRefresh={refreshMediaData}
  />
</Page.BodyHeader>

{#if assets.length === 0}
  <Empty
    title={$t('media_manager.empty')}
    description={$t('media_manager.empty_description')}
    icon={VideoIcon}
    variant="page"
  />
{:else}
  <Item.Group class="grid! w-full grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
    {#each assets as asset (asset.id)}
      <AssetCard {asset} {downloadingAssetId} onEdit={openEditAsset} onUsage={openUsage} onDownload={downloadAsset} />
    {/each}
  </Item.Group>
{/if}

{#if pagination && pagination.totalPages > 1}
  <div class="flex items-center justify-end gap-2">
    <Button
      variant="outline"
      size="sm"
      disabled={isRefreshing || (pagination?.page ?? 1) <= 1}
      onclick={() => refreshAssets(prevPage)}
    >
      {$t('media_manager.pagination.previous')}
    </Button>
    <p class="ui:text-muted-foreground text-sm">
      {$t('media_manager.pagination.page')}
      {pagination.page}
      / {pagination.totalPages}
    </p>
    <Button
      variant="outline"
      size="sm"
      disabled={isRefreshing || (pagination?.page ?? 1) >= pagination.totalPages}
      onclick={() => refreshAssets(nextPage)}
    >
      {$t('media_manager.pagination.next')}
    </Button>
  </div>
{/if}

<EditAssetDialog bind:open={editOpen} asset={selectedAsset} isSaving={isSavingAsset} onSave={saveAsset} />

<AssetUsageDialog
  bind:open={usageOpen}
  {selectedAsset}
  {usageData}
  isLoading={isUsageLoading}
  onOpenChange={handleUsageOpenChange}
/>
