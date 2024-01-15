<script>
	import { getContext } from 'svelte';
	import { writable } from 'svelte/store';

	const noop = () => false;

	const store = getContext('crossfade') || writable({ send: noop, receive: noop });
</script>

<slot key={$store.key} send={$store.send} receive={$store.receive} />
