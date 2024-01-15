<script>
	import Crossfade from '../components/generic/crossfade/Crossfade.svelte';
	import blurr from '../directives/blurr';
	import { tick } from 'svelte';

	export let isOpen = false;
	export let style = '';

	let translateY = 0;
	let translateX = 0;

	let popover;
	let triggerWidth;
	let triggerHeight;
	let contentsWrapper;

	export const close = () => {
		isOpen = false;
	};

	const getDistanceToEdges = () => {
		let { top, bottom, left, right } = contentsWrapper.getBoundingClientRect();
		return {
			top: top + -1 * translateY,
			bottom: window.innerHeight - bottom + translateY,
			left: left + -1 * translateX,
			right: document.body.clientWidth - right + translateX
		};
	};

	const getY = ({ bottom, top }) => {
		if (top < 0) return -1 * top;
		if (bottom < 0) return bottom;
		return 0;
	};

	const getX = ({ left, right }) => {
		if (left < 0) return -1 * left;
		if (right < 0) return right;
		return 0;
	};

	const openPopover = async () => {
		isOpen = true;
		await tick();
		let dist = getDistanceToEdges();
		translateX = getX(dist);
		translateY = getY(dist);
	};
</script>

<Crossfade let:receive let:send let:key>
	<div
		use:blurr
		on:blurr={close}
		class="sc-popover"
		bind:this={popover}
		style="{style}; min-width: {triggerWidth + 1}px; min-height: {triggerHeight + 1}px;"
	>
		{#if !isOpen}
			<div
				class="trigger"
				on:click={openPopover}
				bind:offsetWidth={triggerWidth}
				bind:offsetHeight={triggerHeight}
			>
				<slot {key} {send} {receive} />
			</div>
		{:else}
			<div
				class="contents-wrapper"
				style="transform: translate(-50%,-50%) translate({translateX}px, {translateY}px)"
				bind:this={contentsWrapper}
			>
				<div class="contents">
					<div class="contents-inner">
						<slot name="contents" {key} {send} {receive} />
					</div>
				</div>
			</div>
		{/if}
	</div>
</Crossfade>

<style>
	.trigger {
		display: inline-block;
	}
	.sc-popover {
		position: relative;
		display: inline-block;
	}
	.contents-wrapper {
		transform: translate(-50%, -50%);
		position: absolute;
		top: 50%;
		left: 50%;
		z-index: 10;
		overflow: hidden;
	}
</style>
