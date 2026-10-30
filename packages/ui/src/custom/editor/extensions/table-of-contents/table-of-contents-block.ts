import { Node, mergeAttributes } from '@tiptap/core';
import type { Component } from 'svelte';
import { SvelteNodeViewRenderer } from 'svelte-tiptap';

export const TABLE_OF_CONTENTS_BLOCK_TAG = 'div[data-type="table-of-contents"]';

export const TABLE_OF_CONTENTS_INITIAL_CONTENT = '<div data-type="table-of-contents"></div><p></p>';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    tableOfContentsBlock: {
      insertTableOfContentsBlock: () => ReturnType;
    };
  }
}

export function createTableOfContentsBlock(Component: Component) {
  return Node.create({
    name: 'tableOfContentsBlock',
    group: 'block',
    atom: true,
    selectable: true,
    draggable: true,

    parseHTML() {
      return [{ tag: 'div[data-type="table-of-contents"]' }];
    },

    renderHTML({ HTMLAttributes }) {
      return ['div', mergeAttributes(HTMLAttributes, { 'data-type': 'table-of-contents' })];
    },

    addNodeView() {
      return SvelteNodeViewRenderer(Component);
    },

    addCommands() {
      return {
        insertTableOfContentsBlock:
          () =>
          ({ chain }) =>
            chain().focus().insertContent({ type: this.name }).run()
      };
    }
  });
}
