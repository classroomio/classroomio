<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { SvelteMap } from 'svelte/reactivity';
  import { fly } from 'svelte/transition';
  import { Button } from '@cio/ui/base/button';
  import { Checkbox } from '@cio/ui/base/checkbox';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import { InputField } from '@cio/ui/custom/input-field';
  import { FileTypeBadge } from '@cio/ui/custom/upload-file-card';
  import { lessonApi } from '$features/course/api';
  import { mediaApi } from '$features/media/api';
  import { formatBytes, getAssetDisplayName } from '$features/media/utils';
  import type { OrganizationAsset } from '$features/media/utils';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { DebouncedSearch } from '$lib/utils/functions/debounced-search.svelte';

  interface Props {
    lessonId?: string;
  }

  let { lessonId = '' }: Props = $props();

  const PAGE_SIZE = 20;
  const keyPrefix = 'course.navItem.lessons.materials.tabs';

  const search = new DebouncedSearch({
    onApply: () => void loadLibrary(1)
  });

  onDestroy(() => {
    search.destroy();
  });

  let isLoading = $state(false);
  let isInitialLoading = $state(true);
  let isAdding = $state(false);
  let assets = $state<OrganizationAsset[]>([]);
  let page = $state(1);
  let totalPages = $state(1);
  let totalCount = $state(0);
  let libraryRequestId = 0;

  const selectedAssets = new SvelteMap<string, OrganizationAsset>();

  const addedAssetIds = $derived(
    new Set(
      (lessonApi.lesson?.documents ?? []).map((document) => document.assetId).filter((id): id is string => Boolean(id))
    )
  );

  const visibleAssets = $derived(assets.filter((asset) => !addedAssetIds.has(asset.id)));
  const selectedCount = $derived(selectedAssets.size);

  async function loadLibrary(targetPage = 1) {
    const requestId = ++libraryRequestId;
    isLoading = true;

    try {
      await mediaApi.listAssets(
        {
          kind: 'document',
          limit: PAGE_SIZE,
          page: targetPage,
          search: search.applied || undefined
        },
        { abortPrevious: true }
      );
      if (requestId !== libraryRequestId) return;

      page = targetPage;
      assets = mediaApi.assets.filter(
        (asset) => asset.kind === 'document' && (asset.status ?? 'active') !== 'archived'
      );
      totalPages = mediaApi.pagination?.totalPages ?? 1;
      totalCount = mediaApi.pagination?.total ?? assets.length;
    } finally {
      if (requestId === libraryRequestId) {
        isLoading = false;
        isInitialLoading = false;
      }
    }
  }

  function toggleSelection(asset: OrganizationAsset) {
    if (selectedAssets.has(asset.id)) {
      selectedAssets.delete(asset.id);
      return;
    }

    selectedAssets.set(asset.id, asset);
  }

  async function addSelectedToLesson() {
    if (!lessonApi.lesson || selectedAssets.size === 0) return;

    const targetLessonId = lessonId;
    isAdding = true;
    const assetsToAdd = [...selectedAssets.values()];
    let addedCount = 0;

    try {
      for (const asset of assetsToAdd) {
        if (lessonApi.lesson?.id !== targetLessonId) break;

        const position = lessonApi.lesson.documents?.length ?? 0;
        const lessonDocument = await mediaApi.buildLessonDocumentFromAsset(asset, {
          lessonId: targetLessonId || undefined,
          position
        });

        if (!lessonDocument) continue;

        if (lessonApi.lesson?.id !== targetLessonId) {
          await mediaApi.detachAsset(asset.id, {
            targetType: 'lesson',
            targetId: targetLessonId,
            slotType: 'lesson_document',
            position
          });
          break;
        }

        lessonApi.updateLessonState('documents', [lessonDocument], { append: true });
        selectedAssets.delete(asset.id);
        addedCount += 1;
      }
    } finally {
      isAdding = false;
    }

    if (addedCount === 0) return;

    snackbar.success(
      addedCount === 1
        ? 'snackbar.media_manager.document_added_to_lesson'
        : 'snackbar.media_manager.documents_added_to_lesson'
    );
  }

  onMount(async () => {
    await loadLibrary();
  });
</script>

<div class="min-w-0 space-y-3">
  <div class="flex items-end gap-3">
    <InputField
      label={`${$t(`${keyPrefix}.video.add_video.search_library`)} (${totalCount})`}
      value={search.draft}
      onInput={(e) => search.input(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') search.flush();
      }}
      className="flex-1"
      placeholder={$t(`${keyPrefix}.video.add_video.search_library`)}
    />
    <Button
      onclick={() => {
        search.takePending();
        void loadLibrary(1);
      }}
      loading={isLoading}
      disabled={isLoading}
    >
      {$t(`${keyPrefix}.video.add_video.search_library_action`)}
    </Button>
  </div>

  {#if isInitialLoading}
    <Empty description={$t(`${keyPrefix}.video.add_video.loading_library`)} icon={Spinner} class="max-h-40 py-6" />
  {:else if visibleAssets.length === 0}
    <p class="ui:text-muted-foreground text-sm">{$t(`${keyPrefix}.document.no_library_documents`)}</p>
  {:else}
    <div
      class="max-h-[320px] space-y-2 overflow-x-hidden overflow-y-auto transition-opacity"
      class:opacity-60={isLoading}
    >
      {#each visibleAssets as asset (asset.id)}
        {@const displayName = getAssetDisplayName(asset)}
        <label
          for={`library-document-${asset.id}`}
          class="flex cursor-pointer items-center gap-3 rounded-lg border p-3"
          animate:flip={{ duration: 250 }}
          out:fly={{ x: -400, duration: 300 }}
        >
          <Checkbox
            id={`library-document-${asset.id}`}
            checked={selectedAssets.has(asset.id)}
            onCheckedChange={() => toggleSelection(asset)}
            disabled={isAdding}
          />
          <FileTypeBadge name={displayName} />
          <p class="min-w-0 flex-1 truncate text-sm font-medium">{displayName}</p>
          <span class="ui:text-muted-foreground shrink-0 text-sm">{formatBytes(asset.byteSize)}</span>
        </label>
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

  {#if selectedCount > 0}
    <div class="flex items-center justify-between gap-3 border-t pt-4">
      <div class="flex items-center gap-3">
        <span class="text-sm font-medium">{$t(`${keyPrefix}.document.selected_count`, { count: selectedCount })}</span>
        <Button variant="link" size="sm" class="h-auto p-0" disabled={isAdding} onclick={() => selectedAssets.clear()}>
          {$t(`${keyPrefix}.document.clear_selection`)}
        </Button>
      </div>
      <Button onclick={addSelectedToLesson} loading={isAdding} disabled={isAdding}>
        {selectedCount === 1
          ? $t(`${keyPrefix}.document.add_one_file`)
          : $t(`${keyPrefix}.document.add_files`, { count: selectedCount })}
      </Button>
    </div>
  {/if}
</div>
