<script lang="ts">
  import { Badge } from '@cio/ui/base/badge';
  import LoaderIcon from '@lucide/svelte/icons/loader-circle';
  import { t } from '$lib/utils/functions/translations';
  import type { LessonVideoHlsStatus } from '$features/course/utils/types';

  interface Props {
    status: LessonVideoHlsStatus | undefined;
  }

  let { status }: Props = $props();

  const BASE_KEY = 'course.navItem.lessons.materials.tabs.video.hls_status';

  const variant = $derived.by(() => {
    switch (status) {
      case 'ready':
        return 'success' as const;
      case 'converting':
        return 'warning' as const;
      case 'failed':
        return 'destructive' as const;
      case 'skipped':
        return 'outline' as const;
      default:
        return 'secondary' as const;
    }
  });

  const hint = $derived(
    status === 'failed' ? `${BASE_KEY}.failed_hint` : status === 'skipped' ? `${BASE_KEY}.skipped_hint` : null
  );
</script>

<!-- `none` means the pipeline never ran for this video, which is the normal
     state for an embed or a link. There is nothing to report, so nothing shows. -->
{#if status && status !== 'none'}
  <Badge class="shrink-0 gap-1" {variant} title={hint ? $t(hint) : undefined}>
    {#if status === 'converting' || status === 'pending'}
      <LoaderIcon size={12} class="animate-spin" />
    {/if}
    {$t(`${BASE_KEY}.${status}`)}
  </Badge>
{/if}
