<script lang="ts">
	import { box } from 'svelte-toolbelt';
	import { useImageCropperRoot } from './image-cropper.svelte.js';
	import type { ImageCropperRootProps } from './types';
	import { onDestroy } from 'svelte';
	import { useId } from 'bits-ui';

	let {
		id = useId(),
		src = $bindable(''),
		onCropped = () => {},
		onUnsupportedFile = () => {},
		children,
		...rest
	}: ImageCropperRootProps = $props();

	const rootState = useImageCropperRoot({
		id: box.with(() => id),
		src: box.with(
			() => src,
			(v) => (src = v)
		),
		onCropped: box.with(() => onCropped),
		onUnsupportedFile: box.with(() => onUnsupportedFile)
	});

	onDestroy(() => rootState.dispose());
</script>

{@render children?.()}
<input
	{...rest}
	onchange={(e) => {
		const file = e.currentTarget.files?.[0];
		if (!file) return;
		rootState.onUpload(file);
		// reset so that we can reupload the same file
		(e.target! as HTMLInputElement).value = '';
	}}
	type="file"
	{id}
	style="display: none;"
/>
