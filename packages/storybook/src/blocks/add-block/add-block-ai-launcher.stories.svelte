<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import { AI_SHORTCUT } from './choices';
  import { FIELDS } from './ai-launcher-fields';

  const { Story } = defineMeta({
    title: 'Blocks/AddBlock/AiLauncher',
    component: AddBlock.AiLauncher,
    args: {
      label: 'Ask AI',
      panelLabel: 'Draft a note with AI',
      shortcut: AI_SHORTCUT,
      open: false
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onOpen: { control: false },
      panel: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let interactiveOpen = $state(false);
</script>

{#snippet promptPanel()}
  <div class="flex w-full items-center gap-2 text-sm">
    <span class="flex-1 text-gray-500">e.g. A short introduction to the water cycle for beginners</span>
    <button type="button" class="rounded px-2 py-1 text-xs" onclick={() => (interactiveOpen = false)}>Close</button>
  </div>
{/snippet}

<Story name="Closed">
  {#snippet template(args)}
    <div class="flex w-full justify-center">
      <AddBlock.AiLauncher {...args} onOpen={() => {}} panel={promptPanel} />
    </div>
  {/snippet}
</Story>

<Story name="WithoutShortcut">
  {#snippet template(args)}
    <div class="flex w-full justify-center">
      <AddBlock.AiLauncher {...args} shortcut={null} onOpen={() => {}} panel={promptPanel} />
    </div>
  {/snippet}
</Story>

<Story name="Interactive">
  {#snippet template(args)}
    <div class="flex w-full justify-center">
      <AddBlock.AiLauncher
        {...args}
        open={interactiveOpen}
        onOpen={() => (interactiveOpen = true)}
        panel={promptPanel}
      />
    </div>
  {/snippet}
</Story>
