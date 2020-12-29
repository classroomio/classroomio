<script>
	import Tailwindcss from '../components/Tailwindcss.svelte';
	import Nav from '../components/Nav.svelte';
  import SideBar from "../components/SideBar.svelte";
  import Footer from "../components/Footer.svelte";

	export let segment;
</script>

<style>
	main {
		background-color: white;
		padding: 15px 2em;
		margin: 0 auto;
		box-sizing: border-box;
	}

  @media only screen and (max-width : 768px) {
    main {
      flex-direction: column;
      align-items: center;
      padding: 10px;
    }
  }
</style>

<Tailwindcss />

<Nav {segment}/>

<main class="flex max-w-screen-xl">
  <slot></slot>
	<SideBar />
</main>

<Footer />
