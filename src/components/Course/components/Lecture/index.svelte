<script>
  import PageNav from "../../../PageNav/index.svelte";
  import Classwork from "./Classwork.svelte";
  import Homework from "./Homework.svelte";
  import Readme from "./Readme.svelte";

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
  />

  <div class="course">
    {#if tab === "lectures"}
      <Readme />
    {:else if tab === "classwork"}
      <Classwork />
    {:else if tab === "hometasks"}
      <Homework />
    {/if}
  </div>
</div>

<style>
  .course {
    max-width: 600px;
    margin: 0 auto;
    padding: 0 40px;
  }
</style>
