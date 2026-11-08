<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { uploadImage } from '$lib/utils/services/upload';
  import { t } from '$lib/utils/functions/translations';
  import MODES from '$lib/utils/constants/mode';
  import { snackbar } from '$features/ui/snackbar/store';
  import { lessonBlocksApi } from '$features/course/store/lesson-blocks.svelte';
  import type { LessonImageBlock } from '$features/course/utils/types';

  interface Props {
    block: LessonImageBlock;
    mode: (typeof MODES)[keyof typeof MODES];
  }

  let { block, mode }: Props = $props();

  async function handleFile(file: File) {
    try {
      const url = await uploadImage(file);
      lessonBlocksApi.updateImageBlock(block.id, { url });
    } catch {
      snackbar.error(t.get('course.navItem.lessons.materials.blocks.image.upload_error'));
    }
  }

  function handleSaveSettings(settings: Block.ImageBlockSettings) {
    lessonBlocksApi.updateImageBlock(block.id, settings);
  }
</script>

<Block.Image
  url={block.url}
  alt={block.alt}
  fit={block.fit}
  editable={mode === MODES.edit}
  uploadLabel={$t('course.navItem.lessons.materials.blocks.image.upload')}
  changeLabel={$t('course.navItem.lessons.materials.blocks.image.change')}
  settingsLabel={$t('course.navItem.lessons.materials.blocks.image.settings')}
  titleLabel={$t('course.navItem.lessons.materials.blocks.image.settings')}
  altLabel={$t('course.navItem.lessons.materials.blocks.image.alt')}
  altPlaceholder={$t('course.navItem.lessons.materials.blocks.image.alt_placeholder')}
  fitLabel={$t('course.navItem.lessons.materials.blocks.image.fit')}
  fitCoverLabel={$t('course.navItem.lessons.materials.blocks.image.fit_cover')}
  fitContainLabel={$t('course.navItem.lessons.materials.blocks.image.fit_contain')}
  cancelLabel={$t('common.cancel')}
  saveLabel={$t('common.save_changes')}
  onChangeFile={handleFile}
  onSaveSettings={handleSaveSettings}
/>
