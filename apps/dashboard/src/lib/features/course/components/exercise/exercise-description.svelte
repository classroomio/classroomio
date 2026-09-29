<script lang="ts">
  import { ImageLightbox, type LightboxImage } from '@cio/ui/custom/image-lightbox';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    content: string;
    class?: string;
  }

  let { content, class: className = '' }: Props = $props();

  let lightboxImages = $state<LightboxImage[]>([]);
  let lightboxIndex = $state(0);
  let isLightboxOpen = $state(false);

  const imageAlt = $derived(
    $t('course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.image_alt')
  );
  const lightboxLabels = $derived({
    close: $t('course.navItem.lessons.exercises.all_exercises.shared_question.question.media.close'),
    zoomIn: $t('course.navItem.lessons.exercises.all_exercises.shared_question.question.media.zoom_in'),
    zoomOut: $t('course.navItem.lessons.exercises.all_exercises.shared_question.question.media.zoom_out'),
    previous: $t('course.navItem.lessons.exercises.all_exercises.shared_question.question.media.previous_image'),
    next: $t('course.navItem.lessons.exercises.all_exercises.shared_question.question.media.next_image')
  });

  function openClickedImage(event: MouseEvent) {
    const clickedImage = event.target;
    if (!(clickedImage instanceof HTMLImageElement)) return;

    const article = event.currentTarget as HTMLElement;
    const articleImages = Array.from(article.querySelectorAll('img'));

    lightboxImages = articleImages.map((image) => ({ src: image.src, alt: image.alt || imageAlt }));
    lightboxIndex = articleImages.indexOf(clickedImage);
    isLightboxOpen = true;
  }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<article class={cn('preview prose prose-sm sm:prose [&_img]:cursor-zoom-in', className)} onclick={openClickedImage}>
  <SafeHtmlContent {content} />
</article>

<ImageLightbox images={lightboxImages} labels={lightboxLabels} bind:open={isLightboxOpen} bind:index={lightboxIndex} />
