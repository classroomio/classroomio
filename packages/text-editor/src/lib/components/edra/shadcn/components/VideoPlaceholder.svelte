<script lang="ts">
  import MediaPlaceHolder from '../../components/MediaPlaceHolder.svelte';
  import type { NodeViewProps } from '@tiptap/core';

  const { editor }: NodeViewProps = $props();
  import Video from '@lucide/svelte/icons/video';
  import { buttonVariants } from '@cio/shadcn-ui/button';

  function handleClick() {
    const videoUrl = prompt('Please enter the video URL');
    if (videoUrl) {
      editor.chain().focus().setVideo(videoUrl).run();
    }
  }
</script>

<MediaPlaceHolder
  class={buttonVariants({ variant: 'secondary', class: 'my-2 w-full justify-start p-6' })}
  icon={Video}
  title="Insert a video"
  onClick={handleClick}
/>
