<script lang="ts">
	import { cn } from '$lib/utils';

	let { children, className } = $props();
</script>

<div class={cn('text-left', className)}>
	{@render children()}
</div>
