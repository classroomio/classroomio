<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { Button } from '@cio/ui/base/button';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { AuthUI } from '$features/ui';
  import { currentOrg } from '$lib/utils/store/org';
  import { setTheme } from '$lib/utils/functions/theme';
  import { peopleApi } from '$features/course/api';
  import { ROLE } from '@cio/utils/constants';
  import { profile } from '$lib/utils/store/user';
  import { snackbar } from '$features/ui/snackbar/store';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { page } from '$app/state';

  let { data } = $props();

  let supabase = getSupabase();
  let loading = $state(false);

  let disableSubmit = false;

  async function handleSubmit() {
    loading = true;

    if (!$profile.id || !$profile.email) {
      console.log('Profile not found', $profile);
      return goto(`/signup?redirect=${page.url?.pathname || ''}`);
    }

    await peopleApi.add(data.id, [
      {
        profileId: $profile.id,
        roleId: ROLE.STUDENT
      }
    ]);

    if (!peopleApi.success) {
      snackbar.error('snackbar.invite.failed_join');
      // Full page load to lms if error joining, probably user already joined
      window.location.href = '/lms';
      return;
    }

    capturePosthogEvent('student_joined_course', {
      course_name: data.name,
      student_id: $profile.id,
      student_email: $profile.email
    });

    // go to lms
    goto('/lms');
  }

  onMount(async () => {
    // check if user has session, if not redirect to sign up with redirect back to this page
    const {
      data: { session }
    } = await supabase.auth.getSession();
    if (!session) {
      return goto(`/login?redirect=${page.url?.pathname || ''}`);
    }

    if (!data.currentOrg) return;

    setTheme(data.currentOrg?.theme || '');

    currentOrg.set(data.currentOrg);
  });
</script>

<svelte:head>
  <title>Join {data.name} on ClassroomIO</title>
</svelte:head>

<AuthUI isLogin={false} {handleSubmit} isLoading={loading || !$profile.id} showOnlyContent={true} showLogo={true}>
  <div class="mt-0 w-full">
    <h3 class="mt-0 mb-4 text-center text-lg font-medium dark:text-white">{data.name}</h3>
    <p class="text-center text-sm font-light dark:text-white">{data.description}</p>
  </div>

  <div class="my-4 flex w-full items-center justify-center">
    <Button type="submit" disabled={disableSubmit || loading} loading={loading || !$profile.id}>Join Course</Button>
  </div>
</AuthUI>
