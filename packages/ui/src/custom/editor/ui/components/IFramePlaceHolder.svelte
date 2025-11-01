<script lang="ts">
  import MediaPlaceHolder from '../../components/MediaPlaceHolder.svelte';
  import type { NodeViewProps } from '@tiptap/core';

  const { editor }: NodeViewProps = $props();
  import Audio from '@lucide/svelte/icons/code-xml';
  import { buttonVariants } from '$src/base/button';

  function handleClick() {
    const iframUrl = prompt('Please enter the IFrame URL');
    if (iframUrl) {
      editor.chain().focus().setIframe({ src: iframUrl }).run();
    }
  }
</script>

<MediaPlaceHolder
  class={buttonVariants({ variant: 'secondary', class: 'my-2 w-full justify-start p-6' })}
  icon={Audio}
  title="Insert an iframe"
  onClick={handleClick}
/>
