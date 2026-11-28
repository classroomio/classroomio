<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import { AI_SHORTCUT } from './choices';
  import { FIELDS } from './ai-button-fields';

  const { Story } = defineMeta({
    title: 'Blocks/AddBlock/AiButton',
    component: AddBlock.AiButton,
    args: {
      label: 'Ask AI',
      shortcut: AI_SHORTCUT,
      variant: 'pill'
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      variant: { control: 'inline-radio', options: ['pill', 'menu'] },
      onclick: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<Story name="Pill">
  {#snippet template(args)}
    <AddBlock.AiButton {...args} onclick={() => {}} />
  {/snippet}
</Story>

<Story name="PillWithoutShortcut">
  {#snippet template(args)}
    <AddBlock.AiButton {...args} shortcut={null} onclick={() => {}} />
  {/snippet}
</Story>

<Story name="Menu">
  {#snippet template(args)}
    <div class="w-[420px]">
      <AddBlock.AiButton {...args} label="Ask AI instead" variant="menu" onclick={() => {}} />
    </div>
  {/snippet}
</Story>
