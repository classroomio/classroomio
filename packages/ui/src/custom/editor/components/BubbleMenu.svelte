<script lang="ts">
	import { onMount, type Snippet } from 'svelte';
	import { BubbleMenuPlugin, type BubbleMenuPluginProps } from '@tiptap/extension-bubble-menu';
	import type { Editor } from '@tiptap/core';

	type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

	interface Props
		extends Optional<Omit<Optional<BubbleMenuPluginProps, 'pluginKey'>, 'element'>, 'editor'> {
		editor?: Editor;
		children?: Snippet<[]>;
		class?: string;
		style?: string;
		pluginKey?: string;
		updateDelay?: number;
		resizeDelay?: number;
	}

	let {
		editor,
		shouldShow = null,
		class: className = '',
		style = '',
		children,
		updateDelay,
		resizeDelay,
		pluginKey = 'bubbleMenu',
		options,
		...restProps
	}: Props = $props();

	let element = $state<HTMLElement>();

	onMount(() => {
		if (!element) return;

		element.style.position = 'absolute';
		element.style.visibility = 'hidden';

		if (!editor || editor.isDestroyed) {
			console.warn('BubbleMenu component does not have editor prop or editor is destroyed.');
			return;
		}

		const plugin = BubbleMenuPlugin({
			pluginKey,
			editor,
			element,
			shouldShow,
			updateDelay,
			resizeDelay,
			options
		});

		editor.registerPlugin(plugin);

		return () => {
			if (editor && !editor.isDestroyed) {
				editor.unregisterPlugin(pluginKey);
			}
		};
	});
</script>

<div bind:this={element} class={`bubble-menu-wrapper ${className}`} {style} {...restProps}>
	{@render children?.()}
</div>
