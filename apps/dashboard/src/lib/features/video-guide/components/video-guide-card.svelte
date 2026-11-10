<script lang="ts">
  import PlayIcon from '@lucide/svelte/icons/play';
  import { Badge } from '@cio/ui/base/badge';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';
  import type { VideoGuide } from '../utils/types';
  import { getVideoGuideThumbnailUrl } from '../utils/video-guide-utils';
  import VideoGuideDialog from './video-guide-dialog.svelte';

  interface Props {
    guide: VideoGuide;
    description: string;
    class?: string;
    testId?: string;
  }

  let { guide, description, class: className, testId }: Props = $props();

  let open = $state(false);
</script>

<button
  type="button"
  class={cn(
    'ui:bg-background ui:hover:bg-muted/60 ui:focus-visible:ring-ring group mx-auto flex w-full max-w-md items-center gap-4 rounded-lg border p-2 pr-4 text-left transition focus-visible:ring-2 focus-visible:outline-none',
    className
  )}
  data-testid={testId}
  onclick={() => (open = true)}
>
  <span class="ui:bg-muted relative aspect-video w-36 shrink-0 overflow-hidden rounded-md">
    <img src={getVideoGuideThumbnailUrl(guide.videoId)} alt="" class="size-full object-cover" loading="lazy" />
    <span class="absolute inset-0 flex items-center justify-center bg-black/20 transition group-hover:bg-black/35">
      <span class="flex size-9 items-center justify-center rounded-full bg-white text-black shadow">
        <PlayIcon class="size-4 translate-x-px fill-current" />
      </span>
    </span>
  </span>

  <span class="flex min-w-0 flex-col gap-1">
    <span class="flex items-center gap-2">
      <Badge class="ui:text-primary ui:bg-primary/10 ui:border-transparent">{$t('video_guide.new_badge')}</Badge>
      <span class="ui:text-muted-foreground text-xs">{$t('video_guide.watch_video')}</span>
    </span>
    <span class="text-sm font-medium text-pretty">{description}</span>
  </span>
</button>

<VideoGuideDialog bind:open {guide} />
