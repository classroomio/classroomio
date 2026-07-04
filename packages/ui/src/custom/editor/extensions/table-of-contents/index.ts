import { TableOfContents, getHierarchicalIndexes } from '@tiptap/extension-table-of-contents';
import type { Component } from 'svelte';
import { createTableOfContentsBlock } from './table-of-contents-block';

export {
  createTableOfContentsBlock,
  TABLE_OF_CONTENTS_BLOCK_TAG,
  TABLE_OF_CONTENTS_INITIAL_CONTENT
} from './table-of-contents-block';

export function createTableOfContentsExtensions(component: Component) {
  return [
    TableOfContents.configure({
      getIndex: getHierarchicalIndexes,
      onUpdate: () => {}
    }),
    createTableOfContentsBlock(component)
  ];
}
