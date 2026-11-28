<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import { AI_SHORTCUT, ALL_CHOICES } from './choices';
  import { FIELDS } from './menu-fields';

  const addChoices = ALL_CHOICES;

  const { Story } = defineMeta({
    title: 'Blocks/AddBlock/Menu',
    component: AddBlock.Menu,
    args: {
      open: false,
      choices: addChoices,
      addLabel: 'Add content'
    },
    parameters: {
      layout: 'padded',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      onToggle: { control: false },
      onClose: { control: false },
      onSelect: { control: false },
      onAi: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let interactiveOpen = $state(false);
  let lastSelection = $state('none');
</script>

<Story name="Idle">
  {#snippet template()}
    <div class="mx-auto w-full max-w-lg pb-24">
      <p class="text-muted-foreground mb-6 text-sm">
        Resting state. The rule and the plus stay hidden until the row is hovered or focused.
      </p>
      <AddBlock.Menu
        open={false}
        choices={addChoices}
        addLabel="Add content"
        onToggle={() => {}}
        onClose={() => {}}
        onSelect={() => {}}
      />
    </div>
  {/snippet}
</Story>

<Story name="Open">
  {#snippet template()}
    <div class="mx-auto w-full max-w-lg pt-56 pb-8">
      <AddBlock.Menu
        open={true}
        choices={addChoices}
        addLabel="Add content"
        onToggle={() => {}}
        onClose={() => {}}
        onSelect={(type) => console.log('add', type)}
      />
    </div>
  {/snippet}
</Story>

<Story name="OpenWithAskAi">
  {#snippet template()}
    <div class="mx-auto w-full max-w-lg pt-64 pb-8">
      <AddBlock.Menu
        open={true}
        choices={addChoices}
        addLabel="Add content"
        aiLabel="Ask AI instead"
        aiShortcut={AI_SHORTCUT}
        onToggle={() => {}}
        onClose={() => {}}
        onSelect={(type) => console.log('add', type)}
        onAi={() => console.log('ask ai')}
      />
    </div>
  {/snippet}
</Story>

<Story name="TwoChoices">
  {#snippet template()}
    <div class="mx-auto w-full max-w-lg pt-56 pb-8">
      <AddBlock.Menu
        open={true}
        choices={addChoices.slice(0, 2)}
        addLabel="Add content"
        onToggle={() => {}}
        onClose={() => {}}
        onSelect={(type) => console.log('add', type)}
      />
    </div>
  {/snippet}
</Story>

<Story name="Interactive">
  {#snippet template()}
    <div class="mx-auto w-full max-w-lg pt-56 pb-8">
      <p class="text-muted-foreground mb-6 text-sm">Last selection: {lastSelection}</p>
      <AddBlock.Menu
        open={interactiveOpen}
        choices={addChoices}
        addLabel="Add content"
        onToggle={() => (interactiveOpen = !interactiveOpen)}
        onClose={() => (interactiveOpen = false)}
        aiLabel="Ask AI instead"
        aiShortcut={AI_SHORTCUT}
        onSelect={(type) => (lastSelection = type)}
        onAi={() => (lastSelection = 'ask ai')}
      />
    </div>
  {/snippet}
</Story>
