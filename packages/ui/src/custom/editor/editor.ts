import { Editor, type Extensions, type EditorOptions, type Content } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { getHandlePaste } from './utils';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import Typography from '@tiptap/extension-typography';
import { ColorHighlighter } from './extensions/ColorHighlighter';
import { FontSize, TextStyle, Color } from '@tiptap/extension-text-style';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import SearchAndReplace from './extensions/FindAndReplace';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Table, TableCell, TableRow, TableHeader } from './extensions/table';
import { Placeholder } from '@tiptap/extensions';
import { Markdown } from '@tiptap/markdown';
import MathMatics from '@tiptap/extension-mathematics';

import AutoJoiner from 'tiptap-extension-auto-joiner';
import 'katex/dist/katex.min.css';
import { InlineMathReplacer } from './extensions/InlineMathReplacer';

export default (
  element?: HTMLElement,
  content?: Content,
  extensions?: Extensions,
  options?: Partial<EditorOptions>,
  placeholder?: string | ((node: any) => string)
) => {
  const editor = new Editor({
    element,
    content,
    extensions: [
      StarterKit.configure({
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal'
          }
        },
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc'
          }
        },
        heading: {
          levels: [1, 2, 3, 4]
        },
        link: {
          openOnClick: false,
          autolink: true,
          linkOnPaste: true
        },
        codeBlock: false
      }),
      Highlight.configure({
        multicolor: true
      }),
      Placeholder.configure({
        emptyEditorClass: 'is-empty',
        // Use a placeholder:
        // Use different placeholders depending on the node type:
        placeholder:
          placeholder ||
          (({ node }) => {
            if (node.type.name === 'heading') {
              return "What's the title?";
            } else if (node.type.name === 'paragraph') {
              return 'Press / or write something ...';
            }
            return '';
          })
      }),
      Color,
      Subscript,
      Superscript,
      Typography,
      ColorHighlighter,
      TextStyle,
      FontSize,
      TextAlign.configure({
        types: ['heading', 'paragraph']
      }),
      TaskList,
      TaskItem.configure({
        nested: true
      }),
      SearchAndReplace,
      InlineMathReplacer,
      MathMatics.configure({
        blockOptions: {
          onClick: (node, pos) => {
            const newCalculation = prompt('Enter new calculation:', node.attrs.latex);
            if (newCalculation) {
              editor.chain().setNodeSelection(pos).updateBlockMath({ latex: newCalculation }).focus().run();
            }
          }
        },
        inlineOptions: {
          onClick: (node, pos) => {
            const newCalculation = prompt('Enter new calculation:', node.attrs.latex);
            if (newCalculation) {
              editor.chain().setNodeSelection(pos).updateInlineMath({ latex: newCalculation }).focus().run();
            }
          }
        }
      }),
      AutoJoiner,
      Table,
      TableHeader,
      TableRow,
      TableCell,
      Markdown,

      ...(extensions ?? [])
    ],
    ...options
  });

  editor.setOptions({
    editorProps: {
      handlePaste: getHandlePaste(editor)
    }
  });
  return editor;
};
