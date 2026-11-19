<script lang="ts">
  import * as Block from '@cio/ui/custom/block';
  import { t } from '$lib/utils/functions/translations';
  import type { BlockEditProps } from '../../utils/types';

  let { block, onDataChange, onRequestSource }: BlockEditProps<'image'> = $props();

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
  onChange={onRequestSource}
  onSaveSettings={handleSaveSettings}
/>
