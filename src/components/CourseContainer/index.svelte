<script>
  import { onMount } from "svelte";

  import Navigation from "../Course/components/Navigation/index.svelte";
  import { lessons } from "../Course/components/Lesson/store/lessons";

  export let courseData = {};
  export let path;

  onMount(() => {
    if (!$lessons.length) {
      lessons.set(courseData.lessons);
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
