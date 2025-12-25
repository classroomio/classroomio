import type { Editor } from '@tiptap/core';
import type { EdraToolBarCommands } from '../../commands/types';
import Minus from '@lucide/svelte/icons/minus';
import Quote from '@lucide/svelte/icons/quote';
import SquareCode from '@lucide/svelte/icons/square-code';
import commands from '../../commands/toolbar-commands';

export interface Group {
  name: string;
  title: string;
  actions: EdraToolBarCommands[];
}

export const GROUPS: Group[] = [
  {
    name: 'format',
    title: 'Format',
    actions: [
      ...commands.headings,
      {
        icon: Quote,
        name: 'blockquote',
        tooltip: 'Blockquote',
        onClick: (editor: Editor) => {
          editor.chain().focus().setBlockquote().run();
        }
      },
      {
        icon: SquareCode,
        name: 'codeBlock',
        tooltip: 'Code Block',
        onClick: (editor: Editor) => {
          editor.chain().focus().setCodeBlock().run();
        }
      },
      ...commands.lists
    ]
  },
  {
    name: 'insert',
    title: 'Insert',
    actions: [
      ...commands.media,
      ...commands.table,
      ...commands.math,
      {
        icon: Minus,
        name: 'horizontalRule',
        tooltip: 'Horizontal Rule',
        onClick: (editor: Editor) => {
          editor.chain().focus().setHorizontalRule().run();
        }
      }
    ]
  }
];

export default GROUPS;
