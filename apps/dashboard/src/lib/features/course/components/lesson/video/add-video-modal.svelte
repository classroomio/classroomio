<script lang="ts">
  import YoutubeVideo from './youtube-video.svelte';
  import VimeoVideo from './vimeo-video.svelte';
  import UploadVideo from './upload-video.svelte';
  import EmbedLink from './embed-link.svelte';
  import LibraryVideo from './library-video.svelte';
  import GoogleDriveVideo from './google-drive-video.svelte';
  import * as CONSTANTS from './constants';
  import { t } from '$lib/utils/functions/translations';
  import { isFreePlan } from '$lib/utils/store/org';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { lessonVideoUpload } from '$features/course/components/lesson/store';
  import { snackbar } from '$features/ui/snackbar/store';
  interface Props {
    lessonId?: string;
    onClose?: () => void;
  }

  let { lessonId = '', onClose = () => {} }: Props = $props();

  const tabs = $derived(
    lessonId ? CONSTANTS.videoTabs : CONSTANTS.videoTabs.filter((tab) => !CONSTANTS.lessonOnlyVideoTabs.has(tab.value))
  );
  let currentTab = $state(String(CONSTANTS.videoTabs[0].value));

  function handleLinkAdded() {
    snackbar.success('snackbar.media_manager.video_added');
    $lessonVideoUpload.isModalOpen = false;
  }

  const onLinkAdded = $derived(lessonId ? undefined : handleLinkAdded);
</script>

<Dialog.Root
  bind:open={$lessonVideoUpload.isModalOpen}
  onOpenChange={(open) => {
    if (!open) onClose();
  }}
>
  <Dialog.Content
    class="flex max-h-[680px] max-w-2xl! flex-col overflow-hidden"
    showCloseButton={!$lessonVideoUpload.isUploading}
    onEscapeKeydown={(e) => {
      if ($lessonVideoUpload.isUploading) e.preventDefault();
    }}
    onInteractOutside={(e) => {
      if ($lessonVideoUpload.isUploading) e.preventDefault();
    }}
    onCloseAutoFocus={(e) => {
      if ($lessonVideoUpload.isUploading) e.preventDefault();
    }}
  >
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.materials.tabs.video.add_video.title')}</Dialog.Title>
    </Dialog.Header>

    <UnderlineTabs.Root bind:value={currentTab} class="min-w-0">
      <UnderlineTabs.List>
        {#each tabs as item (item.value)}
          <UnderlineTabs.Trigger
            value={String(item.value)}
            disabled={$lessonVideoUpload.isUploading && currentTab !== String(item.value)}
            class="flex items-center gap-2"
          >
            {#if $isFreePlan && item.value === 'upload'}
              <ZapIcon size={16} class="filled" />
            {:else}
              <item.icon />
            {/if}
            <span>{$t(item.title)}</span>
          </UnderlineTabs.Trigger>
        {/each}
      </UnderlineTabs.List>
      <UnderlineTabs.Content value="youtube" class="mt-3">
        <YoutubeVideo {lessonId} onAdded={onLinkAdded} />
      </UnderlineTabs.Content>
      <UnderlineTabs.Content value="vimeo" class="mt-3">
        <VimeoVideo {lessonId} onAdded={onLinkAdded} />
      </UnderlineTabs.Content>
      <UnderlineTabs.Content value="embed" class="mt-3">
        <EmbedLink {lessonId} onAdded={onLinkAdded} />
      </UnderlineTabs.Content>
      <UnderlineTabs.Content value="upload" class="mt-3">
        <UploadVideo {lessonId} />
      </UnderlineTabs.Content>
      {#if lessonId}
        <UnderlineTabs.Content value="library" class="mt-3">
          <LibraryVideo {lessonId} />
        </UnderlineTabs.Content>
        <UnderlineTabs.Content value="google_drive" class="mt-3">
          <GoogleDriveVideo {lessonId} />
        </UnderlineTabs.Content>
      {/if}
    </UnderlineTabs.Root>
  </Dialog.Content>
</Dialog.Root>
