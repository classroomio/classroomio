<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as FileDropZone from '@cio/ui/custom/file-drop-zone';
  import type { FileRejectedReason } from '@cio/ui/custom/file-drop-zone';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import MediaPlayer from '@cio/ui/custom/media-player/media-player.svelte';
  import CheckIcon from '@lucide/svelte/icons/check';
  import RefreshCcwIcon from '@lucide/svelte/icons/refresh-ccw';

  import { mediaApi } from '$features/media/api';
  import type { OrganizationAsset } from '$features/media/utils';
  import { snackbar } from '$features/ui/snackbar/store';
  import { t } from '$lib/utils/functions/translations';
  import { uploadImage } from '$lib/utils/services/upload';
  import { classroomio } from '$lib/utils/services/api';
  import { getResolvedUploadLimits } from '$lib/utils/config/upload-limits-context';

  function buildHlsUrl(asset: OrganizationAsset): string | null {
    if (!asset.hlsManifestKey) return null;

    const built = classroomio.hls[':assetId']['*'].$url({ param: { assetId: asset.id } });
    return built.toString().replace(/\/\*$/, '') + '/master.m3u8';
  }

  async function mintHlsCookie(assetId: string): Promise<void> {
    await classroomio.organization.assets[':assetId'].hls.cookie.$post({ param: { assetId } });
  }

  interface Props {
    open?: boolean;
    asset?: OrganizationAsset | null;
    onThumbnailSaved?: (asset: OrganizationAsset) => void;
  }

  const uploadLimits = getResolvedUploadLimits();
  const thumbnailMaxSize = uploadLimits.thumbnailBytes;
  const REGEN_POLL_INTERVAL_MS = 2000;
  const REGEN_POLL_TIMEOUT_MS = 60_000;
  const SLOT_KEYS = ['start', 'middle', 'end'] as const;
  type Slot = (typeof SLOT_KEYS)[number];

  let { open = $bindable(false), asset = null, onThumbnailSaved }: Props = $props();

  let selectedUrl = $state<string | null>(null);
  let customUrl = $state<string | null>(null);
  let videoUrl = $state<string | null>(null);
  let playerRef = $state<ReturnType<typeof MediaPlayer> | null>(null);
  let isVideoLoading = $state(false);
  let isUploading = $state(false);
  let isSaving = $state(false);
  let isRegenerating = $state(false);

  const candidates = $derived((asset?.thumbnailCandidates ?? []) as string[]);
  const currentThumbnail = $derived(asset?.thumbnailUrl ?? null);
  const hasSelection = $derived(Boolean(selectedUrl) && selectedUrl !== currentThumbnail);
  const allCandidatesMissing = $derived(candidates.length === 0 && !isRegenerating);

  function slotForIndex(index: number): Slot {
    return SLOT_KEYS[Math.min(index, SLOT_KEYS.length - 1)];
  }

  $effect(() => {
    if (!open || !asset) return;

    selectedUrl = asset.thumbnailUrl ?? candidates[0] ?? null;
    customUrl = null;
    void loadVideoPreview(asset);
  });

  async function loadVideoPreview(target: OrganizationAsset) {
    if (target.kind !== 'video') {
      videoUrl = null;
      return;
    }

    isVideoLoading = true;
    try {
      videoUrl = await mediaApi.getVideoPlaybackUrl(target);
    } finally {
      isVideoLoading = false;
    }
  }

  function resetState() {
    selectedUrl = null;
    customUrl = null;
    videoUrl = null;
    isUploading = false;
    isSaving = false;
    isRegenerating = false;
  }

  function selectCandidate(url: string) {
    selectedUrl = url;
    playerRef?.setPoster(url);
  }

  async function handleCustomUpload(files: File[]) {
    const file = files[0];
    if (!file) return;

    isUploading = true;
    try {
      const url = await uploadImage(file);
      customUrl = url;
      selectedUrl = url;
      playerRef?.setPoster(url);
      snackbar.success('snackbar.media_manager.thumbnail_uploaded');
    } catch {
      snackbar.error('snackbar.media_manager.thumbnail_upload_failed');
    } finally {
      isUploading = false;
    }
  }

  function handleUploadRejected({ reason }: { reason: FileRejectedReason }) {
    if (reason === 'Maximum file size exceeded') {
      snackbar.error('snackbar.media_manager.thumbnail_too_large');
      return;
    }
    snackbar.error('snackbar.media_manager.thumbnail_invalid');
  }

  async function pollUntilRegenComplete(assetId: string) {
    const deadline = Date.now() + REGEN_POLL_TIMEOUT_MS;
    const initialCandidates = candidates.slice().sort().join('|');
    while (Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, REGEN_POLL_INTERVAL_MS));
      const next = await mediaApi.refreshAsset(assetId);
      if (!next) continue;

      const nextCandidates = ((next.thumbnailCandidates ?? []) as string[]).slice().sort().join('|');
      if (nextCandidates && nextCandidates !== initialCandidates) {
        asset = next;
        selectedUrl = next.thumbnailUrl ?? ((next.thumbnailCandidates ?? [])[0] as string | undefined) ?? null;
        return;
      }
    }
  }

  async function regenerate() {
    if (!asset || isRegenerating) return;

    isRegenerating = true;
    try {
      const jobId = await mediaApi.regenerateThumbnails(asset.id);
      if (!jobId) return;

      await pollUntilRegenComplete(asset.id);
    } finally {
      isRegenerating = false;
    }
  }

  async function save() {
    if (!asset || !selectedUrl || !hasSelection) return;

    isSaving = true;
    try {
      const updated = await mediaApi.selectThumbnail(asset.id, selectedUrl);
      if (!updated) return;
      asset = updated;
      onThumbnailSaved?.(updated);
      open = false;
    } finally {
      isSaving = false;
    }
  }
</script>

<Dialog.Root
  bind:open
  onOpenChange={(isOpen) => {
    if (!isOpen) resetState();
  }}
>
  <Dialog.Content
    class="ui:max-h-[85vh] ui:w-[95%] ui:max-w-3xl ui:overflow-hidden ui:grid-rows-[auto_minmax(0,1fr)_auto] ui:pb-0"
  >
    <Dialog.Header>
      <Dialog.Title>{$t('media_manager.thumbnails.manage_title')}</Dialog.Title>
      <Dialog.Description>{$t('media_manager.thumbnails.manage_description')}</Dialog.Description>
    </Dialog.Header>

    {#if asset}
      {@const activeAsset = asset}
      <div class="ui:min-h-0 ui:overflow-y-auto">
        <div class="space-y-5 p-1">
          <div class="ui:bg-muted/40 aspect-video w-full overflow-hidden rounded-md border">
            {#if isVideoLoading}
              <Skeleton class="h-full w-full" />
            {:else if activeAsset.hlsManifestKey}
              {@const hlsUrl = buildHlsUrl(activeAsset)}
              {#if hlsUrl}
                <MediaPlayer
                  bind:this={playerRef}
                  source={{
                    type: 'upload',
                    url: hlsUrl,
                    hls: true,
                    metadata: { thumbnailUrl: selectedUrl ?? customUrl ?? activeAsset.thumbnailUrl ?? undefined }
                  }}
                  options={{
                    controls: true,
                    playsinline: true,
                    onBeforeHlsLoad: () => mintHlsCookie(activeAsset.id)
                  }}
                />
              {/if}
            {:else if videoUrl}
              <!-- svelte-ignore a11y_media_has_caption -->
              <video
                controls
                preload="metadata"
                poster={selectedUrl ?? customUrl ?? activeAsset.thumbnailUrl ?? undefined}
                src={videoUrl}
                class="h-full w-full bg-black"
              ></video>
            {:else}
              <div class="ui:text-muted-foreground flex h-full w-full items-center justify-center text-sm">
                {$t('media_manager.thumbnails.preview_unavailable')}
              </div>
            {/if}
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between gap-3">
              <p class="text-sm font-medium">{$t('media_manager.thumbnails.generated')}</p>
              <div class="flex items-center gap-3">
                {#if allCandidatesMissing}
                  <p class="ui:text-muted-foreground text-xs">
                    {$t('media_manager.thumbnails.none_generated_warning')}
                  </p>
                {/if}
                <Button variant="ghost" size="sm" onclick={regenerate} loading={isRegenerating} disabled={isSaving}>
                  <RefreshCcwIcon class="size-4" />
                  {$t('media_manager.thumbnails.regenerate')}
                </Button>
              </div>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {#each SLOT_KEYS as slotKey, index (slotKey)}
                {@const url = candidates[index] ?? null}
                {@const isSelected = url !== null && url === selectedUrl}
                {#if isRegenerating}
                  <Skeleton class="aspect-video w-full rounded-md" />
                {:else if url}
                  <button
                    type="button"
                    onclick={() => selectCandidate(url)}
                    class={`ui:focus-visible:ring-ring relative aspect-video w-full overflow-hidden rounded-md border text-left transition focus-visible:ring-2 focus-visible:outline-none ${
                      isSelected ? 'ring-primary border-primary ring-2' : 'hover:border-primary/50'
                    }`}
                    aria-pressed={isSelected}
                  >
                    <img
                      src={url}
                      alt={$t(`media_manager.thumbnails.slot_${slotForIndex(index)}`)}
                      class="h-full w-full object-cover"
                    />
                    <span
                      class="ui:bg-background/85 absolute bottom-1 left-1 rounded px-1.5 py-0.5 text-[10px] font-medium tracking-wide uppercase"
                    >
                      {$t(`media_manager.thumbnails.slot_${slotForIndex(index)}`)}
                    </span>
                    {#if isSelected}
                      <span
                        class="ui:bg-primary ui:text-primary-foreground absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full"
                      >
                        <CheckIcon class="custom size-3" />
                      </span>
                    {/if}
                  </button>
                {:else}
                  <div
                    class="ui:bg-muted/30 ui:text-muted-foreground flex aspect-video w-full items-center justify-center rounded-md border border-dashed text-xs"
                  >
                    {$t(`media_manager.thumbnails.slot_${slotForIndex(index)}`)}
                  </div>
                {/if}
              {/each}
            </div>
          </div>

          <div class="space-y-2">
            <p class="text-sm font-medium">{$t('media_manager.thumbnails.upload_custom')}</p>
            <div class={isUploading ? 'ui:pointer-events-none ui:opacity-50' : ''}>
              <FileDropZone.Root
                accept={FileDropZone.ACCEPT_IMAGE}
                maxFiles={1}
                fileCount={0}
                maxFileSize={thumbnailMaxSize}
                onUpload={handleCustomUpload}
                onFileRejected={handleUploadRejected}
              >
                <FileDropZone.Trigger
                  label={$t('media_manager.form.thumbnail_drop_label')}
                  formatMaxSize={() => $t('media_manager.form.thumbnail_drop_size')}
                />
              </FileDropZone.Root>
            </div>
            {#if customUrl}
              <div class="flex items-center gap-3 rounded-md border p-2">
                <img
                  src={customUrl}
                  alt={$t('media_manager.thumbnails.custom_preview_alt')}
                  class="h-16 w-24 rounded object-cover"
                />
                <p class="ui:text-muted-foreground text-xs">
                  {$t('media_manager.thumbnails.custom_selected_hint')}
                </p>
              </div>
            {/if}
          </div>
        </div>
      </div>
    {/if}

    <Dialog.Footer class="ui:border-border ui:-mx-6 ui:border-t ui:px-6 ui:py-4">
      <Button variant="outline" onclick={() => (open = false)} disabled={isSaving || isRegenerating}>
        {$t('media_manager.edit.cancel')}
      </Button>
      <Button onclick={save} loading={isSaving} disabled={!hasSelection || isRegenerating || isUploading}>
        {$t('media_manager.thumbnails.save_selection')}
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
