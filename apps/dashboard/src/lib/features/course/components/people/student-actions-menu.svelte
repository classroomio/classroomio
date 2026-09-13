<script lang="ts">
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { Button } from '@cio/ui/base/button';
  import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
  import DownloadIcon from '@lucide/svelte/icons/download';
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
  let menuOpen = $state(false);

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

<DropdownMenu.Root bind:open={menuOpen}>
  <DropdownMenu.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="secondary" size="sm" aria-label={$t('audience.user_analytics.student_actions')}>
        {$t('generic.progress')}
        <ChevronDownIcon
          class="size-4 transition-transform duration-200 {menuOpen ? 'rotate-180' : ''}"
          aria-hidden="true"
        />
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
