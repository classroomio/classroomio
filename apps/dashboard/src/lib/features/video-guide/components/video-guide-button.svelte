<script lang="ts">
  import CirclePlayIcon from '@lucide/svelte/icons/circle-play';
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import type { VideoGuide } from '../utils/types';
  import VideoGuideDialog from './video-guide-dialog.svelte';

  interface Props {
    guide: VideoGuide;
    testId?: string;
  }

  let { guide, testId }: Props = $props();

  let open = $state(false);
</script>

<Button variant="outline" {testId} onclick={() => (open = true)}>
  <CirclePlayIcon class="size-4" />
  {$t('video_guide.watch_video')}
</Button>

<VideoGuideDialog bind:open {guide} />
