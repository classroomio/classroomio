<script>
	import CrossfadeProvider from '../components/generic/crossfade/CrossfadeProvider.svelte';
	import { createEventDispatcher, getContext } from 'svelte';
	import { base } from '$app/paths';

	const page = getContext('navbar');
	const dispatch = createEventDispatcher();

	export let href = '';
	export let isActive = (path) => `${base}${path}` === href;

	const click = (evt) => dispatch('click', evt);

	$: active = isActive($page.path);
</script>

<CrossfadeProvider let:key let:send let:receive>
	<a {href} class:active on:click={click}>
		<span class="text">
			<slot />
		</span>
		{#if active}
			<span in:receive|local={{ key }} out:send|local={{ key }} class="highlight" />
		{/if}
	</a>
</CrossfadeProvider>

<style>
	a {
		padding: 18px;
		display: inline-block;
		text-decoration: none;
		color: #fcfcfc;
		font-size: 1.3em;
		text-align: center;
		display: grid;
		grid-template: 1fr / 1fr;
		padding: 0;
		line-height: 41px;
		white-space: nowrap;
	}
	span {
		padding: 0 30px;
		grid-row: 1;
		grid-column: 1;
	}
	span.text {
		z-index: 2;
	}
	.highlight {
		background: #333;
		border-bottom: 5px solid #fff;
	}
</style>
