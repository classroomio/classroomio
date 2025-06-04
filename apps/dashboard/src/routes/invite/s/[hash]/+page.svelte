<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  import AuthUI from '$lib/components/AuthUI/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';

  import { ROLE } from '$lib/utils/constants/roles';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { setTheme } from '$lib/utils/functions/theme';
  import { t } from '$lib/utils/functions/translations';
  import {
    NOTIFICATION_NAME,
    triggerSendEmail
  } from '$lib/utils/services/notification/notification';
  import { capturePosthogEvent } from '$lib/utils/services/posthog';
  import { currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import type { CurrentOrg } from '$lib/utils/types/org.js';
  import {
    addMemberToGroup,
    fetchCourseGroupIds,
    fetchGroupData,
    fetchTeacherMembers
  } from './functions.js';

  export let data;

  let loading = false;
  let disableSubmit = false;
  let formRef: HTMLFormElement;
  let supabase = getSupabase();

  async function handleCourseSubmit(data) {
    const courseData = await fetchGroupData('course', data.id);
    if (!courseData?.group_id) return;

    const member = {
      profile_id: $profile.id,
      group_id: courseData.group_id,
      role_id: ROLE.STUDENT
    };

    const teachers = await fetchTeacherMembers(courseData.group_id);
    await handleAddMember(member, teachers);
  }

  async function handlePathwaySubmit(data) {
    const pathwayData = await fetchGroupData('pathway', data.id);

    if (!pathwayData?.group_id) return;

    const teachers = await fetchTeacherMembers(pathwayData.group_id);
    const courseIds = await fetchCourseGroupIds(data.id);

    const member = {
      profile_id: $profile.id,
      email: $profile?.email,
      role_id: ROLE.STUDENT,
      group_id: pathwayData.group_id
    };

    // Add member to each course group
    await Promise.all(
      courseIds.map(async (courseId) => {
        const courseMember = {
          profile_id: $profile.id,
          email: $profile?.email,
          group_id: courseId,
          role_id: ROLE.STUDENT
        };
        await addMemberToGroup(courseMember);
      })
    );

    // Add member to pathway group
    await handleAddMember(member, teachers);
  }

  async function handleAddMember(member, teachers) {
    const addedMember = await addMemberToGroup(member);
    loading = false;

    if (addedMember && addedMember.error) {
      console.error('Error adding student to group', member.group_id, addedMember.error);
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

    // Send email welcoming student to the course
    triggerSendEmail(NOTIFICATION_NAME.STUDENT_COURSE_WELCOME, {
      to: $profile.email,
      orgName: data.currentOrg?.name,
      courseName: data.name
    });

    // Send notification to all teacher(s) that a student has joined the course.
    Promise.all(
      teachers.map((email) =>
        triggerSendEmail(NOTIFICATION_NAME.TEACHER_STUDENT_JOINED, {
          to: email,
          courseName: data.name,
          studentName: $profile.fullname,
          studentEmail: $profile.email
        })
      )
    );

    // go to lms
    return goto('/lms');
  }

  async function handleSubmit(data, type) {
    loading = true;

    if (type === 'course') {
      await handleCourseSubmit(data);
    } else if (type === 'pathway') {
      await handlePathwaySubmit(data);
    }

    loading = false;
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
  handleSubmit={data.isPathway
    ? () => handleSubmit(data, 'pathway')
    : () => handleSubmit(data, 'course')}
  isLoading={loading}
  showOnlyContent={true}
  showLogo={true}
  bind:formRef
>
  <div class="mt-0 w-full">
    <h3 class="mb-4 mt-0 text-center text-lg font-medium dark:text-white">{data.name}</h3>
    <p class="text-center text-sm font-light dark:text-white">{data.description}</p>
  </div>

  <div class="my-4 flex w-full items-center justify-center">
    {#if data.isPathway}
      <PrimaryButton
        label={$t('course.navItem.people.teams.join_pathway')}
        type="submit"
        isDisabled={disableSubmit || loading}
        isLoading={loading}
      />
    {:else}
      <PrimaryButton
        label={$t('course.navItem.people.teams.join_course')}
        type="submit"
        isDisabled={disableSubmit || loading}
        isLoading={loading}
      />
    {/if}
  </div>
</AuthUI>
