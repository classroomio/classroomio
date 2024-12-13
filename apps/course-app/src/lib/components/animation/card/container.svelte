<script lang="ts">
	import Ellipses from './ellipses.svelte';
</script>

<div
	class="relative mx-auto w-full border border-dashed border-zinc-300 px-8 shadow-sm sm:px-6 md:px-8 dark:border-zinc-800 dark:bg-[#09090B]"
>
	<div
		class="absolute left-0 top-4 -z-0 h-px w-full bg-zinc-400 sm:top-6 md:top-8 dark:bg-zinc-700"
	></div>
	<div
		class="absolute bottom-4 left-0 z-0 h-px w-full bg-zinc-400 sm:bottom-6 md:bottom-8 dark:bg-zinc-700"
	></div>
	<div class="relative w-full border-x border-zinc-400 dark:border-zinc-700">
		<Ellipses />
		<div class="relative z-20 mx-auto py-8">
			<slot>Default</slot>
		</div>
	</div>
</div>
