<script>
  import { handleAddQuestion } from "./store/index";
  import PrimaryButton from "../../../../PrimaryButton/index.svelte";
  import PageBody from "../../../../PageBody/index.svelte";
  import ViewMode from "./ViewMode.svelte";
  import EditMode from "./EditMode.svelte";
  import MODES from "../../../../../utils/constants/mode.js";
  import { VARIANTS } from "../../../../PrimaryButton/constants";

  export let exerciseId;

  let mode = MODES.view;
  let preview = false;

  function handleMode() {
    mode = mode === MODES.edit ? MODES.view : MODES.edit;
    preview = false;
  }
</script>

<PageBody>
  <svelte:fragment slot="header">
    <div class="flex items-center">
      <PrimaryButton
        className="mr-2"
        variant={VARIANTS.OUTLINED}
        label={mode === MODES.edit ? "Save" : "Edit"}
        onClick={handleMode}
      />
      {#if mode === MODES.edit || preview}
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          label={preview ? "Edit" : "Preview"}
          onClick={() => (preview = !preview)}
        />
      {/if}
    </div>

    {#if mode === MODES.edit}
      <div class="flex items-center">
        <PrimaryButton
          variant={VARIANTS.OUTLINED}
          onClick={handleAddQuestion}
          label="Add Question"
        />
      </div>
    {/if}
  </svelte:fragment>

  {#if mode === MODES.edit && !preview}
    <EditMode />
  {:else}
    <ViewMode {preview} />
  {/if}
</PageBody>
