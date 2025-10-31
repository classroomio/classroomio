import { flushSync, mount, unmount } from 'svelte';
import type { Editor, NodeViewProps } from '@tiptap/core';

interface RendererOptions<P extends Record<string, unknown>> {
	editor: Editor;
	props: P;
}

type App = ReturnType<typeof mount>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
class SvelteRenderer<R = unknown, P extends Record<string, any> = object> {
	id: string;
	component: App;
	editor: Editor;
	props: P;
	element: HTMLElement;
	ref: R | null = null;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	mnt: Record<any, any> | null = null;

	constructor(component: App, { props, editor }: RendererOptions<P>) {
		this.id = Math.floor(Math.random() * 0xffffffff).toString();
		this.component = component;
		this.props = props;
		this.editor = editor;

		this.element = document.createElement('div');
		this.element.classList.add('svelte-renderer');

		if (this.editor.isInitialized) {
			// On first render, we need to flush the render synchronously
			// Renders afterwards can be async, but this fixes a cursor positioning issue
			flushSync(() => {
				this.render();
			});
		} else {
			this.render();
		}
	}

	render(): void {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		this.mnt = mount(this.component as any, {
			target: this.element,
			props: {
				props: this.props
			}
		});
	}

	updateProps(props: Partial<NodeViewProps>): void {
		Object.assign(this.props, props);
		this.destroy();
		this.render();
	}

	updateAttributes(attributes: Record<string, string>): void {
		Object.keys(attributes).forEach((key) => {
			this.element.setAttribute(key, attributes[key]);
		});
		this.destroy();
		this.render();
	}

	destroy(): void {
		if (this.mnt) {
			unmount(this.mnt);
		} else {
			unmount(this.component);
		}
	}
}

export default SvelteRenderer;
