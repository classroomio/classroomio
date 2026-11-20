import type { Editor } from '@tiptap/core';
import type { EdraToolBarCommands } from '../../commands/types';
import CircleAlert from '@lucide/svelte/icons/circle-alert';
import CircleOff from '@lucide/svelte/icons/circle-off';
import Info from '@lucide/svelte/icons/info';
import Lightbulb from '@lucide/svelte/icons/lightbulb';
import Minus from '@lucide/svelte/icons/minus';
import Quote from '@lucide/svelte/icons/quote';
import SquareCode from '@lucide/svelte/icons/square-code';
import Star from '@lucide/svelte/icons/star';
import TriangleAlert from '@lucide/svelte/icons/triangle-alert';
import commands from '../../commands/toolbar-commands';
import { CALLOUT_OPTIONS, type CalloutStyle } from '../callout/callout';

export interface Group {
  name: string;
  title: string;
  actions: EdraToolBarCommands[];
}

const calloutIcons: Record<CalloutStyle, EdraToolBarCommands['icon']> = {
  info: Info,
  tip: Lightbulb,
  important: CircleAlert,
  warning: TriangleAlert,
  highlight: Star
};

const calloutActions: EdraToolBarCommands[] = [
  {
    icon: CircleOff,
    name: 'callout-default',
    tooltip: 'Default',
    onClick: (editor: Editor) => {
      editor.chain().focus().setCallout(null).run();
    }
  },
  ...CALLOUT_OPTIONS.map((option) => ({
    icon: calloutIcons[option.id],
    name: `callout-${option.id}`,
    tooltip: option.label,
    onClick: (editor: Editor) => {
      editor.chain().focus().setCallout(option.id).run();
    }
  }))
];

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
    name: 'callout',
    title: 'Callout style',
    actions: calloutActions
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
