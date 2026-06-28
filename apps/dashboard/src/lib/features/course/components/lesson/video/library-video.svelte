<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Spinner } from '@cio/ui/base/spinner';
  import { Empty } from '@cio/ui/custom/empty';
  import { InputField } from '@cio/ui/custom/input-field';
  import VideoIcon from '@lucide/svelte/icons/video';
  import { lessonApi } from '$features/course/api';
  import { mediaApi } from '$features/media/api';
  import type { OrganizationAsset } from '$features/media/utils';
  import { onMount } from 'svelte';
  import { flip } from 'svelte/animate';
  import { fly } from 'svelte/transition';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    lessonId?: string;
  }

  let { lessonId = '' }: Props = $props();

  const PAGE_SIZE = 20;

  let search = $state('');
  let isLoading = $state(false);
  let addingAssetId = $state<string | null>(null);
  // Local copy so the fetch (which also backs the media manager page via the
  // shared mediaApi.assets store) doesn't leak removals between surfaces.
  let assets = $state<OrganizationAsset[]>([]);
  let page = $state(1);
  let totalPages = $state(1);
  let totalCount = $state(0);

  // Asset ids already attached to this lesson, so the library hides them.
  const addedAssetIds = $derived(
    new Set(
      (lessonApi.lesson?.videos ?? [])
        .map((video) => (video as { assetId?: string }).assetId)
        .filter((id): id is string => Boolean(id))
    )
  );

  const visibleAssets = $derived(assets.filter((asset) => !addedAssetIds.has(asset.id)));

  async function loadLibrary(targetPage = 1) {
    isLoading = true;
    page = targetPage;
    await mediaApi.listAssets({
      kind: 'video',
      limit: PAGE_SIZE,
      page: targetPage,
      search: search.trim() || undefined
    });
    assets = mediaApi.assets.filter((asset) => asset.kind === 'video' && (asset.status ?? 'active') !== 'archived');
    totalPages = mediaApi.pagination?.totalPages ?? 1;
    totalCount = mediaApi.pagination?.total ?? assets.length;
    isLoading = false;
  }

  async function addFromLibrary(asset: OrganizationAsset) {
    if (!lessonApi.lesson) return;

    addingAssetId = asset.id;
    try {
      const position = Array.isArray(lessonApi.lesson.videos) ? lessonApi.lesson.videos.length : 0;
      const lessonVideo = await mediaApi.buildLessonVideoFromAsset(asset, {
        lessonId: lessonId || undefined,
        position,
        slotType: 'lesson_video'
      });

      if (!lessonVideo) {
        return;
      }

      lessonApi.updateLessonState('videos', [lessonVideo], { append: true });
      snackbar.success('snackbar.media_manager.added_to_lesson');
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
      label={`${$t('course.navItem.lessons.materials.tabs.video.add_video.search_library')} (${totalCount})`}
      bind:value={search}
      className="flex-1"
      placeholder={$t('course.navItem.lessons.materials.tabs.video.add_video.search_library')}
    />
    <Button onclick={() => loadLibrary(1)} loading={isLoading} disabled={isLoading}>
      {$t('course.navItem.lessons.materials.tabs.video.add_video.search_library_action')}
    </Button>
  </div>

  {#if isLoading}
    <Empty
      description={$t('course.navItem.lessons.materials.tabs.video.add_video.loading_library')}
      icon={Spinner}
      class="ui:max-h-40 py-6"
    />
  {:else if visibleAssets.length === 0}
    <p class="ui:text-muted-foreground text-sm">
      {$t('course.navItem.lessons.materials.tabs.video.add_video.no_library_videos')}
    </p>
  {:else}
    <div class="max-h-[360px] space-y-2 overflow-x-hidden">
      {#each visibleAssets as asset (asset.id)}
        <div
          class="flex items-center justify-between gap-3 rounded-md border p-3"
          animate:flip={{ duration: 250 }}
          out:fly={{ x: -400, duration: 300 }}
        >
          <div class="flex min-w-0 flex-1 items-center gap-3">
            <div
              class="ui:bg-muted/40 flex h-12 w-20 shrink-0 items-center justify-center overflow-hidden rounded border"
            >
              {#if asset.thumbnailUrl}
                <img src={asset.thumbnailUrl} alt={asset.title ?? ''} class="h-full w-full object-cover" />
              {:else}
                <VideoIcon class="ui:text-muted-foreground size-5" />
              {/if}
            </div>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{asset.title || asset.storageKey || asset.id}</p>
              <p class="ui:text-muted-foreground text-xs">{asset.provider}</p>
            </div>
          </div>
          <Button
            size="sm"
            class="shrink-0"
            onclick={() => addFromLibrary(asset)}
            loading={addingAssetId === asset.id}
            disabled={addingAssetId !== null}
          >
            {$t('course.navItem.lessons.materials.tabs.video.add_video.add_from_library')}
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
