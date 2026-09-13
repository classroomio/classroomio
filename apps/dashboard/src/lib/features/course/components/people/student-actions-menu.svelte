<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Button } from '@cio/ui/base/button';
  import DownloadIcon from '@lucide/svelte/icons/download';
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
  import RotateCcwIcon from '@lucide/svelte/icons/rotate-ccw';

  import { courseApi } from '$features/course/api';
  import { STATUS } from '$features/course/components/exercise/constants';
  import { exportCourseStudentProgress } from '$features/course/utils/export-progress';
  import { t } from '$lib/utils/functions/translations';
  import type { UserCourseAnalytics } from '$features/course/utils/types';
  import ResetProgressDialog from './reset-progress-dialog.svelte';

  let {
    courseId,
    personId,
    userCourseAnalytics,
    onSuccess = () => {}
  }: {
    courseId: string;
    personId: string;
    userCourseAnalytics: UserCourseAnalytics;
    onSuccess?: () => void | Promise<void>;
  } = $props();

  let dialogOpen = $state(false);

  const memberId = $derived(courseApi.group.people.find((member) => member.profileId === personId)?.id ?? '');
  const studentName = $derived(userCourseAnalytics.user.fullName || userCourseAnalytics.user.email || '');
  const canReset = $derived(Boolean(memberId && userCourseAnalytics.progressImpact));

  function exportRows() {
    const rows = userCourseAnalytics.userExercisesStats.map((exercise) => {
      let status = $t('audience.user_analytics.not_submitted');
      if (exercise.status === STATUS.GRADED) {
        status = $t('analytics.graded');
      } else if (exercise.isCompleted) {
        status = $t('audience.user_analytics.awaiting_grade');
      }

      return {
        exerciseTitle: exercise.title,
        lessonTitle: exercise.lessonTitle || $t('audience.user_analytics.course_level_exercise'),
        score: exercise.status === STATUS.GRADED ? exercise.score : null,
        totalPoints: exercise.totalPoints,
        status
      };
    });

    exportCourseStudentProgress(rows, studentName);
  }
</script>

<DropdownMenu.Root>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="secondary" size="icon" aria-label={$t('audience.user_analytics.student_actions')}>
        <EllipsisIcon />
      </Button>
    {/snippet}
  </DropdownMenu.Trigger>
  <DropdownMenu.Content align="end">
    <DropdownMenu.Item onclick={exportRows}>
      <DownloadIcon />
      {$t('audience.user_analytics.export_progress')}
    </DropdownMenu.Item>
    <DropdownMenu.Separator />
    <DropdownMenu.Item variant="destructive" disabled={!canReset} onclick={() => (dialogOpen = true)}>
      <RotateCcwIcon />
      {$t('course.navItem.people.reset_progress.button')}
    </DropdownMenu.Item>
  </DropdownMenu.Content>
</DropdownMenu.Root>

{#if canReset}
  <ResetProgressDialog bind:open={dialogOpen} {courseId} {memberId} {studentName} {userCourseAnalytics} {onSuccess} />
{/if}
