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
          default: '100%',
          renderHTML: (attributes) => {
            if (!attributes.width) return {};
            return {
              style: `width: ${attributes.width}; max-width: 100%;`
            };
          }
        },
        height: {
          default: null
        },
        align: {
          default: 'left',
          renderHTML: (attributes) => {
            if (!attributes.align) return {};
            return {
              'data-align': attributes.align
            };
          }
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
