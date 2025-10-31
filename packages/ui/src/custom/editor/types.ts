import type { Content, Editor } from '@tiptap/core';
import type { EditorState, Transaction } from '@tiptap/pm/state';

import type { EditorView } from '@tiptap/pm/view';
import type { Snippet } from 'svelte';

export interface EdraEditorProps {
  content?: Content;
  editable?: boolean;
  editor?: Editor;
  autofocus?: boolean;
  onUpdate?: (args: { editor: Editor; transaction: Transaction }) => void;
  class?: string;
}

export interface EditorProps {
  // Content of the editor
  content?: Content;
  // Whether the toolbar should be visible
  showToolBar?: boolean;
  // Whether the editor is editable
  editable?: boolean;
  // Whether to enable localStorage persistence
  enablePersistence?: boolean;
  // localStorage key for content persistence
  contentStorageKey?: string;
  // localStorage key for editable state persistence
  editableStorageKey?: string;
  // CSS class for the editor wrapper
  class?: string;
  // CSS class for the editor itself
  editorClass?: string;
  // Callback functions
  onContentChange?: (content: Content) => void;
  onEditorReady?: (editor: Editor) => void;
  onEditorDestroy?: () => void;
}

export interface EdraToolbarProps {
  editor: Editor;
  class?: string;
  excludedCommands?: string[];
  children?: Snippet<[]>;
}

export interface ShouldShowProps {
  editor: Editor;
  element: HTMLElement;
  view: EditorView;
  state: EditorState;
  oldState?: EditorState;
  from: number;
  to: number;
}
