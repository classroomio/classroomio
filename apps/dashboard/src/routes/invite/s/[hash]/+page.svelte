<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import { AuthUI } from '$features/ui';
  import { currentOrg } from '$lib/utils/store/org';
  import { setTheme } from '$lib/utils/functions/theme';
  import { classroomio } from '$lib/utils/services/api';
  import { profile } from '$lib/utils/store/user';
  import { snackbar } from '$features/ui/snackbar/store';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { page } from '$app/state';

  let { data } = $props();

  let loading = $state(false);

  const inviteStatus = $derived(data.invite?.invite?.status ?? 'INVALID');
  const canJoinCourse = $derived(
    inviteStatus === 'ACTIVE' &&
      data.invite?.course?.allowNewStudent !== false &&
      data.invite?.course?.status === 'ACTIVE' &&
      Boolean(data.invite?.course?.isPublished)
  );

  function getBlockedInviteMessage(): string {
    if (data.invite?.course?.allowNewStudent === false) {
      return 'This course is not accepting new students right now.';
    }

    if (data.invite?.course?.status !== 'ACTIVE' || !data.invite?.course?.isPublished) {
      return 'This course is currently unavailable for enrollment.';
    }

    if (inviteStatus === 'EXPIRED') {
      return 'This invite link has expired.';
    }

    if (inviteStatus === 'USED_UP') {
      return 'This invite link has reached its usage limit.';
    }

    if (inviteStatus === 'REVOKED') {
      return 'This invite link has been revoked.';
    }

    return 'This invite link is not valid.';
  }

  async function handleSubmit() {
    if (!canJoinCourse) {
      snackbar.error(getBlockedInviteMessage());
      return;
    }

    loading = true;

    if (!$profile.id || !$profile.email) {
      console.log('Profile not found', $profile);
      return goto(`/signup?redirect=${page.url?.pathname || ''}`);
    }

    try {
      const response = await classroomio.invite.student[':token'].accept.$post({
        param: { token: data.token }
      });
      const result = await response.json();

      if (!result.success || !result.data) {
        snackbar.error(result.error || 'snackbar.invite.failed_join');
        return;
      }

      capturePosthogEvent('student_joined_course', {
        course_name: data.invite.course.title,
        student_id: $profile.id,
        student_email: $profile.email,
        already_joined: result.data.alreadyJoined
      });

      goto(result.data.redirectTo || '/lms');
    } catch (error) {
      console.error('Failed to accept invite', error);
      snackbar.error('snackbar.invite.failed_join');
    } finally {
      loading = false;
    }
  }

  onMount(async () => {
    if (!data.currentOrg) return;

    setTheme(data.currentOrg?.theme || '');
    currentOrg.set(data.currentOrg);
  });
</script>

<svelte:head>
  <title>Join {data.invite.course.title} on ClassroomIO</title>
</svelte:head>

<AuthUI isLogin={false} {handleSubmit} isLoading={loading || !$profile.id} showOnlyContent={true} showLogo={true}>
  <div class="mt-0 w-full">
    <h3 class="mt-0 mb-4 text-center text-lg font-medium dark:text-white">{data.invite.course.title}</h3>
    <p class="text-center text-sm font-light dark:text-white">{data.invite.course.description}</p>
    {#if !canJoinCourse}
      <p class="mt-3 text-center text-sm text-red-500">{getBlockedInviteMessage()}</p>
    {/if}
  </div>

  <div class="my-4 flex w-full items-center justify-center">
    <Button type="submit" disabled={!canJoinCourse || loading} loading={loading || !$profile.id}>Join Course</Button>
  </div>
</AuthUI>
