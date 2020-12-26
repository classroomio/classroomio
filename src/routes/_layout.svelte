<script>
	import Tailwindcss from '../components/Tailwindcss.svelte';
	import Nav from '../components/Nav.svelte';
  import SideBar from "../components/SideBar.svelte";

	export let segment;
</script>

<style>
	main {
    display: flex;
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

<main>
  <slot></slot>
	<SideBar />
</main>

