<script lang="ts">
  import { SafeHtmlContent } from '../safe-html-content';
  import { cn } from '../../tools';
  import ImageLightbox from './image-lightbox.svelte';
  import type { ImageLightboxLabels, LightboxImage } from './types';

  interface Props {
    content: string;
    labels: ImageLightboxLabels;
    enlargeLabel: string;
    fallbackAlt: string;
    class?: string;
  }

  let { content, labels, enlargeLabel, fallbackAlt, class: className = '' }: Props = $props();

  let contentElement = $state<HTMLElement | null>(null);
  let lightboxImages = $state<LightboxImage[]>([]);
  let lightboxIndex = $state(0);
  let isLightboxOpen = $state(false);

  $effect(() => {
    void content;
    if (!contentElement) return;

    for (const image of contentElement.querySelectorAll('img')) {
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.title = enlargeLabel;
      if (!image.alt) image.alt = fallbackAlt;
    }
  });

  function openImage(clickedImage: HTMLImageElement) {
    if (!contentElement) return;

    const contentImages = Array.from(contentElement.querySelectorAll('img'));

    lightboxImages = contentImages.map((image) => ({ src: image.src, alt: image.alt || fallbackAlt }));
    lightboxIndex = contentImages.indexOf(clickedImage);
    isLightboxOpen = true;
  }

  function handleClick(event: MouseEvent) {
    if (!(event.target instanceof HTMLImageElement)) return;

    openImage(event.target);
  }

  function handleKeydown(event: KeyboardEvent) {
    if (!(event.target instanceof HTMLImageElement)) return;
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    openImage(event.target);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<article
  bind:this={contentElement}
  class={cn(
    'ui:[&_img]:cursor-zoom-in ui:[&_img]:focus-visible:outline-none ui:[&_img]:focus-visible:ring-2 ui:[&_img]:focus-visible:ring-ring',
    className
  )}
  onclick={handleClick}
  onkeydown={handleKeydown}
>
  <SafeHtmlContent {content} />
</article>

<ImageLightbox images={lightboxImages} {labels} bind:open={isLightboxOpen} bind:index={lightboxIndex} />
