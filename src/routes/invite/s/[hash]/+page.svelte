<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import AuthUI from '$lib/components/AuthUI/index.svelte';
  import { currentOrg } from '$lib/utils/store/org';
  import { setTheme } from '$lib/utils/functions/theme';
  import { addGroupMember } from '$lib/utils/services/courses';
  import type { CurrentOrg } from '$lib/utils/types/org.js';
  import { ROLE } from '$lib/utils/constants/roles';
  import { profile } from '$lib/utils/store/user.js';
  import { sendStudentCourseWelcome, sendTeacherStudentJoinedCourse } from './utils';

  export let data;

  let supabase = getSupabase();
  let loading = false;
  let refresh = false;

  let disableSubmit = false;
  let formRef: HTMLFormElement;

  async function handleSubmit() {
    loading = true;

    if (refresh) {
      window.location.reload();
      refresh = false;
      return;
    }

    if (!$profile.id || !$profile.email) {
      console.log('Profile not found', $profile);
      refresh = true;
      return;
    }

    const member = {
      profile_id: $profile.id,
      group_id: data.groupId,
      role_id: ROLE.STUDENT
    };

    const teacherMembers = await supabase
      .from('groupmember')
      .select('id, profile(email)')
      .eq('group_id', data.groupId)
      .eq('role_id', ROLE.TUTOR);

    const teachers: Array<string> =
      teacherMembers.data?.map((teacher) => {
        return teacher.profile?.email || '';
      }) || [];

    addGroupMember(member).then((addedMember) => {
      loading = false;
      if (addedMember.error) {
        console.error('Error adding student to group', data.groupId);
        return;
      }

      // Send email welcoming student to the course
      sendStudentCourseWelcome({
        to: $profile.email,
        orgName: data.currentOrg?.name,
        courseName: data.name
      });

      // Send notification to teacher(s) that a student has joined the course.
      sendTeacherStudentJoinedCourse({
        to: teachers,
        courseName: data.name
      });

      // go to lms
      return goto('/lms');
    });
  }

  function setCurOrg(cOrg: CurrentOrg) {
    if (!cOrg) return;
    currentOrg.set(cOrg);
  }

  onMount(async () => {
    setTheme(data.currentOrg?.theme || '');
  });

  $: setCurOrg(data.currentOrg as CurrentOrg);
</script>

<svelte:head>
  <title>Join {data.name} on ClassroomIO</title>
</svelte:head>

<AuthUI
  {supabase}
  isLogin={false}
  {handleSubmit}
  isLoading={loading}
  showOnlyContent={true}
  showLogo={true}
  bind:formRef
>
  <div class="mt-0 w-full">
    {#if refresh}
      <p class="dark:text-white text-sm font-light text-center">
        Something went wrong, please try again.
      </p>
    {:else}
      <h3 class="dark:text-white text-lg font-medium mt-0 mb-4 text-center">{data.name}</h3>
      <p class="dark:text-white text-sm font-light text-center">{data.description}</p>
    {/if}
  </div>

  <div class="my-4 w-full flex justify-center items-center">
    <PrimaryButton
      label={refresh ? 'Try again' : 'Join Course'}
      type="submit"
      isDisabled={disableSubmit || loading}
      isLoading={loading}
    />
  </div>
</AuthUI>
