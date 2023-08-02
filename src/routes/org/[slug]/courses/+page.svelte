<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { profile } from '$lib/utils/store/user';
  import { fetchCourses } from '$lib/components/Courses/api';
  import Courses from '$lib/components/Courses/index.svelte';
  import NewCourseModal from '$lib/components/Courses/components/NewCourseModal/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import {
    courses,
    createCourseModal,
    courseMetaDeta,
  } from '$lib/components/Courses/store';
  import { setProfileIdOfGroupMember } from '$lib/utils/services/courses';

  export let data;
  let { allCourses, cantFetch } = data;

  const urlParams = new URLSearchParams($page.url.search);

  if (urlParams.get('create') === 'true') {
    $createCourseModal.open = true;
  }

  async function getCourses(userId) {
    if (cantFetch && typeof cantFetch === 'boolean' && !allCourses.length) {
      $courseMetaDeta.isLoading = true;

      const updatedProfile = await setProfileIdOfGroupMember(
        $profile.email,
        userId
      );
      console.log(`updatedProfile`, updatedProfile);
      const coursesResult = await fetchCourses(userId);
      console.log(`coursesResult`, coursesResult);

      $courseMetaDeta.isLoading = false;
      if (!coursesResult) return;

      // organizationId = coursesResult.organizationId;
      courses.set(coursesResult.allCourses);
    }
  }

  onMount(() => {
    courses.set(allCourses);
  });

  $: getCourses($profile.id);
</script>

<svelte:head>
  <title>Courses - ClassroomIO</title>
</svelte:head>

<section class="w-full max-w-6xl mx-auto">
  <div class="py-10 px-5">
    <div class="flex items-center justify-between mb-10">
      <h1 class="dark:text-white text-3xl font-bold">Courses</h1>
      <PrimaryButton
        label="Create Course"
        onClick={() => ($createCourseModal.open = true)}
      />
    </div>

    <NewCourseModal />

    <Courses />
  </div>
</section>
