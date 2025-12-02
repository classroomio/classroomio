<script lang="ts">
  import { useImageCropperTrigger } from './image-cropper.svelte.js';
  import type { ImageCropperUploadTriggerProps } from './types';

  let { ref = $bindable(null), children, ...rest }: ImageCropperUploadTriggerProps = $props();

  const triggerState = useImageCropperTrigger();
</script>

<label {...rest} bind:this={ref} for={triggerState.rootState.id} class="ui:hover:cursor-pointer">
  {@render children?.()}
</label>
