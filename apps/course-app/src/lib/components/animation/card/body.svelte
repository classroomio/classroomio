<script lang="ts">
	import { cn } from '$lib/utils';

	let { children, className } = $props();

	// let cardContent = {
	// 	title: 'Svelte is Vibe',
	// 	description: 'Svelte is a fun way to build web applications.'
	// };
</script>

<div class={cn('p-4 text-left', className)}>
	<!-- <h3 class="mb-1 text-lg font-bold text-gray-900 dark:text-gray-100">
		{cardContent.title}
	</h3>
	<p class="text-gray-700 dark:text-gray-300">
		{cardContent.description}
	</p> -->

	{@render children()}
</div>
