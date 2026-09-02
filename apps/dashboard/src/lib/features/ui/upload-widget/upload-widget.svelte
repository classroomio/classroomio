<script lang="ts">
  import { onMount } from 'svelte';
  import { snackbar } from '$features/ui/snackbar/store';
  import { handleOpenWidget } from '$features/ui/course-landing-page/store';
  import { queryUnsplash } from './utils';
  import { t } from '$lib/utils/functions/translations';
  import { uploadImage } from '$lib/utils/services/upload';
  import { getResolvedUploadLimits } from '$lib/utils/config/upload-limits-context';
  import { ImageUploadModal } from '@cio/ui/custom/editor';

  interface Props {
    imageURL?: string;
    onchange?: (_v: string) => void;
  }

  let { imageURL = $bindable(''), onchange }: Props = $props();

  const COVER_ASPECT = 280 / 200;

  const uploadLimits = getResolvedUploadLimits();
  const maxLandingImageSize = uploadLimits.landingImageBytes;

  let isUploading = $state(false);

  async function handleUnsplashSelect(url: string) {
    imageURL = url;
    onchange?.(url);
    snackbar.success('snackbar.landing_page_settings.success.complete');
  }

  async function handleUpload(file: File): Promise<string> {
    if (file.size > maxLandingImageSize) {
      snackbar.error('snackbar.landing_page_settings.error.file_size');
      throw new Error('File too large');
    }

    isUploading = true;
    try {
      const url = await uploadImage(file);
      imageURL = url;
      onchange?.(url);
      snackbar.success('snackbar.landing_page_settings.success.complete');
      $handleOpenWidget.open = false;
      return url;
    } finally {
      isUploading = false;
    }
  }

  onMount(() => {
    if (!$handleOpenWidget.open) {
      $handleOpenWidget.open = true;
    }
  });
</script>

<ImageUploadModal
  editor={null}
  bind:open={$handleOpenWidget.open}
  onImageUpload={handleUpload}
  onSearchUnsplash={queryUnsplash}
  onImageSelect={handleUnsplashSelect}
  cropAspect={COVER_ASPECT}
/>
