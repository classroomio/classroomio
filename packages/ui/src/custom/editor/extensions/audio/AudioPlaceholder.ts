import { Editor, Node, mergeAttributes, type CommandProps, type NodeViewProps } from '@tiptap/core';
import type { Component } from 'svelte';
import { SvelteNodeViewRenderer } from 'svelte-tiptap';

export interface AudioPlaceholderOptions {
	HTMLAttributes: Record<string, object>;
	onDrop: (files: File[], editor: Editor) => void;
	onDropRejected?: (files: File[], editor: Editor) => void;
	onEmbed: (url: string, editor: Editor) => void;
	allowedMimeTypes?: Record<string, string[]>;
	maxFiles?: number;
	maxSize?: number;
}

declare module '@tiptap/core' {
	interface Commands<ReturnType> {
		audioPlaceholder: {
			/**
			 * Inserts an audio placeholder
			 */
			insertAudioPlaceholder: () => ReturnType;
		};
	}
}

export const AudioPlaceholder = (
	component: Component<NodeViewProps>
): Node<AudioPlaceholderOptions> =>
	Node.create<AudioPlaceholderOptions>({
		name: 'audio-placeholder',
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
			return SvelteNodeViewRenderer(component);
		},
		addCommands() {
			return {
				insertAudioPlaceholder: () => (props: CommandProps) => {
					return props.commands.insertContent({
						type: 'audio-placeholder'
					});
				}
			};
		}
	});
