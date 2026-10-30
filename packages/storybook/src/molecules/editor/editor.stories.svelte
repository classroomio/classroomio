<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { Editor, DocCommentMark } from '@cio/ui/custom/editor';
  import { FIELDS, DEFAULT_CONTENT } from './constants';

  const { Story } = defineMeta({
    title: 'Molecules/Editor',
    component: Editor,
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onContentChange: { control: false },
      onEditorReady: { control: false },
      onEditorDestroy: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template()}
    <Editor />
  {/snippet}
</Story>

<Story name="With Sample Content">
  {#snippet template()}
    <Editor content={DEFAULT_CONTENT} />
  {/snippet}
</Story>

<Story name="Read Only">
  {#snippet template()}
    <Editor content={DEFAULT_CONTENT} editable={false} />
  {/snippet}
</Story>

<Story name="Without Toolbar">
  {#snippet template()}
    <Editor content={DEFAULT_CONTENT} showToolBar={false} />
  {/snippet}
</Story>

<Story name="With Persistence">
  {#snippet template()}
    <Editor content={DEFAULT_CONTENT} enablePersistence={true} contentStorageKey="storybook-editor-content" />
  {/snippet}
</Story>

<Story name="Custom Styling">
  {#snippet template()}
    <Editor
      content={DEFAULT_CONTENT}
      class="mx-auto max-w-4xl rounded-lg border-2 border-blue-300"
      editorClass="h-64 p-4 bg-gray-50"
    />
  {/snippet}
</Story>

<Story name="With Callbacks">
  {#snippet template()}
    <Editor
      content={DEFAULT_CONTENT}
      onContentChange={(content) => console.log('Content changed:', content)}
      onEditorReady={(editor) => console.log('Editor ready:', editor)}
    />
  {/snippet}
</Story>

<Story name="Multiple Editors">
  {#snippet template()}
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <h3 class="mb-2 text-lg font-semibold">Article</h3>
        <Editor content={DEFAULT_CONTENT} contentStorageKey="article-content" enablePersistence={true} />
      </div>
      <div>
        <h3 class="mb-2 text-lg font-semibold">Notes</h3>
        <Editor showToolBar={false} editorClass="h-48" contentStorageKey="notes-content" enablePersistence={true} />
      </div>
    </div>
  {/snippet}
</Story>

<Story name="Expanded In Sheet">
  {#snippet template()}
    <Editor
      content={DEFAULT_CONTENT}
      editorClass="h-24"
      expandable
      expanded={true}
      expandedTitle="Case study: Dupont SARL quote"
      expandedDescription="Description"
    />
  {/snippet}
</Story>

<Story name="Without Drag Handle">
  {#snippet template()}
    <Editor content={DEFAULT_CONTENT} editorClass="h-32" showDragHandle={false} />
  {/snippet}
</Story>

<Story name="Docs · frameless">
  {#snippet template()}
    <Editor content={`<h1>Instructor playbook</h1><p>Plan your next course.</p>`} frameless />
  {/snippet}
</Story>

<Story name="Docs · empty table of contents">
  {#snippet template()}
    <Editor content={`<div data-type="table-of-contents"></div><p></p>`} frameless />
  {/snippet}
</Story>

<Story name="Docs · nested table of contents">
  {#snippet template()}
    <Editor
      content={`<div data-type="table-of-contents"></div><h1>Getting started</h1><h2>Before the lesson</h2><h3>Materials</h3><h2>During the lesson</h2><h1>Next steps</h1>`}
      frameless
    />
  {/snippet}
</Story>

<Story name="Docs · read only table of contents">
  {#snippet template()}
    <Editor
      content={`<div data-type="table-of-contents"></div><h1>Course guide</h1><h2>Objectives</h2><p>Learn at your own pace.</p>`}
      editable={false}
      showToolBar={false}
      frameless
    />
  {/snippet}
</Story>

<Story name="Docs · anchored comment">
  {#snippet template()}
    <Editor
      content={`<p>Review <span data-doc-comment="sample-thread">this learning objective</span> with your team.</p>`}
      extraExtensions={[DocCommentMark]}
      frameless
    />
  {/snippet}
</Story>
