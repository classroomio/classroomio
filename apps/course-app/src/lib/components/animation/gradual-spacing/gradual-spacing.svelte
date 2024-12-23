<script lang="ts">
	import { cn } from '$lib/utils';
	import { AnimatePresence, Motion } from 'svelte-motion';

	let className: any = 'Gradual Spacing';
	export { className as class };

	export let words = 'Gradual Spacing';
	export let duration = 0.5;
	export let delayMultiple = 0.04;
	export let framerProps = {
		hidden: { opacity: 0, x: -20 },
		visible: { opacity: 1, x: 0 }
	};
	let wordsspilit = words.split('');
</script>

<div class="flex justify-center space-x-1">
	<AnimatePresence let:item list={[{ key: wordsspilit }]}>
		{#each wordsspilit as char, i}
			<Motion
				initial="hidden"
				animate="visible"
				exit="hidden"
				variants={framerProps}
				transition={{
					duration: duration,
					delay: i * delayMultiple
				}}
				let:motion
			>
				<span use:motion class={cn('drop-shadow-sm', className)}>
					{#if char === ' '}
						<span>&nbsp;</span>
					{:else}
						{char}
					{/if}
				</span>
			</Motion>
		{/each}
	</AnimatePresence>
</div>
