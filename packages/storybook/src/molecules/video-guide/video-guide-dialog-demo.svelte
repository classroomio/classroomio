<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { VideoGuideDialog } from '@cio/ui/custom/video-guide';

  interface Props {
    videoId: string;
    title: string;
    closeLabel?: string;
    initiallyOpen?: boolean;
  }

  let { videoId, title, closeLabel, initiallyOpen = false }: Props = $props();

  let open = $state(initiallyOpen);
</script>

<Button variant="outline" onclick={() => (open = true)}>Open dialog</Button>

<VideoGuideDialog bind:open {videoId} {title} {closeLabel} />
