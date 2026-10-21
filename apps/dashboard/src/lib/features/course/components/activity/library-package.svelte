<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import { InputField } from '@cio/ui/custom/input-field';
  import PackageIcon from '@lucide/svelte/icons/package';
  import { activityApi } from '$features/course/api';
  import { mediaApi } from '$features/media/api';
  import type { OrganizationAsset } from '$features/media/utils';
  import { formatBytes, formatUsageDate } from '$features/media/utils';
  import { onDestroy, onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { fly } from 'svelte/transition';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { DebouncedSearch } from '$lib/utils/functions/debounced-search.svelte';

  interface Props {
    courseId: string;
    activityId: string;
    currentAssetId?: string | null;
    onAttached?: (assetId: string) => void;
  }

  let { courseId, activityId, currentAssetId = null, onAttached = () => {} }: Props = $props();

  const PAGE_SIZE = 20;

  const search = new DebouncedSearch({
    onApply: () => void loadLibrary(1)
  });

  onDestroy(() => {
    search.destroy();
  });

  let isLoading = $state(false);
  let isInitialLoading = $state(true);
  let addingAssetId = $state<string | null>(null);
  let assets = $state<OrganizationAsset[]>([]);
  let page = $state(1);
  let totalPages = $state(1);
  let totalCount = $state(0);
  let libraryRequestId = 0;

  const visibleAssets = $derived(assets.filter((asset) => asset.id !== currentAssetId));

  async function loadLibrary(targetPage = 1) {
    const requestId = ++libraryRequestId;
    isLoading = true;
    try {
      await mediaApi.listAssets(
        {
          kind: 'scorm',
          status: 'active',
          limit: PAGE_SIZE,
          page: targetPage,
          search: search.applied || undefined
        },
        { abortPrevious: true }
      );
      if (requestId !== libraryRequestId) return;

      page = targetPage;
      assets = mediaApi.assets.filter((asset) => asset.kind === 'scorm' && (asset.status ?? 'active') !== 'archived');
      totalPages = mediaApi.pagination?.totalPages ?? 1;
      totalCount = mediaApi.pagination?.total ?? assets.length;
    } finally {
      if (requestId === libraryRequestId) {
        isLoading = false;
        isInitialLoading = false;
      }
    }
  }

  async function addFromLibrary(asset: OrganizationAsset) {
    addingAssetId = asset.id;
    try {
      await activityApi.attachPackage(courseId, activityId, asset.id);
      if (!activityApi.success) return;

      snackbar.success('course.navItem.lessons.activities.package.library_attached_success');
      onAttached(asset.id);
    } finally {
      addingAssetId = null;
    }
  }

  onMount(async () => {
    await loadLibrary();
  });
</script>

<div class="min-w-0 space-y-3">
  <div class="flex items-end gap-3">
    <InputField
      label={`${$t('course.navItem.lessons.activities.package.library_search')} (${totalCount})`}
      value={search.draft}
      onInput={(e) => search.input(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') search.flush();
      }}
      className="flex-1"
      placeholder={$t('course.navItem.lessons.activities.package.library_search')}
    />
    <Button
      onclick={() => {
        search.takePending();
        void loadLibrary(1);
      }}
      loading={isLoading}
      disabled={isLoading}
    >
      {$t('course.navItem.lessons.activities.package.library_search_action')}
    </Button>
  </div>

  {#if isInitialLoading}
    <Empty
      description={$t('course.navItem.lessons.activities.package.library_loading')}
      icon={Spinner}
      class="max-h-40 py-6"
    />
  {:else if visibleAssets.length === 0}
    <p class="ui:text-muted-foreground py-6 text-center text-sm">
      {$t('course.navItem.lessons.activities.package.library_empty')}
    </p>
  {:else}
    <div
      class="max-h-[360px] space-y-2 overflow-x-hidden overflow-y-auto transition-opacity"
      class:opacity-60={isLoading}
    >
      {#each visibleAssets as asset (asset.id)}
        <div
          class="flex items-center justify-between gap-3 rounded-md border p-3"
          animate:flip={{ duration: 250 }}
          out:fly={{ x: -400, duration: 300 }}
        >
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <div
              class="ui:bg-muted/40 flex size-10 shrink-0 items-center justify-center overflow-hidden rounded border"
            >
              <PackageIcon class="ui:text-muted-foreground size-5" />
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{asset.title || asset.storageKey || asset.id}</p>
              <p class="ui:text-muted-foreground text-xs">
                {formatBytes(asset.byteSize)} · {formatUsageDate(asset.createdAt)}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            class="shrink-0"
            onclick={() => addFromLibrary(asset)}
            loading={addingAssetId === asset.id}
            disabled={addingAssetId !== null}
          >
            {$t('course.navItem.lessons.activities.package.library_attach')}
          </Button>
        </div>
      {/each}
    </div>
  {/if}

  {#if totalPages > 1}
    <div class="flex items-center justify-end gap-2">
      <Button variant="outline" size="sm" disabled={isLoading || page <= 1} onclick={() => loadLibrary(page - 1)}>
        {$t('media_manager.pagination.previous')}
      </Button>
      <p class="ui:text-muted-foreground text-sm">
        {$t('media_manager.pagination.page')}
        {page}
        / {totalPages}
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled={isLoading || page >= totalPages}
        onclick={() => loadLibrary(page + 1)}
      >
        {$t('media_manager.pagination.next')}
      </Button>
    </div>
  {/if}
</div>
