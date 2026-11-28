<script lang="ts">
  import type { TBlockType } from '@cio/utils/validation/block';
  import { VideoGuideCard } from '@cio/ui/custom/video-guide';
  import { t } from '$lib/utils/functions/translations';
  import { VIDEO_GUIDES } from '$features/video-guide/utils/video-guide-utils';
  import BlockAddRow from './block-add-row.svelte';

  interface Props {
    onSelect: (type: TBlockType) => void;
    onAi?: () => void;
  }

  let { onSelect, onAi }: Props = $props();
</script>

<BlockAddRow {onSelect} {onAi} />
<div class="mt-6 w-full">
  <VideoGuideCard
    videoId={VIDEO_GUIDES.lessonBlocks.videoId}
    title={t.get(VIDEO_GUIDES.lessonBlocks.titleKey)}
    description={t.get('video_guide.lesson_blocks.description')}
    badgeLabel={t.get('video_guide.new_badge')}
    actionLabel={t.get('video_guide.watch_video')}
    closeLabel={t.get('video_guide.close')}
    testId="block-empty-video-guide"
  />
</div>
