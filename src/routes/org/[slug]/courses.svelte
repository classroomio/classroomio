<script context="module">
  import { profile } from '../../../utils/store/user';
  import { fetchCourses } from '../../../components/Courses/api';

  export async function preload(page, params) {
    const parsedUser = JSON.parse(params.user);

    // if (parsedUser && parsedUser.id) {
    //   return fetchCourses(parsedUser.id);
    // }

    return {
      allCourses: [],
      organizationId: null,
      cantFetch: true,
    };
  }
</script>

<script>
  import { onMount } from 'svelte';
  import Courses from '../../../components/Courses/index.svelte';
  import NewCourseModal from '../../../components/Courses/components/NewCourseModal/index.svelte';
  import PrimaryButton from '../../../components/PrimaryButton/index.svelte';
  import {
    courses,
    createCourseModal,
    courseMetaDeta,
  } from '../../../components/Courses/store';
  import { setProfileIdOfGroupMember } from '../../../utils/services/courses';

  export let allCourses = [];
  export let cantFetch;

  async function getCourses(userId) {
    if (process.browser) {
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
