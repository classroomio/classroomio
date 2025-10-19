<script lang="ts">
  import MediaPlaceHolder from '../../components/MediaPlaceHolder.svelte';
  import type { NodeViewProps } from '@tiptap/core';

  const { editor }: NodeViewProps = $props();
  import Image from '@lucide/svelte/icons/image';
  import { buttonVariants } from '../../../ui/button/button.svelte';

  function handleClick() {
    const imageUrl = prompt('Please enter the image URL');
    if (imageUrl) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
    }
  }
</script>

<MediaPlaceHolder
  class={buttonVariants({ variant: 'secondary', class: 'my-2 w-full justify-start p-6' })}
  icon={Image}
  title="Insert an image"
  onClick={handleClick}
/>
