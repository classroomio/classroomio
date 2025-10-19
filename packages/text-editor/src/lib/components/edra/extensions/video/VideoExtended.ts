import { SvelteNodeViewRenderer } from 'svelte-tiptap';
import { Video } from './VideoExtension.js';
import type { NodeViewProps } from '@tiptap/core';
import type { Component } from 'svelte';

export const VideoExtended = (content: Component<NodeViewProps>) =>
	Video.extend({
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
			return SvelteNodeViewRenderer(content);
		}
	});
