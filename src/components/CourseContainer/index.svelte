<script>
  import { onMount, afterUpdate } from 'svelte';

  import Navigation from '../Course/components/Navigation/index.svelte';
  // import { lessons, lesson } from '../Course/components/Lesson/store/lessons';
  // import { questionnaire } from '../Course/components/Lesson/Exercise/store/exercise';
  // import { questionnaireMetaData } from '../Course/components/Lesson/store/answers';
  import { course } from '../Course/store';
  import Confetti from '../Confetti/index.svelte';

  export let path = '';
  export let isExercisePage = false;

  function setStoreWithData() {
    // lessons.set(courseData.lessons);
    // if (courseData.lesson) {
    //   lesson.set(courseData.lesson);
    // }
    // if (courseData.exercise && courseData.exercise.data) {
    //   questionnaire.set(courseData.exercise.data);
    //   questionnaireMetaData.set(courseData.exercise.answers);
    // }
  }

  onMount(setStoreWithData);

  afterUpdate(setStoreWithData);
</script>

<svelte:head>
  <title>{$course.title || 'ClassroomIO Course'}</title>
</svelte:head>

<div class="root">
  <Navigation {path} />
  <div class="rightBar">
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
