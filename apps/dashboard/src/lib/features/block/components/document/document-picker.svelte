<script lang="ts">
  import { AddDocumentModal } from '$features/course/components/lesson';
  import { captureLessonDocumentPicks } from '$features/course/components/lesson/media-picks';
  import { lessonDocUpload } from '$features/course/components/lesson/store';
  import { getBlockEditHost } from '../../utils/block-host';
  import type { BlockPickerProps } from '../../utils/types';

  let { open, onPick, onClose }: BlockPickerProps<'document'> = $props();

  const host = getBlockEditHost();

  $effect(() => {
    if (!open) return;

    lessonDocUpload.update((state) => ({ ...state, isModalOpen: true }));

    return captureLessonDocumentPicks((documents) => onPick(documents));
  });

  function handleClose() {
    if ($lessonDocUpload.isUploading) return;

    $lessonDocUpload.isModalOpen = false;
    $lessonDocUpload.error = null;
    onClose();
  }
</script>

<AddDocumentModal lessonId={host.lessonId} onClose={handleClose} />
