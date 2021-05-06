<script>
  import PageNav from "../components/PageNav/index.svelte";
  import Classes from "../components/Classes/index.svelte";
  import { stores } from "@sapper/app";

  const { page } = stores();
  let tab = "";

  $: tab = $page.query.tab || "mine";
</script>

<svelte:head>
  <title>Classes</title>
</svelte:head>

<div class="root">
  <PageNav title="Classes" />
  <Classes />
</div>

<style>
  .root {
    min-width: 600px;
    margin: 0 auto;
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
  }
</style>
