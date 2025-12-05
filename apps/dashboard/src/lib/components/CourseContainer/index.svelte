<script lang="ts">
  import { goto } from '$app/navigation';
  import { Moon } from 'svelte-loading-spinners';
  import { browser } from '$app/environment';
  import Navigation from '../Course/components/Navigation/index.svelte';
  import Backdrop from '$lib/components/Backdrop/index.svelte';
  import { course, group, setCourse, defaultCourse } from '../Course/store';
  import Confetti from '../Confetti/index.svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { profile } from '$lib/utils/store/user';
  import { fetchCourseFromAPI } from '$lib/utils/services/courses';
  import { globalStore } from '$lib/utils/store/app';
  import { lessons } from '../Course/components/Lesson/store/lessons';
  import Modal from '$lib/components/Modal/index.svelte';
  import { t } from '$lib/utils/functions/translations';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { isOrgAdmin } from '$lib/utils/store/org';

  export let courseId = '';
  export let path = '';
  export let isExercisePage = false;
  export let isFetching = false;
  export let containerClass = '';

  let prevCourseId = '';
  let isPermitted = true;

  async function onCourseIdChange(courseId = '') {
    if (!courseId || prevCourseId === courseId || !browser || $course.id === courseId) return;

    isFetching = true;
    course.set(defaultCourse);
    lessons.set([]);

    const { data: _data } = await fetchCourseFromAPI(courseId);

    if (_data) {
      $course.type = _data.type;
      setCourse(_data);
    }

    isFetching = false;
    prevCourseId = courseId;
  }

  function filterPollsByStatus(shouldFilter: boolean) {
    if (!shouldFilter) return;

    $course.polls = $course.polls.filter((poll) => poll.status === 'published');
  }

  $: onCourseIdChange(courseId);

  $: {
    const user = $group.people.find((person) => person.profile_id === $profile.id);
    if (user) {
      $globalStore.isStudent = user.role_id === 3;

      filterPollsByStatus($globalStore.isStudent);
    } else if ($isOrgAdmin === false && $profile.id && $group.people.length) {
      // Current User doesn't h ave permission to view
      isPermitted = false;
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

<Modal open={!isPermitted} width="w-96" modalHeading={$t('course.not_permitted.header')}>
  <div>
    <p class="text-md text-center dark:text-white">
      {$t('course.not_permitted.body')}
    </p>

    <div class="mt-5 flex justify-center">
      <PrimaryButton
        className="px-6 py-3"
        label={$t('course.not_permitted.button')}
        onClick={() => {
          goto('/org/*');
        }}
      />
    </div>
  </div>
</Modal>

<div class="root">
  <Navigation {path} isStudent={$globalStore.isStudent} />
  <div class="rightBar {containerClass}" class:isMobile={$isMobile}>
    {#if isExercisePage}
      <Confetti />
    {/if}

    <!-- Show only if permitted -->
    {#if isPermitted}
      <slot />
    {/if}
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
