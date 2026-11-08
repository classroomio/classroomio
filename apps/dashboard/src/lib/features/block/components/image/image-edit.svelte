<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { uploadImage } from '$lib/utils/services/upload';
  import { t } from '$lib/utils/functions/translations';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { BlockEditProps } from '../../utils/types';

  let { block, onDataChange }: BlockEditProps<'image'> = $props();

  async function handleFile(file: File) {
    try {
      const url = await uploadImage(file);
      onDataChange({ ...block.data, url });
    } catch {
      snackbar.error(t.get('course.navItem.lessons.materials.blocks.image.upload_error'));
    }
  }

  function handleSaveSettings(settings: Block.ImageBlockSettings) {
    onDataChange({ ...block.data, alt: settings.alt, fit: settings.fit });
  }
</script>

<Block.Image
  url={block.data.url}
  alt={block.data.alt ?? ''}
  fit={block.data.fit ?? 'cover'}
  editable
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
