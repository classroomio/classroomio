<script lang="ts">
	import type { NodeViewProps } from '@tiptap/core';
	import MediaExtended from './MediaExtended.svelte';

	const { ...rest }: NodeViewProps = $props();

	let mediaRef = $state<HTMLElement>();
</script>

<MediaExtended bind:mediaRef {...rest}>
	{@const node = rest.node}
	<iframe bind:this={mediaRef} class="m-0 w-full" {...node.attrs}> </iframe>
</MediaExtended>
