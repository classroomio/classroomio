<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import VideoIcon from '@lucide/svelte/icons/video';
  import { t } from '$lib/utils/functions/translations';

  interface Props {
    onUpload: () => void;
  }

  let { onUpload }: Props = $props();
</script>

<Empty
  title={$t('course.navItem.lessons.materials.tabs.video.checkpoints.blocked_title')}
  description={$t('course.navItem.lessons.materials.tabs.video.checkpoints.blocked_description')}
  icon={VideoIcon}
>
  <Button type="button" variant="outline" onclick={onUpload}>
    {$t('course.navItem.lessons.materials.tabs.video.checkpoints.blocked_cta')}
  </Button>
</Empty>
