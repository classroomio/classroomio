<script lang="ts">
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';

	export let number = 10;
	let meteorStyles: any = [];
	let changeMeteors = (num: number) => {
		meteorStyles = [];
		const styles = [...new Array(num)].map(() => ({
			top: -20,
			left: Math.floor(Math.random() * 700) + 'px',
			animationDelay: Math.random() * 1 + 0.2 + 's',
			animationDuration: Math.floor(Math.random() * 8 + 2.9) + 's'
		}));
		meteorStyles = styles;
	};
	onMount(() => {
		changeMeteors(number);
	});
	//   $: changeMeteors(number);
</script>

{#each meteorStyles as style, idx}
	<span
		id="meteor-{idx + 1}"
		class={cn(
			'animate-meteor pointer-events-none absolute left-1/2 top-1/2 size-[2.4px] rotate-[215deg] rounded-full bg-slate-500 shadow-[0_0_0_1px_#ffffff10]'
		)}
		style="top: {style.top}px; left: {style.left}; animation-delay: {style.animationDelay}; animation-duration: {style.animationDuration};"
	>
		<!-- Meteor Tail  -->
		<div
			class="pointer-events-none absolute top-1/2 -z-10 h-px w-[50px] -translate-y-1/2 bg-gradient-to-r from-slate-500 via-blue-600/30 to-transparent"
		/>
	</span>
{/each}
