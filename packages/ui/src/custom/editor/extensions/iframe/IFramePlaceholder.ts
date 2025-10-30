import { Node, mergeAttributes, type CommandProps, type NodeViewProps } from '@tiptap/core';
import type { Component } from 'svelte';
import { SvelteNodeViewRenderer } from 'svelte-tiptap';

export interface IFramePlaceholderOptions {
	HTMLAttributes: Record<string, object>;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		iframePlaceholder: {
			/**
			 * Inserts a IFrame placeholder
			 */
			insertIFramePlaceholder: () => ReturnType;
		};
	}
}

export const IFramePlaceholder = (content: Component<NodeViewProps>) =>
	Node.create<IFramePlaceholderOptions>({
		name: 'iframe-placeholder',
		addOptions() {
			return {
				HTMLAttributes: {},
				onDrop: () => {},
				onDropRejected: () => {},
				onEmbed: () => {}
			};
		},
		parseHTML() {
			return [{ tag: `div[data-type="${this.name}"]` }];
		},

		renderHTML({ HTMLAttributes }) {
			return ['div', mergeAttributes(HTMLAttributes)];
		},
		group: 'block',
		draggable: true,
		atom: true,
		content: 'inline*',
		isolating: true,

		addNodeView() {
			return SvelteNodeViewRenderer(content);
		},
		addCommands() {
			return {
				insertIFramePlaceholder: () => (props: CommandProps) => {
					return props.commands.insertContent({
						type: 'iframe-placeholder'
					});
				}
			};
		}
	});
