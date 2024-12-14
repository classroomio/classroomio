<script lang="ts">
	import { Motion, useMotionValue, useMotionTemplate } from 'svelte-motion';
	import { onMount } from 'svelte';
	import { cn } from '$lib/utils';

	export let gradientSize: number = 200;
	export let gradientColor: string = '#262626';
	export let gradientOpacity: number = 0.8;
	let className: string = '';
	export { className as class };

	let gradSize = useMotionValue(gradientSize);
	let gradColor = useMotionValue(gradientColor);
	let mouseX = useMotionValue(-gradientSize);
	let mouseY = useMotionValue(-gradientSize);

	function handleMouseMove(e: MouseEvent) {
		const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
		mouseX.set(e.clientX - rect.left);
		mouseY.set(e.clientY - rect.top);
	}

	function handleMouseLeave() {
		mouseX.set(-gradientSize);
		mouseY.set(-gradientSize);
	}

	onMount(() => {
		mouseX.set(-gradientSize);
		mouseY.set(-gradientSize);
	});
	let bg = useMotionTemplate`radial-gradient(${gradSize}px circle at ${mouseX}px ${mouseY}px, ${gradColor}, transparent 100%)`;
</script>

<!-- svelte-ignore a11y-no-static-element-interactions -->
<!-- I have added py-4 in below code, you can customize the component as per needs -->
<div
	on:mousemove={handleMouseMove}
	on:mouseleave={handleMouseLeave}
	class={cn(
		'group relative flex size-full justify-center overflow-hidden rounded-xl border bg-neutral-100 py-4 text-black dark:bg-neutral-900 dark:text-white',
		className
	)}
>
	<div class="relative z-10">
		<!-- Default  -->
		<slot>
			<div class="flex h-full items-center justify-center text-center">
				<p class="text-2xl">Magic Card</p>
			</div>
		</slot>
	</div>
	<Motion
		style={{
			background: bg,
			opacity: gradientOpacity
		}}
		let:motion
	>
		<div
			use:motion
			class="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
		/>
	</Motion>
</div>

<style>
	.size-full {
		width: 100%;
		height: 100%;
	}
</style>
