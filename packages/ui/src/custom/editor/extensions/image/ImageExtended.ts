import { SvelteNodeViewRenderer } from 'svelte-tiptap';
import Image, { type ImageOptions } from '@tiptap/extension-image';
import type { Component } from 'svelte';
import type { NodeViewProps, Node } from '@tiptap/core';

function parseWidthFromStyle(style: string): string | null {
  const match = style.match(/width:\s*([^;]+)/);
  return match ? match[1].trim() : null;
}

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
          parseHTML: (element) => {
            const style = element.getAttribute('style');
            if (style) {
              const width = parseWidthFromStyle(style);
              if (width) return width;
            }
            return '100%';
          },
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
          parseHTML: (element) => {
            return element.getAttribute('data-align') || 'left';
          },
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
