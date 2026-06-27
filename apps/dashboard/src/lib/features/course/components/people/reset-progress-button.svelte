<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import { t } from '$lib/utils/functions/translations';
  import type { UserCourseAnalytics } from '$features/course/utils/types';
  import ResetProgressDialog from './reset-progress-dialog.svelte';

  let {
    courseId,
    userCourseAnalytics,
    onSuccess = () => {}
  }: {
    courseId: string;
    userCourseAnalytics: UserCourseAnalytics;
    onSuccess?: () => void | Promise<void>;
  } = $props();

  let dialogOpen = $state(false);

  const memberId = $derived(userCourseAnalytics.groupMemberId ?? '');
  const studentName = $derived(userCourseAnalytics.user.fullName || userCourseAnalytics.user.email || '');
  const canReset = $derived(Boolean(memberId && userCourseAnalytics.progressImpact));
</script>

<Button variant="destructive" onclick={() => (dialogOpen = true)} disabled={!canReset}>
  {$t('course.navItem.people.reset_progress.button')}
</Button>

{#if canReset}
  <ResetProgressDialog bind:open={dialogOpen} {courseId} {memberId} {studentName} {userCourseAnalytics} {onSuccess} />
{/if}
