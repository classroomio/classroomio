<script>
  import PageNav from "../../../PageNav/index.svelte";
  import Classwork from "./Classwork.svelte";
  import Homework from "./Homework.svelte";
  // import Readme from "./Readme.svelte";
  import ReadmeInEditMode from "./Readme/EditMode.svelte";
  import Switcher from "../../../Switcher/index.svelte";

  export let path;
  export let tab;

  $: console.log("path", path);
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
      <Switcher />
    </div>
  </PageNav>

  <div class="course">
    {#if tab === "lectures"}
      <ReadmeInEditMode />
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
