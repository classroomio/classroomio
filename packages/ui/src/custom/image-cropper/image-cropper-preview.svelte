<script lang="ts">
  import * as Avatar from '../../base/avatar';
  import type { ImageCropperPreviewProps } from './types';
  import { useImageCropperPreview } from './image-cropper.svelte.js';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import { cn } from '../../tools';

  let { child, class: className }: ImageCropperPreviewProps = $props();

  const previewState = useImageCropperPreview();
</script>

{#if child}
  {@render child({ src: previewState.rootState.src })}
{:else}
  <Avatar.Root class={cn('ui:ring-accent ui:ring-offset-background ui:size-20 ui:ring-2 ui:ring-offset-2', className)}>
    <Avatar.Image src={previewState.rootState.src} />
    <Avatar.Fallback>
      <UploadIcon class="ui:size-4" />
      <span class="ui:sr-only">Upload image</span>
    </Avatar.Fallback>
  </Avatar.Root>
{/if}
