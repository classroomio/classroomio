<script>
  import { stores } from "@sapper/app";
  import PageNav from "../components/PageNav/index.svelte";
  import Class from "../components/Classes/Class.svelte";

  const { page } = stores();
  let path = "";
  let discussions = [];

  $: path = $page.path || "lectures";
  console.log($page.path);
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
    navItems={[{ label: 'Lectures', isActive: path.includes('lectures'), href: `${path}lectures` }, { label: 'Class work', isActive: path.includes('classwork'), href: `${path}classwork` }, { label: 'Hometasks', isActive: path.includes('hometasks'), href: `${path}hometasks` }]} />
  <Class />
</div>
