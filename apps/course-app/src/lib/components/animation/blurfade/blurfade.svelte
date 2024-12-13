<script lang="ts">
	import { Motion, AnimatePresence, useAnimation } from 'svelte-motion';
	import { inview } from 'svelte-inview';
	import { cn } from '$lib/utils';
	export let duration = 0.4;
	export let delay = 0;
	export let yOffset = 6;
	export let inViewMargin = '-50px';
	export let blur = '6px';
	export let id = crypto.randomUUID().slice(0, 8);
	export let once = false;
	let defaultVariants = {
		hidden: { opacity: 0, y: yOffset, filter: `blur(${blur})` },
		visible: { opacity: 1, y: 0, filter: `blur(0px)` }
	};
	let isInView = 'hidden';

	let className = '';
	export { className as class };
</script>

<AnimatePresence let:item list={[{ key: id }]}>
	<Motion
		initial="hidden"
		animate={isInView}
		exit="hidden"
		variants={defaultVariants}
		transition={{
			delay: 0.04 + delay,
			duration,
			ease: 'easeOut'
		}}
		let:motion
	>
		<div
			use:inview={{ rootMargin: inViewMargin, unobserveOnEnter: once }}
			use:motion
			on:inview_change={({ detail }) => {
				isInView = detail.inView ? 'visible' : 'hidden';
			}}
			class={cn(className)}
		>
			<slot>Default</slot>
		</div>
	</Motion>
</AnimatePresence>
