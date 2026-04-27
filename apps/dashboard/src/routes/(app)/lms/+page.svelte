<script lang="ts">
  import { onMount } from 'svelte';
  import { DashboardPage } from '$features/lms/pages';
  import PendingInviteModal from '$features/lms/components/pending-invite-modal.svelte';
  import { getGreeting } from '$lib/utils/functions/date';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { classroomio } from '$lib/utils/services/api';
  import * as Page from '@cio/ui/base/page';
  import { coursesApi } from '$features/course/api';
  import type { PendingOrgInvite } from '$features/lms/utils/types';

  let pendingInvite = $state<PendingOrgInvite | null>(null);
  let showInviteModal = $state(false);

  const todayLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  }).format(new Date());

  const firstName = $derived($profile.fullname?.trim().split(/\s+/)[0] || $t('dashboard.learner'));

  let totalCompleted = $derived(
    coursesApi.enrolledCourses.reduce((acc, course) => {
      const exercisesCompleted =
        'exercisesCompleted' in course && typeof course.exercisesCompleted === 'number' ? course.exercisesCompleted : 0;

      return acc + (course.progressRate || 0) + exercisesCompleted;
    }, 0)
  );

  let totalLessons = $derived(
    coursesApi.enrolledCourses.reduce((acc, course) => {
      const exercises =
        'exerciseCount' in course && typeof course.exerciseCount === 'number' ? course.exerciseCount : 0;

      return acc + (course.lessonCount || 0) + exercises;
    }, 0)
  );

  let progressPercentage = $derived(totalLessons > 0 ? Math.round((totalCompleted / totalLessons) * 100) : 0);

  onMount(async () => {
    if (!$profile.id || !$currentOrg.id) return;

    try {
      const response = await classroomio.invite.organization.pending.$get();
      const result = await response.json();

      if (result.success && result.data) {
        pendingInvite = result.data;
        showInviteModal = true;
      }
    } catch (error) {
      console.error('Failed to check pending org invite', error);
    }
  });

  function handleInviteAccepted() {
    window.location.href = '/lms';
  }
</script>

<svelte:head>
  <title>Student Dashboard - ClassroomIO</title>
</svelte:head>

<Page.Root class="mx-auto w-full max-w-4xl">
  <Page.Header>
    <Page.HeaderContent>
      <Page.Subtitle>{todayLabel}</Page.Subtitle>
      <Page.Title>
        {$t(getGreeting())},
        <span class="ui:text-primary italic">{firstName}.</span>
      </Page.Title>
      <Page.Subtitle>
        {#if totalLessons > 0}
          {$t('dashboard.lms_today_progress', { progress: progressPercentage })}
        {:else}
          {$t('dashboard.lms_today_empty')}
        {/if}
      </Page.Subtitle>
    </Page.HeaderContent>
  </Page.Header>

  <Page.Body>
    {#snippet child()}
      <DashboardPage />
    {/snippet}
  </Page.Body>
</Page.Root>

{#if pendingInvite}
  <PendingInviteModal bind:open={showInviteModal} invite={pendingInvite} onAccepted={handleInviteAccepted} />
{/if}
