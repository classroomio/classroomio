<script lang="ts">
  import LessonVideoSimpleCard from '$features/course/components/lesson/video/lesson-video-simple-card.svelte';
  import type { LessonVideo } from '$features/course/components/lesson/video/video-card-utils';
  import { blockChangeLabel } from '../../utils/block-labels';
  import type { BlockEditProps } from '../../utils/types';

  let { block, index, onDataChange, onRequestSource }: BlockEditProps<'video'> = $props();

  const video = $derived(block.data as LessonVideo);

  function handleMetadataUpdated(patch: Record<string, unknown>) {
    onDataChange({ ...block.data, metadata: { ...block.data.metadata, ...patch } });
  }
</script>

<LessonVideoSimpleCard
  {video}
  {index}
  isEditMode
  changeLabel={blockChangeLabel('video')}
  onChange={onRequestSource}
  onThumbnailSaved={(thumbnailUrl) => handleMetadataUpdated({ thumbnailUrl })}
  onMetadataUpdated={handleMetadataUpdated}
/>
