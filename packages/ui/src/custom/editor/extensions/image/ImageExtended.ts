import { SvelteNodeViewRenderer } from 'svelte-tiptap';
import Image, { type ImageOptions } from '@tiptap/extension-image';
import type { Component } from 'svelte';
import type { NodeViewProps, Node } from '@tiptap/core';

export const ImageExtended = (component: Component<NodeViewProps>): Node<ImageOptions, unknown> => {
	return Image.extend({
		addAttributes() {
			return {
				src: {
					default: null
				},
				alt: {
					default: null
				},
				title: {
					default: null
				},
				width: {
					default: '100%'
				},
				height: {
					default: null
				},
				align: {
					default: 'left'
				}
			};
		},
		addNodeView: () => {
			return SvelteNodeViewRenderer(component);
		}
	}).configure({
		allowBase64: true
	});
};
