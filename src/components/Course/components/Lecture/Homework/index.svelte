<script>
  import MODES from "../../../../../utils/constants/mode.js";
  import EditMode from "./EditMode.svelte";
  import ViewMode from "./ViewMode.svelte";

  export let mode = "";
</script>

{#if mode === MODES.edit}
  <EditMode />
{:else}
  <ViewMode />
{/if}
