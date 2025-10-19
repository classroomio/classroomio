import { SvelteNodeViewRenderer } from 'svelte-tiptap';
import { Audio } from './AudioExtension.js';
import type { NodeViewProps } from '@tiptap/core';
import type { Component } from 'svelte';

export const AudioExtended = (content: Component<NodeViewProps>) =>
	Audio.extend({
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
