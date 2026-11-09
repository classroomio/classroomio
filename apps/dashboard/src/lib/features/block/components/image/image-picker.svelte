<script lang="ts">
  import { ImageUploadModal } from '@cio/ui/custom/editor';
  import { uploadImage } from '$lib/utils/services/upload';
  import { queryUnsplash } from '$features/ui/upload-widget/utils';
  import { snackbar } from '$features/ui/snackbar/store';
  import type { BlockPickerProps } from '../../utils/types';

  let { open, onPick, onClose }: BlockPickerProps<'image'> = $props();

  /** Returns an empty URL on failure so the modal stays open without its own alert. */
  async function handleUpload(file: File): Promise<string> {
    try {
      return await uploadImage(file);
    } catch {
      snackbar.error('course.navItem.lessons.materials.blocks.image.upload_error');
      return '';
    }
  }

  function handleSelect(url: string) {
    onPick([{ url }]);
  }

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) onClose();
  }
</script>

<ImageUploadModal
  bind:open={() => open, handleOpenChange}
  onImageUpload={handleUpload}
  onSearchUnsplash={queryUnsplash}
  onImageSelect={handleSelect}
/>
