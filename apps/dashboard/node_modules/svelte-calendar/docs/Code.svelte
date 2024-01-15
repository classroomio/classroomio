<script>
	import Prism from 'prismjs';
	import 'prism-themes/themes/prism-material-dark.css';
	import 'prism-svelte';
	import { onMount } from 'svelte';

	export let language = 'svelte';
	export let source = `<h1>Default Source</h1>`;
	export let pretranslated;

	let ready = false;
	let highlighted;

	$: {
		if (!pretranslated && ready) {
			highlighted = Prism.highlight(source, Prism.languages[language], 'svelte');
		} else {
			highlighted = pretranslated;
		}
	}

	onMount(() => {
		ready = true;
	});
</script>

<pre
	class="language-{language}">
  {#if highlighted}
    <code>{@html highlighted}</code>
  {/if}
</pre>

<style>
	pre {
		margin: 0;
	}
</style>
