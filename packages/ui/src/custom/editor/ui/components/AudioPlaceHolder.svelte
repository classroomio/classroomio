<script lang="ts">
  import MediaPlaceHolder from '../../components/MediaPlaceHolder.svelte';
  import type { NodeViewProps } from '@tiptap/core';

  const { editor }: NodeViewProps = $props();
  import Audio from '@lucide/svelte/icons/audio-lines';
  import { buttonVariants } from '$src/base/button';

  function handleClick() {
    const audioUrl = prompt('Please enter the audio URL');
    if (audioUrl) {
      editor.chain().focus().setAudio(audioUrl).run();
    }
  }
</script>

<MediaPlaceHolder
  class={buttonVariants({ variant: 'secondary', class: 'my-2 w-full justify-start p-6' })}
  icon={Audio}
  title="Insert an audio"
  onClick={handleClick}
/>
