<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { lessonApi } from '$features/course/api';
  import { mediaManagerApi } from '$features/media-manager/api';
  import type { OrganizationAsset } from '$features/media-manager/utils';
  import { onMount } from 'svelte';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    lessonId?: string;
  }

  let { lessonId = '' }: Props = $props();

  let search = $state('');
  let isLoading = $state(false);

  const assets = $derived(
    mediaManagerApi.assets.filter((asset) => asset.kind === 'video' && (asset.status ?? 'active') !== 'archived')
  );

  async function loadLibrary() {
    isLoading = true;
    await mediaManagerApi.listAssets({
      kind: 'video',
      limit: 100,
      search: search.trim() || undefined
    });
    isLoading = false;
  }

  async function addFromLibrary(asset: OrganizationAsset) {
    if (!lessonApi.lesson) return;

    const position = Array.isArray(lessonApi.lesson.videos) ? lessonApi.lesson.videos.length : 0;
    const lessonVideo = await mediaManagerApi.buildLessonVideoFromAsset(asset, {
      lessonId: lessonId || undefined,
      position,
      slotType: 'lesson_video'
    });

    if (!lessonVideo) {
      return;
    }

    lessonApi.updateLessonState('videos', [lessonVideo], { append: true });
  }

  onMount(async () => {
    await loadLibrary();
  });
</script>

<div class="space-y-3">
  <div class="flex items-end gap-3">
    <InputField
      label={$t('course.navItem.lessons.materials.tabs.video.add_video.search_library')}
      bind:value={search}
      className="flex-1"
      placeholder={$t('course.navItem.lessons.materials.tabs.video.add_video.search_library')}
    />
    <Button onclick={loadLibrary} loading={isLoading} disabled={isLoading}>
      {$t('course.navItem.lessons.materials.tabs.video.add_video.search_library_action')}
    </Button>
  </div>

  {#if isLoading}
    <p class="ui:text-muted-foreground text-sm">
      {$t('course.navItem.lessons.materials.tabs.video.add_video.loading_library')}
    </p>
  {:else if assets.length === 0}
    <p class="ui:text-muted-foreground text-sm">
      {$t('course.navItem.lessons.materials.tabs.video.add_video.no_library_videos')}
    </p>
  {:else}
    <div class="max-h-[360px] space-y-2 overflow-auto pr-1">
      {#each assets as asset (asset.id)}
        <div class="flex items-center justify-between rounded-md border p-3">
          <div class="min-w-0">
            <p class="truncate text-sm font-medium">{asset.title || asset.storageKey || asset.id}</p>
            <p class="ui:text-muted-foreground text-xs">{asset.provider}</p>
          </div>
          <Button size="sm" onclick={() => addFromLibrary(asset)}>
            {$t('course.navItem.lessons.materials.tabs.video.add_video.add_from_library')}
          </Button>
        </div>
      {/each}
    </div>
  {/if}
</div>
