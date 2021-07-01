<script>
  import PrimaryContainedButton from "../../../../PrimaryContainedButton/index.svelte";
  import PageBody from "../../../../PageBody/index.svelte";
  import EditMode from "./EditMode.svelte";
  import ViewMode from "./ViewMode.svelte";
  import MODES from "../../../../../utils/constants/mode.js";

  let mode = MODES.view;
</script>

<PageBody>
  <svelte:fragment slot="header">
    <h3>Lesson 2 home exercises</h3>
    <PrimaryContainedButton
      label={mode === MODES.edit ? "Save" : "Edit"}
      handleClick={() => (mode = mode === MODES.edit ? MODES.view : MODES.edit)}
    />
  </svelte:fragment>

  {#if mode === MODES.edit}
    <EditMode />
  {:else}
    <ViewMode />
  {/if}
</PageBody>
