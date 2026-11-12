<script lang="ts">
  import LinkIcon from '@lucide/svelte/icons/link';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import { ComboButton, type ComboButtonItem } from '@cio/ui/custom/combo-button';

  import { AddVideoModal } from '$features/course/components/lesson';
  import { lessonVideoUpload } from '$features/course/components/lesson/store';
  import { mediaUploadManager } from '$features/media/api';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    onUploaded?: () => void;
  }

  let { onUploaded = () => {} }: Props = $props();

  const items = $derived<ComboButtonItem[]>([
    {
      id: 'video-link',
      label: $t('media_manager.upload.add_video_link'),
      icon: LinkIcon,
      onSelect: openVideoLinkModal
    }
  ]);

  function openVideoLinkModal() {
    $lessonVideoUpload.isModalOpen = true;
  }

  let wasLinkModalOpen = false;
  let refreshedCompletedCount = mediaUploadManager.completedCount;

  $effect(() => {
    const isLinkModalOpen = $lessonVideoUpload.isModalOpen;
    if (wasLinkModalOpen && !isLinkModalOpen) onUploaded();

    wasLinkModalOpen = isLinkModalOpen;
  });

  $effect(() => {
    const completedCount = mediaUploadManager.completedCount;
    if (completedCount === refreshedCompletedCount) return;

    refreshedCompletedCount = completedCount;
    onUploaded();
  });
</script>

<ComboButton
  variant="outline"
  size="default"
  label={$t('media_manager.upload.files')}
  menuLabel={$t('media_manager.upload.more_options')}
  icon={UploadIcon}
  {items}
  testId="media-upload"
  onSelect={() => mediaUploadManager.open()}
/>

<AddVideoModal />
