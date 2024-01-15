<script>
	import { themeContextKey } from '../../context';

	import { getContext } from 'svelte';

	export let key = null;

	const store = getContext(themeContextKey);

	$: !key ? '' : Object.entries($store[key]).map(([k, v]) => `--${k}: ${v}`);
</script>
