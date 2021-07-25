<script>
  import { onMount, afterUpdate } from 'svelte';

  import Navigation from '../Course/components/Navigation/index.svelte';
  import { lessons, lesson } from '../Course/components/Lesson/store/lessons';
  import { questionnaire } from '../Course/components/Lesson/Exercise/store';
  import { questionnaireMetaData } from '../Course/components/Lesson/Exercise/store/answers';

  export let courseData = {};
  export let path;

  function setStoreWithData() {
    lessons.set(courseData.lessons);

    if (courseData.lesson) {
      lesson.set(courseData.lesson);
    }

    if (courseData.exercise && courseData.exercise.data) {
      questionnaire.set(courseData.exercise.data);
      questionnaireMetaData.set(courseData.exercise.answers);
    }
  }

  onMount(setStoreWithData);

  afterUpdate(setStoreWithData);
</script>

<svelte:head>
  <title>{courseData.name}</title>
</svelte:head>

<div class="root">
  <Navigation courseId={courseData.id} {path} />
  <div class="rightBar">
    <slot />
  </div>
</div>

<style>
  .root {
    display: flex;
    border-right: 1px solid var(--border-color);
    width: 100%;
    max-width: calc(100% - 100px);
    overflow-x: hidden;
  }

  .rightBar {
    flex-grow: 1;
    width: calc(100% - 350px);
  }
</style>
