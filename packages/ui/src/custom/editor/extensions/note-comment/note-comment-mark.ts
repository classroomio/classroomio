import { Mark, mergeAttributes } from '@tiptap/core';

export interface NoteCommentMarkOptions {
  HTMLAttributes: Record<string, unknown>;
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    noteComment: {
      setNoteComment: (attributes: { threadId: string }) => ReturnType;
      unsetNoteComment: (attributes?: { threadId?: string }) => ReturnType;
    };
  }
}

export const NoteCommentMark = Mark.create<NoteCommentMarkOptions>({
  name: 'noteComment',

  addOptions() {
    return {
      HTMLAttributes: {}
    };
  },

  addAttributes() {
    return {
      threadId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-note-comment'),
        renderHTML: (attributes) => {
          if (!attributes.threadId) {
            return {};
          }

          return {
            'data-note-comment': attributes.threadId
          };
        }
      }
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-note-comment]'
      }
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'note-comment-mark'
      }),
      0
    ];
  },

  addCommands() {
    return {
      setNoteComment:
        (attributes) =>
        ({ commands }) => {
          return commands.setMark(this.name, attributes);
        },
      unsetNoteComment:
        (attributes) =>
        ({ commands, state }) => {
          if (attributes?.threadId) {
            return commands.command(({ tr }) => {
              const { doc } = state;
              let changed = false;

              doc.descendants((node, pos) => {
                if (!node.isText) {
                  return;
                }

                node.marks.forEach((mark) => {
                  if (mark.type.name === this.name && mark.attrs.threadId === attributes.threadId) {
                    tr.removeMark(pos, pos + node.nodeSize, mark.type);
                    changed = true;
                  }
                });
              });

              return changed;
            });
          }

          return commands.unsetMark(this.name);
        }
    };
  }
});

export default NoteCommentMark;
