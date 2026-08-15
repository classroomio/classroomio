<script lang="ts">
  import { lessonApi } from '$features/course/api';
  import { DeleteModal } from '$features/ui';
  import { Button } from '@cio/ui/base/button';
  import * as Dialog from '@cio/ui/base/dialog';
  import * as Item from '@cio/ui/base/item';
  import { Empty } from '@cio/ui/custom/empty';
  import {
    SlideEmbedCard,
    SlideEmbedFrame,
    SlideEmbedPicker,
    type SlideEmbed,
    type SlideEmbedPickerLabels,
    type SlidePlatformId
  } from '@cio/ui';
  import { resolveLessonSlides, SLIDE_PLATFORM_BY_ID, SLIDE_PLATFORM_IDS } from '@cio/utils/functions';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import PresentationIcon from '@lucide/svelte/icons/presentation';

  interface Props {
    mode?: (typeof MODES)[keyof typeof MODES];
  }

  let { mode = MODES.view }: Props = $props();

  let pickerOpen = $state(false);
  let openDeleteSlideModal = $state(false);
  let slideIndexToDelete = $state<number | null>(null);

  const slides = $derived(resolveLessonSlides(lessonApi.lesson?.slides, lessonApi.lesson?.slideUrl));

  const pickerLabels = $derived.by((): SlideEmbedPickerLabels => {
    const prefix = 'course.navItem.lessons.materials.tabs.slide';

    return {
      searchPlaceholder: t.get(`${prefix}.add_slide.search`),
      emptyPrompt: t.get(`${prefix}.add_slide.empty_prompt`),
      embedCodeLabel: t.get(`${prefix}.add_slide.embed_code`),
      embedCodePlaceholder: t.get(`${prefix}.add_slide.embed_placeholder`),
      addEmbed: t.get(`${prefix}.button`),
      howToEmbed: t.get(`${prefix}.add_slide.how_to_embed`),
      previewLabel: t.get(`${prefix}.add_slide.preview`),
      embedReady: t.get(`${prefix}.add_slide.embed_ready`),
      invalidEmbed: t.get(`${prefix}.add_slide.invalid_embed`),
      unsupportedPlatform: t.get(`${prefix}.add_slide.unsupported`),
      platforms: Object.fromEntries(
        SLIDE_PLATFORM_IDS.map((platformId: SlidePlatformId) => [
          platformId,
          {
            hint: t.get(`${prefix}.platforms.${platformId}.hint`),
            steps: [
              t.get(`${prefix}.platforms.${platformId}.step_1`),
              t.get(`${prefix}.platforms.${platformId}.step_2`),
              t.get(`${prefix}.platforms.${platformId}.step_3`)
            ]
          }
        ])
      ) as SlideEmbedPickerLabels['platforms']
    };
  });

  const cardLabels = $derived({
    remove: t.get('course.navItem.lessons.materials.tabs.slide.remove_slide'),
    menuAria: t.get('course.navItem.lessons.materials.tabs.slide.menu_aria')
  });

  function persistSlides(nextSlides: SlideEmbed[]) {
    const firstSrc = nextSlides[0]?.src || '';

    lessonApi.updateLessonState('slides', nextSlides);
    lessonApi.updateLessonState('slideUrl', firstSrc);
  }

  function getSlideFrameTitle(slide: SlideEmbed) {
    return SLIDE_PLATFORM_BY_ID[slide.platform]?.name ?? slide.platform;
  }

  function handleAdd(slide: SlideEmbed) {
    persistSlides([...slides, slide]);
    pickerOpen = false;
  }

  function requestRemoveSlide(index: number) {
    slideIndexToDelete = index;
    openDeleteSlideModal = true;
  }

  function confirmRemoveSlide() {
    if (slideIndexToDelete === null) {
      openDeleteSlideModal = false;
      return;
    }

    const remainingSlides = slides.slice();

    remainingSlides.splice(slideIndexToDelete, 1);
    persistSlides(remainingSlides);
    slideIndexToDelete = null;
    openDeleteSlideModal = false;
  }
</script>

{#if mode === MODES.edit}
  <Button onclick={() => (pickerOpen = true)} class="float-end my-4">
    {$t('course.navItem.lessons.materials.tabs.slide.button')}
  </Button>

  {#if slides.length}
    <Item.Group class="grid! w-full grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-x-5 gap-y-8">
      {#each slides as slide, index (slide.id)}
        <SlideEmbedCard {slide} labels={cardLabels} isEditMode={true} onRemove={() => requestRemoveSlide(index)} />
      {/each}
    </Item.Group>
  {:else}
    <Empty
      title={$t('course.navItem.lessons.materials.tabs.slide.empty_title')}
      description={$t('course.navItem.lessons.materials.tabs.slide.empty_description')}
      icon={PresentationIcon}
    />
  {/if}

  <Dialog.Root bind:open={pickerOpen}>
    <Dialog.Content class="ui:flex flex h-[min(720px,90dvh)] min-h-0 max-w-4xl! flex-col overflow-hidden">
      <Dialog.Header class="shrink-0">
        <Dialog.Title>{$t('course.navItem.lessons.materials.tabs.slide.add_slide.title')}</Dialog.Title>
      </Dialog.Header>
      {#if pickerOpen}
        <SlideEmbedPicker
          class="ui:min-h-0 ui:flex-1 ui:overflow-hidden ui:rounded-none ui:border-0"
          labels={pickerLabels}
          onAdd={handleAdd}
        />
      {/if}
    </Dialog.Content>
  </Dialog.Root>

  <DeleteModal bind:open={openDeleteSlideModal} onDelete={confirmRemoveSlide} />
{:else if slides.length}
  <div class="w-full">
    {#each slides as slide, index (slide.id)}
      <div class="{index < slides.length - 1 ? 'mb-5' : ''} w-full overflow-hidden">
        <SlideEmbedFrame src={slide.src} title={getSlideFrameTitle(slide)} />
      </div>
    {/each}
  </div>
{/if}
