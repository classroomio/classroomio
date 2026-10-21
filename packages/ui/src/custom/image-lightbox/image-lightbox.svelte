<script lang="ts">
  import { Dialog as DialogPrimitive } from 'bits-ui';
  import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import MinusIcon from '@lucide/svelte/icons/minus';
  import PlusIcon from '@lucide/svelte/icons/plus';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '../../base/button';
  import { cn } from '../../tools';
  import type { ImageLightboxLabels, LightboxImage } from './types';

  interface Props {
    images: LightboxImage[];
    labels: ImageLightboxLabels;
    open?: boolean;
    index?: number;
  }

  let { images, labels, open = $bindable(false), index = $bindable(0) }: Props = $props();

  const ZOOM_LEVELS = [1, 1.5, 2, 3];
  const CLICK_ZOOM_LEVEL_INDEX = 2;

  let zoomLevelIndex = $state(0);
  let imageElement = $state<HTMLImageElement | null>(null);
  let fittedImageWidth = $state(0);

  const currentImage = $derived(images[index] ?? images[0]);
  const hasMultipleImages = $derived(images.length > 1);
  const zoomLevel = $derived(ZOOM_LEVELS[zoomLevelIndex]);
  const isZoomed = $derived(zoomLevelIndex > 0);
  const zoomedImageWidth = $derived(isZoomed ? `${fittedImageWidth * zoomLevel}px` : undefined);
  const caption = $derived(
    hasMultipleImages ? `${currentImage?.alt ?? ''} · ${index + 1} / ${images.length}` : (currentImage?.alt ?? '')
  );

  function setZoomLevelIndex(nextIndex: number) {
    const clampedIndex = Math.min(ZOOM_LEVELS.length - 1, Math.max(0, nextIndex));
    if (clampedIndex === zoomLevelIndex) return;

    if (!isZoomed && imageElement) {
      fittedImageWidth = imageElement.getBoundingClientRect().width;
    }
    zoomLevelIndex = clampedIndex;
  }

  function toggleZoom() {
    setZoomLevelIndex(isZoomed ? 0 : CLICK_ZOOM_LEVEL_INDEX);
  }

  function showImageAt(offset: number) {
    if (!hasMultipleImages) return;

    index = (index + offset + images.length) % images.length;
    zoomLevelIndex = 0;
  }

  function handleOpenChange(isOpen: boolean) {
    open = isOpen;

    if (!isOpen) {
      zoomLevelIndex = 0;
    }
  }

  function handleKeydown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') showImageAt(-1);
    else if (event.key === 'ArrowRight') showImageAt(1);
    else if (event.key === '+' || event.key === '=') setZoomLevelIndex(zoomLevelIndex + 1);
    else if (event.key === '-') setZoomLevelIndex(zoomLevelIndex - 1);
    else return;

    event.preventDefault();
  }

  function handleStageClick(event: MouseEvent) {
    if (event.target !== event.currentTarget) return;

    handleOpenChange(false);
  }
</script>

<DialogPrimitive.Root {open} onOpenChange={handleOpenChange}>
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay
      class="ui:data-[state=open]:animate-in ui:data-[state=closed]:animate-out ui:data-[state=closed]:fade-out-0 ui:data-[state=open]:fade-in-0 ui:fixed ui:inset-0 ui:z-modal ui:bg-black/90"
    />
    <DialogPrimitive.Content
      class="ui:data-[state=open]:animate-in ui:data-[state=closed]:animate-out ui:data-[state=closed]:fade-out-0 ui:data-[state=open]:fade-in-0 ui:fixed ui:inset-0 ui:z-modal ui:flex ui:flex-col ui:outline-none"
      onkeydown={handleKeydown}
    >
      <div class="ui:flex ui:items-center ui:gap-2 ui:p-3 ui:text-white">
        <DialogPrimitive.Title class="ui:min-w-0 ui:flex-1 ui:truncate ui:text-sm ui:font-normal">
          {caption}
        </DialogPrimitive.Title>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label={labels.zoomOut}
          disabled={!isZoomed}
          onclick={() => setZoomLevelIndex(zoomLevelIndex - 1)}
        >
          <MinusIcon />
        </Button>
        <span class="ui:w-12 ui:text-center ui:text-sm ui:tabular-nums">{Math.round(zoomLevel * 100)}%</span>
        <Button
          type="button"
          variant="secondary"
          size="icon-sm"
          aria-label={labels.zoomIn}
          disabled={zoomLevelIndex === ZOOM_LEVELS.length - 1}
          onclick={() => setZoomLevelIndex(zoomLevelIndex + 1)}
        >
          <PlusIcon />
        </Button>
        <DialogPrimitive.Close>
          {#snippet child({ props })}
            <Button {...props} type="button" variant="secondary" size="icon-sm" aria-label={labels.close}>
              <XIcon />
            </Button>
          {/snippet}
        </DialogPrimitive.Close>
      </div>

      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="ui:flex ui:min-h-0 ui:flex-1 ui:overflow-auto ui:px-4 ui:pb-6 ui:sm:px-16" onclick={handleStageClick}>
        {#if currentImage}
          <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
          <img
            bind:this={imageElement}
            src={currentImage.src}
            alt={currentImage.alt}
            style:width={zoomedImageWidth}
            class={cn(
              'ui:m-auto ui:rounded-sm ui:shadow-2xl',
              isZoomed
                ? 'ui:max-w-none ui:cursor-zoom-out'
                : 'ui:max-h-full ui:max-w-full ui:cursor-zoom-in ui:object-contain'
            )}
            onclick={toggleZoom}
          />
        {/if}
      </div>

      {#if hasMultipleImages}
        <Button
          type="button"
          variant="secondary"
          size="icon"
          class="ui:fixed ui:left-4 ui:top-1/2 ui:-translate-y-1/2 ui:rounded-full"
          aria-label={labels.previous}
          onclick={() => showImageAt(-1)}
        >
          <ChevronLeftIcon />
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="icon"
          class="ui:fixed ui:right-4 ui:top-1/2 ui:-translate-y-1/2 ui:rounded-full"
          aria-label={labels.next}
          onclick={() => showImageAt(1)}
        >
          <ChevronRightIcon />
        </Button>
      {/if}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>
