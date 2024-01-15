<script>
	import 'prism-themes/themes/prism-material-dark.css';
	import 'prismjs';
	import 'prismjs/components/prism-json.js';
	import 'prism-svelte';
	import { onMount, setContext } from 'svelte';
	import Crossfade from '../components/generic/crossfade/Crossfade.svelte';
	import JSONEditorFocusTracker from './JSONEditorFocusTracker.svelte';
	import { get } from '../stores/jsonEditor';
	import { storeContextKey } from '../context';
	import JSONEditorModal from './JSONEditorModal.svelte';
	import KeyControls from '../components/generic/KeyControls.svelte';

	export let json = {};
	export const set = (d) => {
		json = d;
		initializeJson();
	};

	let element;
	let ready = false;

	const store = get();
	setContext(storeContextKey, store);

	const initializeJson = () => store.json(json);

	store.subscribe((state) => {
		if (state.json) json = state.json;
	});

	const moveFocus = (dir) => () => store.moveFocus(dir);

	onMount(() => {
		ready = true;
	});

	$: ready && initializeJson();
	$: ready && element && store.registerChildren(element.getElementsByTagName('*'));
</script>

<KeyControls
	throttle={150}
	up={moveFocus(-1)}
	down={moveFocus(1)}
	enter={(evt) => store.openEditor(evt)}
	ctx={[true]}
/>

<div class="grid">
	<Crossfade let:key let:send let:receive>
		{#if $store.editing}
			<JSONEditorModal />
		{:else}
			<JSONEditorFocusTracker />
		{/if}
	</Crossfade>
	<pre
		class="language-json">
    {#if $store.highlighted}
      <code on:mousemove={evt => store.trackFocus(evt)} bind:this={element}>
        {@html $store.highlighted}
      </code>
    {/if}
  </pre>
</div>

<style>
	.grid {
		display: grid;
	}
	.grid > :global(*) {
		grid-column: 1;
		grid-row: 1;
	}
	pre.language-json {
		margin: 0;
		font-size: 1.1em;
	}
	pre :global(.string),
	pre :global(.number),
	pre :global(.boolean) {
		cursor: pointer;
	}
</style>
