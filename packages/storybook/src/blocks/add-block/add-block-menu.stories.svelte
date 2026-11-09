<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import ImageIcon from '@lucide/svelte/icons/image';
  import PresentationIcon from '@lucide/svelte/icons/presentation';
  import VideoIcon from '@lucide/svelte/icons/video';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import { FIELDS } from './menu-fields';

  const addChoices: AddBlock.AddBlockChoice[] = [
    { type: 'note', label: 'Note', icon: BookOpenIcon },
    { type: 'video', label: 'Video', icon: VideoIcon },
    { type: 'slide', label: 'Slides', icon: PresentationIcon },
    { type: 'document', label: 'Document', icon: FileTextIcon },
    { type: 'image', label: 'Image', icon: ImageIcon }
  ];

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
      onSelect: { control: false }
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
    <div class="mx-auto w-full max-w-lg pt-24 pb-8">
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

<Story name="TwoChoices">
  {#snippet template()}
    <div class="mx-auto w-full max-w-lg pt-24 pb-8">
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
    <div class="mx-auto w-full max-w-lg pt-24 pb-8">
      <p class="text-muted-foreground mb-6 text-sm">Last selection: {lastSelection}</p>
      <AddBlock.Menu
        open={interactiveOpen}
        choices={addChoices}
        addLabel="Add content"
        onToggle={() => (interactiveOpen = !interactiveOpen)}
        onClose={() => (interactiveOpen = false)}
        onSelect={(type) => (lastSelection = type)}
      />
    </div>
  {/snippet}
</Story>
