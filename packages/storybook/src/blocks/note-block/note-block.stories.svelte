<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Block from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const SAMPLE_HTML =
    '<h2>Lesson overview</h2><p>Use this note to introduce the lesson and set expectations. Replace this guidance with the ideas your learners need.</p><ul><li>What the lesson covers</li><li>Why it matters</li><li>What learners will do next</li></ul>';

  const { Story } = defineMeta({
    title: 'Blocks/NoteBlock',
    component: Block.Note,
    args: {
      editable: false,
      contentHtml: SAMPLE_HTML,
      empty: false,
      emptyLabel: 'This note is empty'
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      editor: { control: false },
      view: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="View">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Note {...args} editable={false} />
    </div>
  {/snippet}
</Story>

<Story name="Edit">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Note {...args} editable={true}>
        {#snippet editor()}
          <div class="ui:border-border ui:bg-muted/30 min-h-[250px] rounded-lg border p-3">
            <p class="ui:border-border ui:text-muted-foreground border-b pb-2 text-xs">Editor toolbar</p>
            <p class="ui:text-muted-foreground mt-3 text-sm">The rich text editor is injected here.</p>
          </div>
        {/snippet}
      </Block.Note>
    </div>
  {/snippet}
</Story>

<Story name="Empty">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.Note {...args} editable={false} contentHtml="" empty={true} />
    </div>
  {/snippet}
</Story>
