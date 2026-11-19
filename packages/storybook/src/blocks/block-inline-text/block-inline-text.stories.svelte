<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Block from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Blocks/BlockInlineText',
    component: Block.InlineText,
    args: {
      value: 'What does HTTP stand for?',
      editable: true,
      multiline: false,
      placeholder: 'Type a question',
      tag: 'h3',
      class: 'text-lg font-semibold'
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onInput: { control: false },
      ref: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let liveValue = $state('Edit me and watch the value below update.');
</script>

<Story name="Editable">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.InlineText {...args} onInput={(value) => console.log('input', value)} />
    </div>
  {/snippet}
</Story>

<Story name="ReadOnly">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.InlineText {...args} editable={false} />
    </div>
  {/snippet}
</Story>

<Story name="EmptyWithPlaceholder">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.InlineText {...args} value="" placeholder="Chart title" />
    </div>
  {/snippet}
</Story>

<Story name="Multiline">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.InlineText
        {...args}
        tag="p"
        class="text-sm"
        multiline
        value={'HyperText Transfer Protocol.\nIt moves web pages between a server and a browser.'}
      />
    </div>
  {/snippet}
</Story>

<Story name="MaxLength">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <Block.InlineText {...args} tag="span" class="text-sm" value="Tab name" maxLength={12} />
    </div>
  {/snippet}
</Story>

<Story name="Controlled">
  {#snippet template(args)}
    <div class="mx-auto flex w-full max-w-2xl flex-col gap-3">
      <Block.InlineText
        {...args}
        tag="p"
        class="text-sm"
        multiline
        value={liveValue}
        onInput={(value) => (liveValue = value)}
      />
      <pre class="text-xs">{liveValue}</pre>
    </div>
  {/snippet}
</Story>
