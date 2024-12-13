<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import { Navigation } from '$lib/components/navigation';

	import '../app.css';

	let { children } = $props();
</script>

<Toaster />

<Navigation />

{@render children()}
