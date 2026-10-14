<script lang="ts">
  import { t } from '$lib/utils/functions/translations';
  import type { LessonVideoHlsStatus } from '$features/course/utils/types';

  interface Props {
    status: LessonVideoHlsStatus | undefined;
  }

  let { status }: Props = $props();

  const BASE_KEY = 'course.navItem.lessons.materials.tabs.video.hls_status';

  const encoding = $derived(status === 'pending' || status === 'converting');

  const label = $derived.by(() => {
    if (encoding) return `${BASE_KEY}.encoding`;
    if (status === 'ready') return `${BASE_KEY}.ready`;
    if (status === 'failed') return `${BASE_KEY}.failed`;

    return `${BASE_KEY}.skipped`;
  });

  const dotColor = $derived.by(() => {
    if (encoding) return 'bg-amber-500';
    if (status === 'ready') return 'bg-emerald-500';
    if (status === 'failed') return 'bg-red-500';

    return 'ui:bg-muted-foreground';
  });

  const hint = $derived(
    status === 'failed' ? `${BASE_KEY}.failed_hint` : status === 'skipped' ? `${BASE_KEY}.skipped_hint` : null
  );
</script>

<!-- `none` means the pipeline never ran for this video, which is the normal
     state for an embed or a link. There is nothing to report, so nothing shows. -->
{#if status && status !== 'none'}
  <span class="ui:text-muted-foreground flex shrink-0 items-center gap-1.5 text-xs" title={hint ? $t(hint) : undefined}>
    <span class="relative flex size-2 shrink-0">
      {#if encoding}
        <span class="absolute inline-flex size-full animate-ping rounded-full bg-amber-500 opacity-75"></span>
      {/if}
      <span class="relative inline-flex size-2 rounded-full {dotColor}"></span>
    </span>
    {$t(label)}
  </span>
{/if}
