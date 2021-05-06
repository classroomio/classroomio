<script>
  import { stores } from "@sapper/app";
  import PageNav from "../../components/PageNav/index.svelte";
  import Class from "../../components/Classes/Class.svelte";

  const { page } = stores();
  const path = $page.path;
  let tab = "";

  $: tab = $page.query.tab || "lectures";
</script>

<style>
  .root {
    min-width: 600px;
    margin: 0 auto;
    border-left: 1px solid var(--border-color);
    border-right: 1px solid var(--border-color);
  }
</style>

<svelte:head>
  <title>QA Automation</title>
</svelte:head>

<div class="root">
  <PageNav
    title="QA Automation"
    navItems={[{ label: 'Lectures', isActive: tab === 'lectures', href: `${path}?tab=lectures` }, { label: 'Class work', isActive: tab === 'classwork', href: `${path}?tab=classwork` }, { label: 'Hometasks', isActive: tab === 'hometasks', href: `${path}?tab=hometasks` }]} />
  <Class />
</div>
