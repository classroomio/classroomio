<script lang="ts">
  import { useImageCropperTrigger } from './image-cropper.svelte.js';
  import type { ImageCropperUploadTriggerProps } from './types';
  import { cn } from '../../tools';

  let { ref = $bindable(null), children, ...rest }: ImageCropperUploadTriggerProps = $props();

  const triggerState = useImageCropperTrigger();
  const isDisabled = $derived(triggerState.rootState.disabled);

  function handleClick(e: MouseEvent) {
    if (isDisabled) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }
</script>

<label
  {...rest}
  bind:this={ref}
  for={isDisabled ? undefined : triggerState.rootState.id}
  onclick={handleClick}
  class={cn('ui:cursor-pointer', isDisabled ? 'ui:cursor-not-allowed ui:opacity-50 ui:pointer-events-none' : '')}
  aria-disabled={isDisabled}
>
  {@render children?.()}
</label>
