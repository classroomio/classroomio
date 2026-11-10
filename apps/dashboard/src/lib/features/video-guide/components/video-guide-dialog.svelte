<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import { t } from '$lib/utils/functions/translations';
  import type { VideoGuide } from '../utils/types';
  import { getVideoGuideEmbedUrl } from '../utils/video-guide-utils';

  interface Props {
    open: boolean;
    guide: VideoGuide;
  }

  let { open = $bindable(false), guide }: Props = $props();
</script>

<Dialog.Root bind:open>
  <Dialog.Content
    class="w-[96vw] max-w-4xl! gap-0 overflow-hidden p-0"
    showCloseButton={false}
    data-testid="video-guide-dialog"
  >
    <div class="ui:bg-muted aspect-video w-full">
      {#if open}
        <iframe
          class="size-full"
          src={getVideoGuideEmbedUrl(guide.videoId)}
          title={$t(guide.titleKey)}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      {/if}
    </div>

    <div class="flex items-center justify-between gap-4 px-5 py-3">
      <Dialog.Title class="text-base font-semibold">{$t(guide.titleKey)}</Dialog.Title>
      <Button size="sm" variant="outline" testId="video-guide-close" onclick={() => (open = false)}>
        {$t('video_guide.close')}
      </Button>
    </div>
  </Dialog.Content>
</Dialog.Root>
