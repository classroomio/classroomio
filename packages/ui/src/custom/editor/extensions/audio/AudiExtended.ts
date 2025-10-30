import { Audio } from './AudioExtension';
import type { Component } from 'svelte';
import type { NodeViewProps } from '@tiptap/core';
import { SvelteNodeViewRenderer } from 'svelte-tiptap';

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
