<script>
  import { Moon } from 'svelte-loading-spinners';
  import { browser } from '$app/environment';
  import Navigation from '../Course/components/Navigation/index.svelte';
  import Backdrop from '$lib/components/Backdrop/index.svelte';
  import { course, group, setCourse, defaultCourse } from '../Course/store';
  import Confetti from '../Confetti/index.svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { profile } from '$lib/utils/store/user';
  import { apps } from '$lib/components/Apps/store';
  import { fetchCourse } from '$lib/utils/services/courses';

  export let courseId = '';
  export let path = '';
  export let isExercisePage = false;
  export let isStudent = false;
  export let isFetching = false;

  let prevCourseId = '';

  async function onCourseIdChange(courseId = '') {
    console.log('courseid changed', courseId);
    if (!courseId || prevCourseId === courseId || !browser || $course.id === courseId) return;

    console.log('making request', courseId);
    isFetching = true;
    course.set(defaultCourse);

    const { data: _data } = await fetchCourse(courseId);

    if (_data) {
      setCourse(_data);
    }

    isFetching = false;
    prevCourseId = courseId;
  }

  $: onCourseIdChange(courseId);

  $: {
    const user = $group.people.find((person) => person.profile_id === $profile.id);

    if (user) {
      isStudent = user.role_id === 3;
      $apps.isStudent = isStudent;
    }
  }
</script>

<svelte:head>
  <title>{$course.title || 'ClassroomIO Course'}</title>
</svelte:head>

{#if isFetching}
  <Backdrop>
    <Moon size="60" color="#1d4ed8" unit="px" duration="1s" />
  </Backdrop>
{/if}

<div class="root">
  <Navigation {path} {isStudent} />
  <div class="rightBar" class:isMobile={$isMobile}>
    {#if isExercisePage}
      <Confetti />
    {/if}
    <slot />
  </div>
</div>

<style>
  .root {
    display: flex;
    width: 100%;
  }

  .rightBar {
    flex-grow: 1;
    width: calc(100% - 360px);
  }
</style>
