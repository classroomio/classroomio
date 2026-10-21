<script lang="ts">
  import { ImageLightbox, ZoomableImage, type LightboxImage } from '@cio/ui/custom/image-lightbox';
  import { LIGHTBOX_LABELS } from './fixtures';

  interface Props {
    images: LightboxImage[];
    initiallyOpen?: boolean;
  }

  let { images, initiallyOpen = false }: Props = $props();

  let isOpen = $state(initiallyOpen);
  let openIndex = $state(0);

  function openAt(imageIndex: number) {
    openIndex = imageIndex;
    isOpen = true;
  }
</script>

<div class={images.length > 1 ? 'grid max-w-3xl gap-3 sm:grid-cols-2' : 'max-w-3xl'}>
  {#each images as image, imageIndex (image.src)}
    <ZoomableImage
      src={image.src}
      alt={image.alt}
      enlargeLabel="Click to enlarge"
      class={images.length > 1 ? 'aspect-video' : ''}
      onclick={() => openAt(imageIndex)}
    />
  {/each}
</div>

<ImageLightbox {images} labels={LIGHTBOX_LABELS} bind:open={isOpen} bind:index={openIndex} />
