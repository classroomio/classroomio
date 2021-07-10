<script>
  import List from "./List.svelte";
  import Exercise from "./Exercise.svelte";

  export let exerciseId;
  export let path;
</script>

{#if exerciseId}
  <Exercise {exerciseId} />
{:else}
  <List {path} />
{/if}
