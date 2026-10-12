<script lang="ts">
  import * as Item from '@cio/ui/base/item';
  import * as Page from '@cio/ui/base/page';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import VideoIcon from '@lucide/svelte/icons/video';

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
  import { packageApi } from '$features/course/api/package.svelte';
  import CoursesFromPackagesDialog, {
    type DialogPackage
  } from '$features/course/components/activity/courses-from-packages-dialog.svelte';
  import type { CreatedPackageCourses } from '$features/course/utils/types';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { DebouncedSearch } from '$lib/utils/functions/debounced-search.svelte';
  import { onDestroy, untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';

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
  let manageThumbsOpen = $state(false);
  let deleteOpen = $state(false);
  let isSavingAsset = $state(false);
  let isUsageLoading = $state(false);
  let isDeleting = $state(false);
  let downloadingAssetId = $state<string | null>(null);
  let selectedAsset = $state<OrganizationAsset | null>(null);
  let usageData = $state<AssetUsageGraph | null>(null);

  const assets = $derived(mediaApi.assets);
  const storageSummary = $derived(mediaApi.storageSummary);
  const pagination = $derived(mediaApi.pagination);
  let assetsRequestId = 0;

  let selecting = $state(false);
  let selectedIds = new SvelteSet<string>();
  let scormMeta = $state<Record<string, { moduleCount: number | null; ready: boolean }>>({});
  let coursesDialogOpen = $state(false);
  let coursesDialogPackages = $state<DialogPackage[]>([]);

  const isScormFilter = $derived(kind === 'scorm');
  const selectedCount = $derived(selectedIds.size);

  $effect(() => {
    if (!isScormFilter && selecting) {
      selecting = false;
      selectedIds.clear();
    }
  });

  function scormMetaFor(assetId: string) {
    return scormMeta[assetId] ?? { moduleCount: null, ready: false };
  }

  function isPackageSelectable(asset: OrganizationAsset) {
    return asset.kind === 'scorm' && scormMetaFor(asset.id).ready;
  }

  async function loadScormMeta(requestId: number, scopedAssets: OrganizationAsset[]) {
    const packages = scopedAssets.filter((asset) => asset.kind === 'scorm');

    await Promise.all(
      packages.map(async (asset) => {
        const details = await packageApi.get(asset.id);
        if (requestId !== assetsRequestId) return;

        const current = details?.currentVersion ?? null;
        const moduleCount = details ? details.units.filter((unit) => unit.unitType === 'sco').length : null;
        scormMeta = {
          ...scormMeta,
          [asset.id]: { moduleCount, ready: current?.status === 'ready' }
        };
      })
    );
  }

  const searchBox = new DebouncedSearch({
    initial: untrack(() => search),
    onApply: (nextSearch) => {
      search = nextSearch;
      void refreshAssets(1);
    }
  });

  onDestroy(() => {
    searchBox.destroy();
  });

  async function refreshAssets(page = 1) {
    const requestId = ++assetsRequestId;
    isRefreshing = true;
    try {
      await mediaApi.listAssets(
        {
          page,
          limit: pagination?.limit ?? 20,
          search: searchBox.applied || undefined,
          kind: kind === 'all' ? undefined : kind,
          status: status === 'all' ? undefined : status
        },
        { abortPrevious: true }
      );
      if (requestId === assetsRequestId) {
        selectedIds.clear();
        await loadScormMeta(requestId, mediaApi.assets);
      }
    } finally {
      if (requestId === assetsRequestId) isRefreshing = false;
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

  function toggleSelecting() {
    selecting = !selecting;
    selectedIds.clear();
  }

  function togglePackageSelected(asset: OrganizationAsset) {
    if (!isPackageSelectable(asset)) return;

    if (selectedIds.has(asset.id)) selectedIds.delete(asset.id);
    else selectedIds.add(asset.id);
  }

  function openCoursesDialog(scopedAssets: OrganizationAsset[]) {
    const selectable = scopedAssets.filter((asset) => isPackageSelectable(asset));
    if (selectable.length === 0) return;

    coursesDialogPackages = selectable.map((asset) => ({
      assetId: asset.id,
      title: asset.title?.trim() || asset.id,
      moduleCount: scormMetaFor(asset.id).moduleCount
    }));
    coursesDialogOpen = true;
  }

  function handleCoursesCreated(created: CreatedPackageCourses) {
    void created;
    coursesDialogOpen = false;
    coursesDialogPackages = [];
    selecting = false;
    selectedIds.clear();
    void refreshAssets(1);
  }

  function handleCoursesDialogOpenChange(isOpen: boolean) {
    if (!isOpen) {
      coursesDialogPackages = [];
    }
  }

  const prevPage = $derived(Math.max(1, (pagination?.page ?? 1) - 1));
  const nextPage = $derived((pagination?.page ?? 1) + 1);
</script>

<StorageCards {storageSummary} />

<Page.BodyHeader class="flex-col flex-wrap! items-start! gap-3 lg:flex-row">
  <MediaFilters
    bind:kind
    bind:status
    searchDraft={searchBox.draft}
    onSearchInput={(nextValue) => searchBox.input(nextValue)}
    {isRefreshing}
    onApply={() => void refreshAssets(1)}
    onRefresh={refreshMediaData}
  />
  {#if isScormFilter}
    <div class="flex flex-wrap items-center gap-2">
      <Button
        variant={selecting ? 'secondary' : 'outline'}
        size="sm"
        onclick={toggleSelecting}
        testId="media-scorm-select"
      >
        {selecting ? $t('media_manager.scorm.cancel_select') : $t('media_manager.scorm.select')}
      </Button>
      {#if selecting}
        <p class="ui:text-muted-foreground text-sm" aria-live="polite">
          {$t('media_manager.scorm.selected_count', { count: selectedCount })}
        </p>
        <Button
          variant="default"
          size="sm"
          disabled={selectedCount === 0}
          onclick={() => openCoursesDialog(assets.filter((asset) => selectedIds.has(asset.id)))}
          testId="media-create-courses"
        >
          {$t('media_manager.scorm.create_n_courses', { count: selectedCount })}
        </Button>
      {/if}
    </div>
  {/if}
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
        selectable={selecting}
        selected={selectedIds.has(asset.id)}
        selectDisabled={selecting && !isPackageSelectable(asset)}
        scormModuleCount={asset.kind === 'scorm' ? scormMetaFor(asset.id).moduleCount : null}
        scormReady={asset.kind === 'scorm' ? scormMetaFor(asset.id).ready : false}
        onEdit={openEditAsset}
        onUsage={openUsage}
        onDownload={downloadAsset}
        onManageThumbnails={openManageThumbnails}
        onDelete={openDelete}
        onToggleSelect={togglePackageSelected}
        onCreateCourse={(single) => openCoursesDialog([single])}
      />
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

<CoursesFromPackagesDialog
  bind:open={coursesDialogOpen}
  packages={coursesDialogPackages}
  onCreated={handleCoursesCreated}
  onOpenChange={handleCoursesDialogOpenChange}
/>
