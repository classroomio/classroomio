<script lang="ts">
  import { AddVideoModal } from '$features/course/components/lesson';
  import { captureLessonVideoPicks } from '$features/course/components/lesson/media-picks';
  import { lessonVideoUpload } from '$features/course/components/lesson/store';
  import type { TVideoBlockData } from '@cio/utils/validation/block';
  import { getBlockEditHost } from '../../utils/block-host';
  import type { BlockPickerProps } from '../../utils/types';

  let { open, onPick, onClose }: BlockPickerProps<'video'> = $props();

  const host = getBlockEditHost();

  $effect(() => {
    if (!open) return;

    lessonVideoUpload.update((state) => ({ ...state, isModalOpen: true }));

    return captureLessonVideoPicks((videos) =>
      onPick(videos.map(({ watchEnforced: _watchEnforced, ...video }) => video as TVideoBlockData))
    );
  });

  function handleClose() {
    if ($lessonVideoUpload.isUploading) return;

    $lessonVideoUpload.isModalOpen = false;
    onClose();
  }
</script>

<AddVideoModal lessonId={host.lessonId} onClose={handleClose} />
