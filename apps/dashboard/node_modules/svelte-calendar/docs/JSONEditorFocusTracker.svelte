<script>
	import CrossfadeProvider from '../components/generic/crossfade/CrossfadeProvider.svelte';
	import { storeContextKey } from '../context';
	import { getContext, onMount } from 'svelte';
	import { spring } from 'svelte/motion';

	const store = getContext(storeContextKey);

	let initialFocusTarget = $store.focusTarget;
	let mounted = false;

	const rect = $store.focusTarget?.el.getBoundingClientRect() || {};
	const config = spring(
		{
			width: rect.width || 0,
			height: rect.height || 0,
			x: rect.left || 0,
			y: rect.top || 0
		},
		{ stiffness: 0.3, damping: 0.55 }
	);

	onMount(() => {
		mounted = true;
	});

	$: style = [
		`width: ${$config.width + 10}px`,
		`height: ${$config.height + 10}px`,
		`transform: translate(${$config.x - 5}px, ${$config.y - 5}px)`
	].join(';');

	$: {
		if (mounted && $store.focusTarget && $store.focusTarget !== initialFocusTarget) {
			initialFocusTarget = undefined;
			const { width, height, left: x, top: y } = $store.focusTarget.el.getBoundingClientRect();
			config.set({ width, height, x, y });
		}
	}
</script>

<CrossfadeProvider let:key let:send let:receive>
	<div
		class="focus-tracker"
		on:click={store.openEditor.bind(store)}
		in:receive|local={{ key }}
		out:send|local={{ key }}
		{style}
	/>
</CrossfadeProvider>

<style>
	.focus-tracker {
		position: fixed;
		top: 0;
		left: 0;
		background: rgba(255, 255, 255, 0.18);
		z-index: 2;
		cursor: pointer;
	}
</style>
