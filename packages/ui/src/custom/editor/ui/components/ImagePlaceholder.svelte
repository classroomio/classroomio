<script lang="ts">
  import MediaPlaceHolder from '../../components/MediaPlaceHolder.svelte';
  import type { NodeViewProps } from '@tiptap/core';

  const { editor }: NodeViewProps = $props();
  import Image from '@lucide/svelte/icons/image';
  import { buttonVariants } from '$src/base/button';

  function handleClick() {
    const imagePlaceholderExt = editor.extensionManager.extensions.find((ext) => ext.name === 'image-placeholder');
    imagePlaceholderExt?.options?.onOpenModal?.(editor);
  }
</script>

<MediaPlaceHolder
  class={buttonVariants({ variant: 'secondary', class: 'my-2 w-full justify-start p-6' })}
  icon={Image}
  title="Insert an image"
  onClick={handleClick}
/>
