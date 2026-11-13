import { Editor, InputRule, Node, mergeAttributes, type JSONContent } from '@tiptap/core';
import { InlineMath } from '@tiptap/extension-mathematics';
import { UndoRedo } from '@tiptap/extensions';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { joinMathText, splitMathText, type MathTextSegment } from '@cio/utils/math';
import { clipboardMathToMathText } from '../../tools/clipboard-math';
import 'katex/dist/katex.min.css';

export interface MathNodeClick {
  latex: string;
  pos: number;
  element: HTMLElement | null;
}

export interface MathTextEditorOptions {
  element: HTMLElement;
  value: string;
  editable: boolean;
  attributes: Record<string, string>;
  onChange: (value: string) => void;
  onMathClick: (click: MathNodeClick) => void;
}

export interface MathTextEditorController {
  setValue: (value: string) => void;
  setEditable: (editable: boolean) => void;
  /** Inserts math at the selection when `pos` is null, else updates the formula at `pos`; empty LaTeX removes it. */
  saveMath: (pos: number | null, latex: string) => void;
  focus: () => void;
  destroy: () => void;
}

const DOLLAR_MATH_INPUT = /(^|[^$\\])\$([^\s$](?:[^$\n]*[^\s$\\])?)\$$/;

const SingleLineDocument = Node.create({
  name: 'doc',
  topNode: true,
  content: 'paragraph'
});

const SingleLineParagraph = Node.create({
  name: 'paragraph',
  group: 'block',
  content: 'inline*',
  parseHTML() {
    return [{ tag: 'p' }];
  },
  renderHTML({ HTMLAttributes }) {
    return ['p', mergeAttributes(HTMLAttributes), 0];
  },
  addKeyboardShortcuts() {
    return {
      Enter: () => true,
      'Shift-Enter': () => true,
      'Mod-Enter': () => true
    };
  }
});

const SingleLineText = Node.create({
  name: 'text',
  group: 'inline'
});

const SingleLineMath = InlineMath.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      display: { default: false, rendered: false }
    };
  },
  addInputRules() {
    return [
      new InputRule({
        find: DOLLAR_MATH_INPUT,
        handler: ({ state, range, match }) => {
          const start = range.from + match[1].length;
          state.tr.replaceWith(start, range.to, this.type.create({ latex: match[2] }));
        }
      })
    ];
  }
});

function toInlineContent(value: string): JSONContent[] {
  return splitMathText(value).map((segment) =>
    segment.type === 'math'
      ? { type: 'inlineMath', attrs: { latex: segment.latex, display: segment.display } }
      : { type: 'text', text: segment.text }
  );
}

function toDocument(value: string): JSONContent {
  return { type: 'doc', content: [{ type: 'paragraph', content: toInlineContent(value) }] };
}

function toMathText(doc: ProseMirrorNode): string {
  const segments: MathTextSegment[] = [];

  doc.descendants((node) => {
    if (node.isText) {
      segments.push({ type: 'text', text: node.text ?? '' });
      return;
    }

    if (node.type.name !== 'inlineMath') return;

    segments.push({ type: 'math', latex: String(node.attrs.latex ?? ''), display: node.attrs.display === true });
  });

  return joinMathText(segments);
}

/** Mounts a one-line TipTap editor that holds text and inline math and reads and writes `$…$` strings. */
export function createMathTextEditor(options: MathTextEditorOptions): MathTextEditorController {
  const editor: Editor = new Editor({
    element: options.element,
    editable: options.editable,
    content: toDocument(options.value),
    extensions: [
      SingleLineDocument,
      SingleLineParagraph,
      SingleLineText,
      UndoRedo,
      SingleLineMath.configure({
        onClick: (node, pos) => {
          if (!editor.isEditable) return;

          options.onMathClick({
            latex: String(node.attrs.latex ?? ''),
            pos,
            element: editor.view.nodeDOM(pos) as HTMLElement | null
          });
        }
      })
    ],
    editorProps: {
      attributes: options.attributes,
      handlePaste: (_view, event) => {
        const clipboard = event.clipboardData;
        const pastedText = clipboard ? (clipboardMathToMathText(clipboard) ?? clipboard.getData('text/plain')) : '';
        if (!pastedText) return false;

        const content = toInlineContent(pastedText.replace(/\s*\n\s*/g, ' '));
        if (content.length === 0) return true;

        editor.commands.insertContent(content);
        return true;
      }
    },
    onUpdate: ({ editor: updatedEditor }) => options.onChange(toMathText(updatedEditor.state.doc))
  });

  return {
    setValue: (value) => {
      editor.commands.setContent(toDocument(value), { emitUpdate: false });
    },
    setEditable: (editable) => {
      if (editor.isEditable === editable) return;

      editor.setEditable(editable, false);
    },
    saveMath: (pos, latex) => {
      const trimmedLatex = latex.trim();
      const chain = editor.chain().focus();

      if (pos === null) {
        if (trimmedLatex) chain.insertInlineMath({ latex: trimmedLatex });
        chain.run();
        return;
      }

      if (!trimmedLatex) {
        chain.deleteInlineMath({ pos }).run();
        return;
      }

      chain.updateInlineMath({ latex: trimmedLatex, pos }).run();
    },
    focus: () => {
      editor.commands.focus();
    },
    destroy: () => editor.destroy()
  };
}
