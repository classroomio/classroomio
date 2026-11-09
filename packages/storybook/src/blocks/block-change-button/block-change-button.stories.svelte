<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as Block from '@cio/ui/custom/block';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Blocks/BlockChangeButton',
    component: Block.ChangeButton,
    args: {
      label: 'Change video',
      disabled: false
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onclick: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Default">
  {#snippet template(args)}
    <div class="mx-auto flex w-full max-w-2xl items-center justify-center">
      <Block.ChangeButton {...args} onclick={() => console.log('change')} />
    </div>
  {/snippet}
</Story>

<Story name="Disabled">
  {#snippet template(args)}
    <div class="mx-auto flex w-full max-w-2xl items-center justify-center">
      <Block.ChangeButton {...args} label="Change image" disabled={true} onclick={() => console.log('change')} />
    </div>
  {/snippet}
</Story>

<Story name="OverMedia">
  {#snippet template(args)}
    <div class="mx-auto w-full max-w-2xl">
      <div class="ui:bg-muted relative flex aspect-video w-full items-center justify-center rounded-lg">
        <Block.ChangeButton
          {...args}
          class="ui:absolute ui:top-2 ui:right-2 ui:opacity-100"
          onclick={() => console.log('change')}
        />
      </div>
    </div>
  {/snippet}
</Story>
