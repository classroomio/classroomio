<script>
  import Navigation from "../Course/components/Navigation/index.svelte";
  export let courseTitle = "";
  export let courseId = "";
</script>

<svelte:head>
  <title>{courseTitle}</title>
</svelte:head>

<div class="root">
  <Navigation {courseId} />
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
