<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { resolveLessonSlides, SLIDE_PLATFORM_BY_ID } from '@cio/utils/functions';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import { lessonApi } from '$features/course/api';
  import { slideMatchesSourceKey } from '$features/course/utils/lesson-blocks';
  import type { LessonSlideBlock } from '$features/course/utils/types';

  type ResolvedSlide = ReturnType<typeof resolveLessonSlides>[number];

  interface Props {
    block: LessonSlideBlock;
    mode: (typeof MODES)[keyof typeof MODES];
    changeLabel?: string;
    onChange?: () => void;
  }

  let { block, mode, changeLabel, onChange }: Props = $props();

  const slides = $derived(resolveLessonSlides(lessonApi.lesson?.slides, lessonApi.lesson?.slideUrl));
  const legacyIndex = $derived(slides.findIndex((slide) => slideMatchesSourceKey(slide, block.sourceKey)));
  const legacySlide = $derived(legacyIndex === -1 ? undefined : slides[legacyIndex]);
  const embeddedSlide = $derived(
    block.data?.src
      ? ({ id: '', src: String(block.data.src), platform: String(block.data.platform ?? 'other') } as ResolvedSlide)
      : undefined
  );
  const slide = $derived(legacySlide ?? embeddedSlide);
  const slideIndex = $derived(legacyIndex === -1 ? 0 : legacyIndex);
  const frameTitle = $derived.by(() => {
    if (!slide) return '';

    const platformName = SLIDE_PLATFORM_BY_ID[slide.platform]?.name ?? slide.platform;

    return t.get('course.navItem.lessons.materials.tabs.slide.frame_title', {
      platform: platformName,
      index: slideIndex + 1,
      total: Math.max(slides.length, 1)
    });
  });
  const sampleUpdated = $derived(
    `Updated ${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
  );
</script>

<Block.Slide
  {slide}
  isExample={block.isExample}
  editable={mode === MODES.edit}
  {frameTitle}
  {changeLabel}
  {onChange}
  {sampleUpdated}
/>
