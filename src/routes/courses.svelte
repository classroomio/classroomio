<script>
  import { stores } from "@sapper/app";
  import PageNav from "../components/PageNav/index.svelte";
  import Courses from "../components/Courses/index.svelte";

  const { page } = stores();
  let tab = "";

  $: tab = $page.query.tab || "mine";
</script>

<svelte:head>
  <title>Courses</title>
</svelte:head>

<div class="root">
  <PageNav title="Courses" />
  <Courses />
</div>

<style>
  .root {
    min-width: 600px;
    margin: 0 auto;
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
  }
</style>
