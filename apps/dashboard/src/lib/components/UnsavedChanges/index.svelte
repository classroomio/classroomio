<script lang="ts">
	import { beforeNavigate } from '$app/navigation';

	export let hasUnsavedChanges = false;
	export let message = 'You have unsaved changes. Are you sure you want to leave?';

	beforeNavigate(({ cancel }) => {
		if (!shouldAbandonChanges()) cancel();
	});

	function shouldAbandonChanges() {
		if (!hasUnsavedChanges) return true;
		return confirm(message);
	}
</script>

<svelte:window
	on:beforeunload={(e) => {
		const result = shouldAbandonChanges();
		if (!result) e.preventDefault();
	}}
/>

<slot />
