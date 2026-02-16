<script lang="ts">
  import YoutubeVideo from './youtube-video.svelte';
  import UploadVideo from './upload-video.svelte';
  import EmbedLink from './embed-link.svelte';
  import LibraryVideo from './library-video.svelte';
  import * as CONSTANTS from './constants';
  import { t } from '$lib/utils/functions/translations';
  import { isFreePlan } from '$lib/utils/store/org';
  import ZapIcon from '@lucide/svelte/icons/zap';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';
  import { lessonVideoUpload } from '$features/course/components/lesson/store';
  interface Props {
    lessonId?: string;
    onClose?: () => void;
  }

  let { lessonId = '', onClose = () => {} }: Props = $props();

  const tabs = CONSTANTS.videoTabs;
  let currentTab = $state(String(tabs[0].value));
</script>

<Dialog.Root
  bind:open={$lessonVideoUpload.isModalOpen}
  onOpenChange={(isOpen) => {
    if (!isOpen) onClose();
  }}
>
  <Dialog.Content class="flex max-h-[680px] max-w-2xl! flex-col overflow-hidden">
    <Dialog.Header>
      <Dialog.Title>{$t('course.navItem.lessons.materials.tabs.video.add_video.title')}</Dialog.Title>
    </Dialog.Header>

    <UnderlineTabs.Root bind:value={currentTab} class="">
      <UnderlineTabs.List>
        {#each tabs as item (item.value)}
          <UnderlineTabs.Trigger value={String(item.value)} class="ui:flex ui:items-center ui:gap-2">
            {#if $isFreePlan && item.value === 3}
              <ZapIcon size={16} class="filled" />
            {:else}
              <item.icon />
            {/if}
            <span>{$t(item.title)}</span>
          </UnderlineTabs.Trigger>
        {/each}
      </UnderlineTabs.List>
      <UnderlineTabs.Content value="1" class="mt-3">
        <YoutubeVideo {lessonId} />
      </UnderlineTabs.Content>
      <UnderlineTabs.Content value="2" class="mt-3">
        <EmbedLink {lessonId} />
      </UnderlineTabs.Content>
      <UnderlineTabs.Content value="3" class="mt-3">
        <UploadVideo {lessonId} />
      </UnderlineTabs.Content>
      <UnderlineTabs.Content value="4" class="mt-3">
        <LibraryVideo {lessonId} />
      </UnderlineTabs.Content>
    </UnderlineTabs.Root>
  </Dialog.Content>
</Dialog.Root>
