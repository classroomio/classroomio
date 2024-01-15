<script>
	import { KEY_CODES } from '../../config';
	import { keyControlsContextKey } from '../../context';
	import throttle from 'just-throttle';
	import { getContext } from 'svelte';

	export let limit = 0;
	export let ctx = null;

	const currentCtx = getContext(keyControlsContextKey);

	const key = (evt) => {
		if (ctx && !ctx.includes($currentCtx)) return;
		const mapping = $$props[KEY_CODES[evt.keyCode]];
		if (mapping) mapping();
	};

	$: eventHandler = limit ? throttle(key, limit) : key;
</script>

<svelte:window on:keydown={eventHandler} />

<slot />
