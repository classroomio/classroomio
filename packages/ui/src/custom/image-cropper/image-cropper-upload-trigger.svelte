<script lang="ts">
  import { useImageCropperTrigger } from './image-cropper-context.svelte';
  import type { ImageCropperUploadTriggerProps } from './types';
  import { cn } from '../../tools';

  let { ref = $bindable(null), class: className, children, ...rest }: ImageCropperUploadTriggerProps = $props();

  const triggerState = useImageCropperTrigger();
  const isDisabled = $derived(triggerState.rootState.disabled);

  let isDragging = $state(false);

  function handleClick(e: MouseEvent) {
    if (isDisabled) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
  }

  function handleDragOver(e: DragEvent) {
    if (isDisabled) return;

    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave() {
    isDragging = false;
  }

  function handleDrop(e: DragEvent) {
    isDragging = false;
    if (isDisabled) return;

    const file = e.dataTransfer?.files?.[0];
    if (!file) return;

    e.preventDefault();
    triggerState.rootState.onUpload(file);
  }
</script>

<label
  {...rest}
  bind:this={ref}
  for={isDisabled ? undefined : triggerState.rootState.id}
  onclick={handleClick}
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  class={cn(
    'ui:cursor-pointer',
    isDisabled ? 'ui:cursor-not-allowed ui:opacity-50 ui:pointer-events-none' : '',
    isDragging ? 'ui:ring-2 ui:ring-primary' : '',
    className
  )}
  aria-disabled={isDisabled}
>
  {@render children?.()}
</label>
