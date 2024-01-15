<script>
	import { getStores } from '$app/stores';
	import Crossfade from '../components/generic/crossfade/Crossfade.svelte';
	import { setContext } from 'svelte';
	import { elasticOut } from 'svelte/easing';

	const { page } = getStores();
	setContext('navbar', page);
</script>

<Crossfade easing={elasticOut} duration={1250}>
	<nav>
		<section class="flex">
			<slot />
		</section>
		<section />
	</nav>
</Crossfade>

<style>
	nav {
		background: #0f0b0c;
		display: grid;
		grid-template-columns: auto 1fr;
		overflow-x: auto;
	}
	.flex {
		display: flex;
	}

	@media (max-width: 720px) {
		nav section:last-child {
			display: none;
		}
		nav::-webkit-scrollbar-track {
			box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.3);
			background-color: #333;
		}

		nav::-webkit-scrollbar {
			height: 3px;
			background-color: #000;
		}

		nav::-webkit-scrollbar-thumb {
			background-color: #000;
			background-image: -webkit-linear-gradient(
				45deg,
				rgba(255, 255, 255, 0.2) 25%,
				transparent 25%,
				transparent 50%,
				rgba(255, 255, 255, 0.2) 50%,
				rgba(255, 255, 255, 0.2) 75%,
				transparent 75%,
				transparent
			);
		}
	}
</style>
