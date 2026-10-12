import { mergeAttributes, Node } from '@tiptap/core';

export const CALLOUT_STYLES = ['info', 'tip', 'important', 'warning', 'highlight'] as const;

export type CalloutStyle = (typeof CALLOUT_STYLES)[number];

export const CALLOUT_OPTIONS: { id: CalloutStyle; label: string }[] = [
  { id: 'info', label: 'Info' },
  { id: 'tip', label: 'Tip' },
  { id: 'important', label: 'Important' },
  { id: 'warning', label: 'Warning' },
  { id: 'highlight', label: 'Highlight' }
];

export function isCalloutStyle(value: string): value is CalloutStyle {
  return (CALLOUT_STYLES as readonly string[]).includes(value);
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    callout: {
      setCallout: (style: CalloutStyle | null) => ReturnType;
    };
  }
}

export const Callout = Node.create({
  name: 'callout',

  group: 'block',

  content: 'block+',

  defining: true,

  addAttributes() {
    return {
      style: {
        default: 'info',
        parseHTML: (element) => {
          const value = element.getAttribute('data-callout') ?? '';
          return isCalloutStyle(value) ? value : 'info';
        },
        renderHTML: (attributes) => {
          if (!isCalloutStyle(attributes.style)) return {};

          return { 'data-callout': attributes.style };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-callout]',
        contentElement: (node) => {
          const body = node.querySelector(':scope > .cio-callout-body');
          if (body instanceof HTMLElement) return body;

          return node;
        }
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { class: 'cio-callout' }),
      ['div', { class: 'cio-callout-mark', 'aria-hidden': 'true', contenteditable: 'false' }],
      ['div', { class: 'cio-callout-body' }, 0]
    ];
  },

  addCommands() {
    return {
      setCallout:
        (style) =>
        ({ commands, editor }) => {
          const active = editor.isActive(this.name);

          if (!style) {
            if (!active) return true;

            return commands.lift(this.name);
          }

          if (!isCalloutStyle(style)) return false;

          if (!active) return commands.wrapIn(this.name, { style });

          if (editor.getAttributes(this.name).style === style) return true;

          return commands.updateAttributes(this.name, { style });
        }
    };
  },

  addKeyboardShortcuts() {
    return {
      Backspace: () => {
        const { empty, $anchor } = this.editor.state.selection;
        if (!empty || $anchor.parentOffset !== 0) return false;
        if ($anchor.parent.type.name !== 'paragraph' || $anchor.parent.content.size !== 0) return false;

        const calloutDepth = $anchor.depth - 1;
        if (calloutDepth < 1) return false;

        const callout = $anchor.node(calloutDepth);
        if (callout.type !== this.type || callout.childCount !== 1) return false;

        return this.editor.commands.lift(this.name);
      }
    };
  }
});
