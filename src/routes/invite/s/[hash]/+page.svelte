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

  export let data;

  let supabase = getSupabase();
  let loading = false;

  let disableSubmit = false;
  let formRef: HTMLFormElement;

  async function handleSubmit() {
    loading = true;

    const member = {
      profile_id: $profile.id,
      group_id: data.groupId,
      role_id: ROLE.STUDENT
    };
    addGroupMember(member).then((addedMember) => {
      loading = false;
      if (addedMember.error) {
        console.error('Error adding student to group', data.groupId);
        return;
      }

      // Send notification to teacher(s) that a student has joined the course.
      // also send welcome email to students when they join the course
      // go to lms
      return goto('/lms');
    });
  }

  function setCurOrg(cOrg: CurrentOrg) {
    if (!cOrg) return;
    currentOrg.set(cOrg);
  }

  onMount(() => {
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
    <h3 class="dark:text-white text-lg font-medium mt-0 mb-4 text-center">{data.name}</h3>
    <p class="dark:text-white text-sm font-light text-center">{data.description}</p>
  </div>

  <div class="my-4 w-full flex justify-center items-center">
    <PrimaryButton
      label="Join Course"
      type="submit"
      isDisabled={disableSubmit || loading}
      isLoading={loading}
    />
  </div>
</AuthUI>
