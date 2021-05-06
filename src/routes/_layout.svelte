<script>
  import Tailwindcss from "../components/Tailwindcss.svelte";
  // import Nav from "../components/Nav.svelte";
  import LeftNav from "../components/LeftNav/index.svelte";
  import SideBar from "../components/SideBar/index.svelte";
  import Footer from "../components/Footer/index.svelte";

  export let segment;
</script>

<Tailwindcss />

<!-- <Nav {segment} /> -->

<main class="flex max-w-screen-xl">
  <LeftNav {segment} />
  <slot />
  <SideBar />
</main>

<Footer />

<style>
  main {
    background-color: white;
    /* padding: 15px 2em; */
    margin: 0 auto;
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
