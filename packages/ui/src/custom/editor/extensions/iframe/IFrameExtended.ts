import type { Component } from 'svelte';
import IFrame from './IFrame';
import type { NodeViewProps } from '@tiptap/core';
import { SvelteNodeViewRenderer } from 'svelte-tiptap';

export const IFrameExtended = (content: Component<NodeViewProps>) =>
  IFrame.extend({
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
