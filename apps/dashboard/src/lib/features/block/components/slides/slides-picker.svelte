<script lang="ts">
  import * as Dialog from '@cio/ui/base/dialog';
  import { SlideEmbedPicker, type SlideEmbed, type SlideEmbedPickerLabels, type SlidePlatformId } from '@cio/ui';
  import { SLIDE_PLATFORM_IDS } from '@cio/utils/functions';
  import { t } from '$lib/utils/functions/translations';
  import type { BlockPickerProps } from '../../utils/types';

  let { open, onPick, onClose }: BlockPickerProps<'slides'> = $props();

  const labels = $derived.by((): SlideEmbedPickerLabels => {
    const prefix = 'course.navItem.lessons.materials.tabs.slide';
    const platformEntries = SLIDE_PLATFORM_IDS.map((platformId: SlidePlatformId) => [
      platformId,
      {
        hint: t.get(`${prefix}.platforms.${platformId}.hint`),
        steps: [
          t.get(`${prefix}.platforms.${platformId}.step_1`),
          t.get(`${prefix}.platforms.${platformId}.step_2`),
          t.get(`${prefix}.platforms.${platformId}.step_3`)
        ]
      }
    ]);
    const platforms = Object.fromEntries(platformEntries) as SlideEmbedPickerLabels['platforms'];

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
      platforms
    };
  });

  function handleAdd(slide: SlideEmbed) {
    onPick([{ src: slide.src, platform: slide.platform }]);
    onClose();
  }
</script>

<Dialog.Root
  {open}
  onOpenChange={(isOpen) => {
    if (!isOpen) onClose();
  }}
>
  <Dialog.Content class="flex h-[min(720px,90dvh)] min-h-0 max-w-4xl! flex-col overflow-hidden">
    <Dialog.Header class="shrink-0">
      <Dialog.Title>{$t('course.navItem.lessons.materials.tabs.slide.add_slide.title')}</Dialog.Title>
    </Dialog.Header>
    {#if open}
      <SlideEmbedPicker class="min-h-0 flex-1 overflow-auto" {labels} onAdd={handleAdd} />
    {/if}
  </Dialog.Content>
</Dialog.Root>
