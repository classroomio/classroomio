<script lang="ts">
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import UploadIcon from '@lucide/svelte/icons/upload';
  import { ComboButton, type ComboButtonItem } from '@cio/ui/custom/combo-button';

  import { AddDocumentModal, AddVideoModal } from '$features/course/components/lesson';
  import { lessonDocUpload, lessonVideoUpload } from '$features/course/components/lesson/store';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    onUploaded?: () => void;
  }

  let { onUploaded = () => {} }: Props = $props();

  const items = $derived<ComboButtonItem[]>([
    {
      id: 'documents',
      label: $t('media_manager.upload.documents'),
      icon: FileTextIcon,
      onSelect: openDocumentModal
    }
  ]);

  function openVideoModal() {
    $lessonVideoUpload.isModalOpen = true;
  }

  function openDocumentModal() {
    $lessonDocUpload.isModalOpen = true;
  }

  let wasModalOpen = false;

  $effect(() => {
    const isModalOpen = $lessonVideoUpload.isModalOpen || $lessonDocUpload.isModalOpen;
    if (wasModalOpen && !isModalOpen) onUploaded();

    wasModalOpen = isModalOpen;
  });
</script>

<ComboButton
  variant="default"
  size="default"
  label={$t('media_manager.upload.videos')}
  menuLabel={$t('media_manager.upload.more_options')}
  icon={UploadIcon}
  {items}
  testId="media-upload"
  onSelect={openVideoModal}
/>

<AddVideoModal />

<AddDocumentModal />
