<script>
  // @ts-nocheck

  import { Moon } from 'svelte-loading-spinners';
  import Navigation from '../Course/components/Navigation/index.svelte';
  import Backdrop from '$lib/components/Backdrop/index.svelte';
  // import { lessons, lesson } from '../Course/components/Lesson/store/lessons';
  // import { questionnaire } from '../Course/components/Lesson/Exercise/store/exercise';
  // import { questionnaireMetaData } from '../Course/components/Lesson/store/answers';
  import { course, group } from '../Course/store';
  import Confetti from '../Confetti/index.svelte';
  import { isMobile } from '$lib/utils/store/useMobile';
  import { profile } from '$lib/utils/store/user';

  export let path = '';
  export let isExercisePage = false;
  export let isStudent = false;
  export let isFetching = false;

  $: {
    const user = $group.people.find((person) => person.profile_id === $profile.id);

    if (user) {
      isStudent = user.role_id === 3;
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
