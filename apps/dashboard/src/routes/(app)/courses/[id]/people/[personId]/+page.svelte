<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';

  import { t } from '$lib/utils/functions/translations';
  import StudentCourseRail from '$features/course/components/people/student-course-rail.svelte';
  import StudentExerciseList from '$features/course/components/people/student-exercise-list.svelte';
  import type { UserCourseAnalytics } from '$features/course/utils/types';

  let { data } = $props();

  let userCourseAnalytics = $derived(data.userCourseAnalytics as UserCourseAnalytics | null | undefined);

  async function handleRetry() {
    await invalidateAll();
  }
</script>

{#if data.loadFailed}
  <Empty
    variant="page"
    icon={TriangleAlertIcon}
    title={$t('audience.user_analytics.load_failed_title')}
    description={$t('audience.user_analytics.load_failed_description')}
  >
    {#snippet children()}
      <Button onclick={handleRetry}>{$t('audience.user_analytics.retry')}</Button>
    {/snippet}
  </Empty>
{:else if userCourseAnalytics}
  <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[19rem_1fr]">
    <StudentCourseRail {userCourseAnalytics} />
    <StudentExerciseList courseId={data.courseId} {userCourseAnalytics} />
  </div>
{/if}
