import type { Editor } from '@tiptap/core';
import { Icon } from '@lucide/svelte';

export interface EdraToolBarCommands {
  name: string;
  icon: typeof Icon;
  tooltip?: string;
  shortCut?: string;
  onClick?: (editor: Editor) => void;
  turnInto?: (editor: Editor, pos: number) => void;
  isActive?: (editor: Editor) => boolean;
  clickable?: (editor: Editor) => boolean;
}
