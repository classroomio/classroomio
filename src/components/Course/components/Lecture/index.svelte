<script>
  import PageNav from "../../../PageNav/index.svelte";
  import Classwork from "./Classwork.svelte";
  import Homework from "./Homework/index.svelte";
  import Readme from "./Readme/index.svelte";
  import Home from "./Home/index.svelte";

  export let path;
  export let tab;
  export let showLectureHome;
</script>

{#if showLectureHome}
  <Home />
{:else}
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

    <div class="course relative">
      {#if tab === "lectures"}
        <Readme />
      {:else if tab === "classwork"}
        <Classwork />
      {:else if tab === "hometasks"}
        <Homework />
      {/if}
    </div>
  </div>
{/if}

<style>
  .course {
    padding: 0 40px;
  }
</style>
