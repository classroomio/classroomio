import type { EditorProps } from '@cio/ui/custom/editor/types';

export const FIELDS: (keyof EditorProps)[] = [
  'showToolBar',
  'editable',
  'enablePersistence',
  'contentStorageKey',
  'editableStorageKey',
  'class',
  'editorClass'
];

export const DEFAULT_CONTENT = {
  type: 'doc',
  content: [
    {
      type: 'heading',
      attrs: { level: 1 },
      content: [{ type: 'text', text: 'Welcome to the Editor' }]
    },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'This is a ' },
        { type: 'text', marks: [{ type: 'bold' }], text: 'rich text editor' },
        { type: 'text', text: ' with support for various formatting options.' }
      ]
    },
    {
      type: 'bulletList',
      content: [
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Support for lists' }]
            }
          ]
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'Rich text formatting' }]
            }
          ]
        },
        {
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: 'And much more!' }]
            }
          ]
        }
      ]
    }
  ]
};
