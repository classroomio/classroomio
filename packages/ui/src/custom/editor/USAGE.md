# Reusable Editor Component Usage Examples

The Editor component has been rewritten to be fully reusable with configurable props instead of managing internal state.

## Basic Usage

```svelte
<script lang="ts">
  import { Editor } from '@cio/ui/custom/editor';
  import type { Content } from '@tiptap/core';

  let content: Content = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello, world!' }]
      }
    ]
  };
</script>

<Editor bind:content />
```

## Using HTML Content

You can also initialize the editor with HTML content by converting it to the appropriate Content format:

```svelte
<script lang="ts">
  import { Editor } from '@cio/ui/custom/editor';
  import type { Content } from '@tiptap/core';

  // Example with HTML content
  let htmlContent = `
    <h1>Welcome to the Editor</h1>
    <p>This is a <strong>paragraph</strong> with <em>formatting</em>.</p>
    <ul>
      <li>First item</li>
      <li>Second item with <a href="https://example.com">a link</a></li>
    </ul>
    <blockquote>
      <p>This is a quote block</p>
    </blockquote>
  `;

  // The editor will automatically parse HTML content
  let content: Content = htmlContent;
</script>

<Editor bind:content />
```

You can also set HTML content programmatically:

```svelte
<script lang="ts">
  import { Editor } from '@cio/ui/custom/editor';
  import type { Content, Editor as TiptapEditor } from '@tiptap/core';

  let content: Content = { type: 'doc', content: [] };
  let editor: TiptapEditor;

  function loadHtmlContent() {
    const htmlString = `
      <h2>Dynamically Loaded Content</h2>
      <p>This content was loaded after the editor was ready.</p>
      <code>console.log('Hello, world!');</code>
    `;
    
    if (editor) {
      editor.commands.setContent(htmlString);
    }
  }

  function handleEditorReady(editorInstance: TiptapEditor) {
    editor = editorInstance;
  }
</script>

<Editor 
  bind:content
  onEditorReady={handleEditorReady}
/>

<button on:click={loadHtmlContent}>
  Load HTML Content
</button>
```

## Advanced Usage with All Props

```svelte
<script lang="ts">
  import { Editor } from '@cio/ui/custom/editor';
  import type { Content, Editor as TiptapEditor } from '@tiptap/core';

  let content: Content = {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: 'Hello, world!' }]
      }
    ]
  };
  
  let editable = true;
  let showToolBar = true;

  function handleContentChange(newContent: Content) {
    console.log('Content changed:', newContent);
    // Handle content changes
  }

  function handleEditorReady(editor: TiptapEditor) {
    console.log('Editor ready:', editor);
    // Handle editor ready
  }
</script>

<Editor 
  bind:content
  bind:editable
  {showToolBar}
  enablePersistence={true}
  contentStorageKey="my-app-content"
  editableStorageKey="my-app-editable"
  class="custom-editor-wrapper"
  editorClass="custom-editor h-96"
  onContentChange={handleContentChange}
  onEditorReady={handleEditorReady}
/>
```

## Multiple Editors

```svelte
<script lang="ts">
  import { Editor } from '@cio/ui/custom/editor';
  import type { Content } from '@tiptap/core';

  let article: Content = { type: 'doc', content: [] };
  let notes: Content = { type: 'doc', content: [] };
</script>

<div class="grid grid-cols-2 gap-4">
  <div>
    <h2>Article</h2>
    <Editor 
      bind:content={article}
      contentStorageKey="article-content"
      enablePersistence={true}
    />
  </div>
  
  <div>
    <h2>Notes</h2>
    <Editor 
      bind:content={notes}
      showToolBar={false}
      contentStorageKey="notes-content"
      enablePersistence={true}
      editorClass="h-48"
    />
  </div>
</div>
```

## Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `content` | `Content` | Default doc with placeholder | Editor content (bindable) |
| `showToolBar` | `boolean` | `true` | Whether to show the toolbar |
| `editable` | `boolean` | `true` | Whether the editor is editable |
| `enablePersistence` | `boolean` | `false` | Enable localStorage persistence |
| `contentStorageKey` | `string` | `'edra-content'` | localStorage key for content |
| `editableStorageKey` | `string` | `'edra-editable'` | localStorage key for editable state |
| `class` | `string` | Default wrapper classes | CSS classes for wrapper |
| `editorClass` | `string` | `'h-[32rem] overflow-auto'` | CSS classes for editor |
| `onContentChange` | `(content: Content) => void` | `undefined` | Callback when content changes |
| `onEditorReady` | `(editor: Editor) => void` | `undefined` | Callback when editor is ready |
| `onEditorDestroy` | `() => void` | `undefined` | Callback when editor is destroyed |

## Callbacks

| Callback | Type | Description |
|----------|------|-------------|
| `onContentChange` | `(content: Content) => void` | Called when editor content changes |
| `onEditorReady` | `(editor: Editor) => void` | Called when editor is ready |
| `onEditorDestroy` | `() => void` | Called when editor is destroyed |

```svelte
<Editor 
  content={myContent}
  onContentChange={(content) => {
    console.log('New content:', content);
    // Save to database, update state, etc.
  }}
  onEditorReady={(editor) => {
    console.log('Editor is ready, you can focus it:', editor);
    editor.commands.focus();
  }}
/>
```

## Migration from Old Version

### Before (internal state)

```svelte
<script>
  import { Editor } from './editor.svelte';
  // No props needed, everything was internal
</script>

<Editor />
```

### After (prop-based)

```svelte
<script>
  import { Editor } from './editor.svelte';
  import type { Content } from '@tiptap/core';
  
  let content: Content = { type: 'doc', content: [] };
</script>

<Editor bind:content />
```

## Benefits of the Rewrite

1. **Reusability**: Can be used multiple times with different configurations
2. **State Control**: Parent components control the state
3. **Flexibility**: Persistence can be disabled or customized
4. **Callback Handling**: Modern callback props instead of deprecated events
5. **TypeScript Support**: Full type safety with proper interfaces
6. **Customization**: All styling can be overridden via props
