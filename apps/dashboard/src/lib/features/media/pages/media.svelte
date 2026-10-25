<script lang="ts">
  import * as Item from '@cio/ui/base/item';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import VideoIcon from '@lucide/svelte/icons/video';
  import { goto, replaceState } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';

  import type { TAssetUpdate } from '@cio/utils/validation/assets';

  import {
    AssetCard,
    AssetUsageDialog,
    DeleteAssetDialog,
    EditAssetDialog,
    ManageThumbnailsDialog,
    MediaFilters,
    StorageCards
  } from '$features/media/components';
  import { mediaApi } from '$features/media/api';
  import type { AssetKindFilter, AssetStatusFilter, AssetUsageGraph, OrganizationAsset } from '$features/media/utils';
  import {
    DEFAULT_MEDIA_LIST_NEXT,
    MEDIA_PAGE_SIZE,
    mergeMediaListSearchParams,
    parseMediaListFilters
  } from '$features/media/utils/media-list-filters';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { DebouncedSearch } from '$lib/utils/functions/debounced-search.svelte';
  import { onDestroy } from 'svelte';

  const initialFilters = parseMediaListFilters(page.url.searchParams);

  let isRefreshing = $state(false);
  let isLoadingMore = $state(false);
  let editOpen = $state(false);
  let usageOpen = $state(false);
  let manageThumbsOpen = $state(false);
  let deleteOpen = $state(false);
  let isSavingAsset = $state(false);
  let isUsageLoading = $state(false);
  let isDeleting = $state(false);
  let downloadingAssetId = $state<string | null>(null);
  let selectedAsset = $state<OrganizationAsset | null>(null);
  let usageData = $state<AssetUsageGraph | null>(null);
  let kind = $state<AssetKindFilter>(initialFilters.kind);
  let status = $state<AssetStatusFilter>(initialFilters.status);

  const assets = $derived(mediaApi.assets);
  const storageSummary = $derived(mediaApi.storageSummary);
  const pagination = $derived(mediaApi.pagination);
  let assetsRequestId = 0;

  const searchBox = new DebouncedSearch({
    initial: initialFilters.search,
    onApply: () => {
      void applyMediaFilters();
    }
  });

  let lastUrlSearch = page.url.search;

  $effect(() => {
    const nextUrlSearch = page.url.search;

    if (nextUrlSearch === lastUrlSearch) return;

    lastUrlSearch = nextUrlSearch;
    const filters = parseMediaListFilters(page.url.searchParams);
    kind = filters.kind;
    status = filters.status;
    searchBox.sync(filters.search);
  });

  onDestroy(() => {
    searchBox.destroy();
  });

  async function applyMediaFilters() {
    const filters = {
      search: searchBox.applied,
      kind,
      status
    };
    const nextParams = mergeMediaListSearchParams(page.url.searchParams, filters, DEFAULT_MEDIA_LIST_NEXT);
    const nextSearch = nextParams.toString();

    if (nextSearch === page.url.searchParams.toString()) return;

    mediaApi.cancelListAssetsRequest();
    const nextUrl = `${page.url.pathname}${nextSearch ? `?${nextSearch}` : ''}${page.url.hash}`;
    await goto(resolve(nextUrl, {}), { replaceState: true, keepFocus: true, noScroll: true });
  }

  function updateLoadedPagesQuery(nextPage: number) {
    const filters = {
      search: searchBox.applied,
      kind,
      status
    };
    const nextParams = mergeMediaListSearchParams(page.url.searchParams, filters, nextPage);
    const nextSearch = nextParams.toString();

    if (nextSearch === page.url.searchParams.toString()) return;

    const nextUrl = `${page.url.pathname}${nextSearch ? `?${nextSearch}` : ''}${page.url.hash}`;
    replaceState(resolve(nextUrl, {}), page.state);
  }

  function buildAssetsQuery(pageNumber: number) {
    return {
      page: pageNumber,
      limit: MEDIA_PAGE_SIZE,
      search: searchBox.applied || undefined,
      kind: kind === 'all' ? undefined : kind,
      status: status === 'all' ? undefined : status
    };
  }

  async function loadAssetPages(pagesToLoad: number) {
    const requestId = ++assetsRequestId;
    isRefreshing = true;
    try {
      for (let pageNumber = 1; pageNumber <= pagesToLoad; pageNumber += 1) {
        await mediaApi.listAssets(buildAssetsQuery(pageNumber), {
          abortPrevious: true,
          append: pageNumber > 1
        });

        if (requestId !== assetsRequestId) return;
        if (mediaApi.pagination?.page !== pageNumber) return;
        if (pageNumber >= (pagination?.totalPages ?? 1)) break;
      }
    } finally {
      if (requestId === assetsRequestId) isRefreshing = false;
    }
  }

  function handleFiltersApply() {
    void applyMediaFilters();
  }

  async function loadMoreAssets() {
    if (!pagination || isLoadingMore || isRefreshing) return;

    const nextPage = pagination.page + 1;
    isLoadingMore = true;
    try {
      await mediaApi.listAssets(buildAssetsQuery(nextPage), { abortPrevious: true, append: true });

      if (mediaApi.pagination?.page === nextPage) {
        updateLoadedPagesQuery(nextPage);
      }
    } finally {
      isLoadingMore = false;
    }
  }

  async function refreshStorageSummary() {
    await mediaApi.getStorageSummary();
  }

  export async function refreshMediaData() {
    const pagesToLoad = Math.max(pagination?.page ?? 1, 1);
    await Promise.all([loadAssetPages(pagesToLoad), refreshStorageSummary()]);
  }

  function openEditAsset(asset: OrganizationAsset) {
    selectedAsset = asset;
    editOpen = true;
  }

  function openManageThumbnails(asset: OrganizationAsset) {
    selectedAsset = asset;
    manageThumbsOpen = true;
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

  async function loadUsage(asset: OrganizationAsset) {
    isUsageLoading = true;
    try {
      usageData = await mediaApi.getAssetUsage(asset.id);
    } finally {
      isUsageLoading = false;
    }
  }

  async function openUsage(asset: OrganizationAsset) {
    selectedAsset = asset;
    usageOpen = true;
    usageData = null;
    await loadUsage(asset);
  }

  async function refreshUsage() {
    if (!selectedAsset) return;

    await loadUsage(selectedAsset);
  }

  function resetUsageModalState() {
    selectedAsset = null;
    usageData = null;
    isUsageLoading = false;
  }

  async function openDelete(asset: OrganizationAsset) {
    selectedAsset = asset;
    deleteOpen = true;
    usageData = null;
    await loadUsage(asset);
  }

  async function confirmDelete() {
    if (!selectedAsset) return;

    isDeleting = true;
    try {
      const deleted = await mediaApi.deleteAsset(selectedAsset.id);
      if (!deleted) return;

      deleteOpen = false;
      await refreshStorageSummary();
    } finally {
      isDeleting = false;
    }
  }

  function handleDeleteOpenChange(isOpen: boolean) {
    if (!isOpen) {
      resetUsageModalState();
    }
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

  const hasMore = $derived(Boolean(pagination && pagination.page < pagination.totalPages));
</script>

<StorageCards {storageSummary} />

<Page.BodyHeader class="flex-col flex-wrap! items-start! gap-3 lg:flex-row">
  <MediaFilters
    bind:kind
    bind:status
    searchDraft={searchBox.draft}
    onSearchInput={(nextValue) => searchBox.input(nextValue)}
    {isRefreshing}
    onApply={handleFiltersApply}
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
      <AssetCard
        {asset}
        {downloadingAssetId}
        onEdit={openEditAsset}
        onUsage={openUsage}
        onDownload={downloadAsset}
        onManageThumbnails={openManageThumbnails}
        onDelete={openDelete}
      />
    {/each}
  </Item.Group>
{/if}

{#if hasMore}
  <div class="flex justify-center">
    <Button variant="secondary" loading={isLoadingMore} disabled={isRefreshing} onclick={loadMoreAssets}>
      {$t('courses.load_more')}
    </Button>
  </div>
{/if}

<EditAssetDialog bind:open={editOpen} asset={selectedAsset} isSaving={isSavingAsset} onSave={saveAsset} />

<ManageThumbnailsDialog bind:open={manageThumbsOpen} asset={selectedAsset} />

<AssetUsageDialog
  bind:open={usageOpen}
  {selectedAsset}
  {usageData}
  isLoading={isUsageLoading}
  onRefresh={refreshUsage}
  onOpenChange={handleUsageOpenChange}
/>

<DeleteAssetDialog
  bind:open={deleteOpen}
  asset={selectedAsset}
  {usageData}
  isLoadingUsage={isUsageLoading}
  {isDeleting}
  onConfirm={confirmDelete}
  onRefresh={refreshUsage}
  onOpenChange={handleDeleteOpenChange}
/>
