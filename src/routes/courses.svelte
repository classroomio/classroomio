<script context="module">
  import { profile } from '../utils/store/user';
  import { fetchCourses } from '../components/Courses/api';

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
  import PageNav from '../components/PageNav/index.svelte';
  import Courses from '../components/Courses/index.svelte';
  import NewCourseModal from '../components/Courses/components/NewCourseModal/index.svelte';
  import PrimaryButton from '../components/PrimaryButton/index.svelte';
  import {
    courses,
    createCourseModal,
    courseMetaDeta,
  } from '../components/Courses/store';
  import { setProfileIdOfGroupMember } from '../utils/services/courses';

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

<section class="root">
  <PageNav title="All courses">
    <div slot="widget">
      {#if $profile.role === 'educator'}
        <PrimaryButton
          label="New"
          onClick={() => ($createCourseModal.open = true)}
        />
      {/if}
    </div>
  </PageNav>

  <NewCourseModal />

  <Courses />
</section>

<style>
  .root {
    width: 100%;
    padding: 0 10px;
    min-height: 90vh;
    /* min-width: 600px;
    margin: 0 auto;
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color); */
  }
</style>
