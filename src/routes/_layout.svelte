<script>
  import { stores } from '@sapper/app';
  import Tailwindcss from '../components/Tailwindcss.svelte';
  import Navigation from '../components/Navigation/index.svelte';
  // import SideBar from "../components/SideBar/index.svelte";
  import Footer from '../components/Footer/index.svelte';
  import Apps from '../components/Apps/index.svelte';

  export let segment;

  let { page } = stores();
</script>

<Tailwindcss />

<!-- <Nav {segment} /> -->

<main>
  {#if !['login', 'signup'].includes($page.path.replace('/', ''))}
    <Navigation {segment} />
  {/if}
  <div class="flex justify-between">
    <slot />
    {#if $page.path.includes('courses')}
      <Apps />
    {/if}
  </div>
</main>

<Footer />

<style>
  main {
    background-color: white;
    /* padding: 15px 2em; */
    /* margin: 0 auto; */
    box-sizing: border-box;
    /* max-width: 900px; */
  }

  :global(a:hover) {
    text-decoration: underline;
  }
  :global(:root) {
    --main-primary-color: #3182ce;
    --border-color: #eaecef;
  }
</style>
