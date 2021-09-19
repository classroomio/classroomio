<script>
  import Navigation from '../Course/components/Navigation/index.svelte';
  // import { lessons, lesson } from '../Course/components/Lesson/store/lessons';
  // import { questionnaire } from '../Course/components/Lesson/Exercise/store/exercise';
  // import { questionnaireMetaData } from '../Course/components/Lesson/store/answers';
  import { course, group } from '../Course/store';
  import Confetti from '../Confetti/index.svelte';
  import { isMobile } from '../../utils/store/useMobile';
  import { profile } from '../../utils/store/user';

  export let path = '';
  export let isExercisePage = false;
  export let isStudent = false;

  $: {
    const user = $group.people.find(
      (person) => person.profile_id === $profile.id
    );

    if (user) {
      isStudent = user.role_id === 3;
    }
  }
</script>

<svelte:head>
  <title>{$course.title || 'ClassroomIO Course'}</title>
</svelte:head>

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

  .rightBar.isMobile {
    margin-left: 10px;
  }
</style>
