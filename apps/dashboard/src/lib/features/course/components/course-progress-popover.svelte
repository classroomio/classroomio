<script lang="ts">
  import * as Popover from '@cio/ui/base/popover';
  import { PercentRingProgress } from '@cio/ui/custom/percent-ring-progress';
  import { courseApi } from '$features/course/api';
  import { getCourseProgress } from '$features/course/utils/content';
  import { t } from '$lib/utils/functions/translations';
  import CourseProgressCard from './course-progress-card.svelte';

  interface Props {
    class?: string;
  }

  let { class: className = '' }: Props = $props();

  const progress = $derived(getCourseProgress(courseApi.course));
</script>

{#if progress.total > 0}
  <Popover.Root>
    <Popover.Trigger class="shrink-0 {className}" aria-label={$t('course.sidebar.progress.title')}>
      <PercentRingProgress value={progress.percent} size="small" />
    </Popover.Trigger>
    <Popover.Content class="w-72" align="end">
      <CourseProgressCard {progress} />
    </Popover.Content>
  </Popover.Root>
{/if}
