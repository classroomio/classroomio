import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import type { MathBoxRequest } from '../types';

const DOLLAR_TRIGGER_KEY = new PluginKey('mathBoxDollarTrigger');
const WHITESPACE = /\s/;

export interface MathBoxStorage {
  /** Set by the editor component; opens the shared math box for a new formula. */
  openBox: ((request: MathBoxRequest) => void) | null;
}

/** Lets toolbar commands and the `$` key open the shared math box instead of inserting placeholder LaTeX. */
export const MathBoxTrigger = Extension.create<unknown, MathBoxStorage>({
  name: 'mathBoxTrigger',

  addStorage() {
    return { openBox: null };
  },

  addProseMirrorPlugins() {
    const { editor } = this;

    return [
      new Plugin({
        key: DOLLAR_TRIGGER_KEY,
        props: {
          handleTextInput(view, from, to, text) {
            const openBox = editor.storage.mathBoxTrigger.openBox;
            if (text !== '$' || !openBox || !editor.isEditable) return false;
            if (view.state.selection.$from.parent.type.spec.code) return false;

            const characterBefore = view.state.doc.textBetween(Math.max(0, from - 1), from, '\n', '\n');
            if (characterBefore && !WHITESPACE.test(characterBefore)) return false;

            openBox({ type: 'inline', latex: '', from, to, trigger: 'dollar' });

            return true;
          }
        }
      })
    ];
  }
});
