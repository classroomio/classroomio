<script>
  import { onMount, afterUpdate } from 'svelte';

  import Navigation from '../Course/components/Navigation/index.svelte';
  import { lessons, lesson } from '../Course/components/Lesson/store/lessons';

  export let courseData = {};
  export let path;

  onMount(() => {
    lessons.set(courseData.lessons);
    if (courseData.lesson) {
      lesson.set(courseData.lesson);
    }
  });

  afterUpdate(() => {
    lessons.set(courseData.lessons);

    if (courseData.lesson) {
      lesson.set(courseData.lesson);
    }
  });
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
  }

  .rightBar {
    flex-grow: 1;
  }
</style>
