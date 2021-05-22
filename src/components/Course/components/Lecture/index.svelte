<script>
  import PageNav from "../../../PageNav/index.svelte";
  import Classwork from "./Classwork.svelte";
  import Homework from "./Homework.svelte";
  import Readme from "./Readme/index.svelte";
  import PrimaryContainedButton from "../../../PrimaryContainedButton/index.svelte";

  import MODES from "../../../../utils/constants/mode.js";

  export let path;
  export let tab;
  export let mode;

  let modeLabel = "Edit";

  $: modeLabel = mode === MODES.edit ? "Save" : "Edit";

  function handleModeChange(e) {
    e.preventDefault();
    mode = mode === MODES.edit ? MODES.view : MODES.edit;
  }
</script>

<div>
  <PageNav
    navItems={[
      {
        label: "README.md",
        isActive: tab === "lectures",
        href: `${path}?tab=lectures`,
      },
      {
        label: "Class work",
        isActive: tab === "classwork",
        href: `${path}?tab=classwork`,
      },
      {
        label: "Hometasks",
        isActive: tab === "hometasks",
        href: `${path}?tab=hometasks`,
      },
    ]}
  >
    <div slot="widget">
      <PrimaryContainedButton
        label={modeLabel}
        handleClick={handleModeChange}
      />
    </div>
  </PageNav>

  <div class="course">
    {#if tab === "lectures"}
      <Readme {mode} />
    {:else if tab === "classwork"}
      <Classwork />
    {:else if tab === "hometasks"}
      <Homework />
    {/if}
  </div>
</div>

<style>
  .course {
    padding: 0 40px;
  }
</style>
