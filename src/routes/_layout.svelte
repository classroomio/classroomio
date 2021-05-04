<script>
  import Tailwindcss from "../components/Tailwindcss.svelte";
  // import Nav from "../components/Nav.svelte";
  import LeftNav from "../components/LeftNav.svelte";
  import SideBar from "../components/SideBar.svelte";
  import Footer from "../components/Footer.svelte";

  export let segment;
</script>

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
</style>

<Tailwindcss />

<!-- <Nav {segment} /> -->

<main class="flex max-w-screen-xl">
  <LeftNav {segment} />
  <slot />
  <SideBar />
</main>

<Footer />
