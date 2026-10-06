<script lang="ts">
  import { ZoomableHtmlContent } from '@cio/ui/custom/image-lightbox';
  import { cn } from '@cio/ui/tools';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    content: string;
    class?: string;
  }

  let { content, class: className = '' }: Props = $props();

  const lightboxLabels = $derived({
    close: $t('course.navItem.lessons.exercises.all_exercises.shared_question.question.media.close'),
    zoomIn: $t('course.navItem.lessons.exercises.all_exercises.shared_question.question.media.zoom_in'),
    zoomOut: $t('course.navItem.lessons.exercises.all_exercises.shared_question.question.media.zoom_out'),
    previous: $t('course.navItem.lessons.exercises.all_exercises.shared_question.question.media.previous_image'),
    next: $t('course.navItem.lessons.exercises.all_exercises.shared_question.question.media.next_image')
  });
</script>

<ZoomableHtmlContent
  {content}
  labels={lightboxLabels}
  enlargeLabel={$t('course.navItem.lessons.exercises.all_exercises.shared_question.question.media.enlarge_image')}
  fallbackAlt={$t('course.navItem.lessons.exercises.all_exercises.shared_question.question.edit.image_alt')}
  class={cn('preview prose prose-sm sm:prose', className)}
/>
