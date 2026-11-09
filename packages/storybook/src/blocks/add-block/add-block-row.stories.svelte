<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import FileTextIcon from '@lucide/svelte/icons/file-text';
  import ImageIcon from '@lucide/svelte/icons/image';
  import PresentationIcon from '@lucide/svelte/icons/presentation';
  import SparklesIcon from '@lucide/svelte/icons/sparkles';
  import VideoIcon from '@lucide/svelte/icons/video';
  import XIcon from '@lucide/svelte/icons/x';
  import { Button } from '@cio/ui/base/button';
  import { Input } from '@cio/ui/base/input';
  import * as AddBlock from '@cio/ui/custom/add-block';
  import { FIELDS } from './row-fields';

  const addChoices: AddBlock.AddBlockChoice[] = [
    { type: 'note', label: 'Note', icon: BookOpenIcon },
    { type: 'video', label: 'Video', icon: VideoIcon },
    { type: 'slide', label: 'Slides', icon: PresentationIcon },
    { type: 'document', label: 'Document', icon: FileTextIcon },
    { type: 'image', label: 'Image', icon: ImageIcon }
  ];

  const macShortcut: AddBlock.AddBlockShortcut = { modifier: '⌘', key: 'J' };

  const { Story } = defineMeta({
    title: 'Blocks/AddBlock/Row',
    component: AddBlock.Row,
    args: {
      choices: addChoices,
      addLabel: 'Add content',
      aiLabel: 'Ask AI',
      showAi: true
    },
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    argTypes: {
      aiShortcut: { control: false },
      onSelect: { control: false },
      onAiTrigger: { control: false },
      aiPanel: { control: false }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let interactiveOpen = $state(false);
</script>

<Story name="Default">
  {#snippet template()}
    <div class="mx-auto w-full max-w-xl">
      <AddBlock.Row
        choices={addChoices}
        addLabel="Add content"
        aiLabel="Ask AI"
        aiPanelLabel="Generate content with AI"
        onSelect={(type) => console.log('add', type)}
      />
    </div>
  {/snippet}
</Story>

<Story name="WithShortcut">
  {#snippet template()}
    <div class="mx-auto w-full max-w-xl">
      <AddBlock.Row
        choices={addChoices}
        addLabel="Add content"
        aiLabel="Ask AI"
        aiShortcut={macShortcut}
        onSelect={(type) => console.log('add', type)}
      />
    </div>
  {/snippet}
</Story>

<Story name="WithoutAi">
  {#snippet template()}
    <div class="mx-auto w-full max-w-xl">
      <AddBlock.Row
        choices={addChoices}
        addLabel="Add content"
        showAi={false}
        onSelect={(type) => console.log('add', type)}
      />
    </div>
  {/snippet}
</Story>

<Story name="AiPanelOpen">
  {#snippet template()}
    <div class="mx-auto w-full max-w-xl">
      <AddBlock.Row
        choices={addChoices}
        addLabel="Add content"
        aiLabel="Ask AI"
        aiPanelLabel="Ask AI to add content"
        aiOpen={true}
        onSelect={(type) => console.log('add', type)}
        onAiTrigger={() => {}}
      >
        {#snippet aiPanel()}
          <div class="flex w-full items-center gap-2">
            <SparklesIcon size={14} class="text-muted-foreground shrink-0" />
            <Input
              class="ui:border-transparent ui:bg-transparent ui:shadow-none h-7 px-0 text-[13px] focus-visible:border-transparent focus-visible:ring-0"
              placeholder="e.g. A short introduction to the water cycle for beginners"
              aria-label="Prompt"
            />
            <Button variant="secondary" size="icon-xs" class="shrink-0" aria-label="Close AI" title="Close AI">
              <XIcon size={14} />
            </Button>
          </div>
        {/snippet}
      </AddBlock.Row>
    </div>
  {/snippet}
</Story>

<Story name="Interactive">
  {#snippet template()}
    <div class="mx-auto w-full max-w-xl">
      <AddBlock.Row
        choices={addChoices}
        addLabel="Add content"
        aiLabel="Ask AI"
        aiPanelLabel="Ask AI to add content"
        aiOpen={interactiveOpen}
        onSelect={(type) => console.log('add', type)}
        onAiTrigger={() => (interactiveOpen = !interactiveOpen)}
      >
        {#snippet aiPanel()}
          <div class="flex w-full items-center gap-2">
            <SparklesIcon size={14} class="text-muted-foreground shrink-0" />
            <Input
              class="ui:border-transparent ui:bg-transparent ui:shadow-none h-7 px-0 text-[13px] focus-visible:border-transparent focus-visible:ring-0"
              placeholder="e.g. A short introduction to the water cycle for beginners"
              aria-label="Prompt"
            />
            <Button
              variant="secondary"
              size="icon-xs"
              class="shrink-0"
              aria-label="Close AI"
              title="Close AI"
              onclick={() => (interactiveOpen = false)}
            >
              <XIcon size={14} />
            </Button>
          </div>
        {/snippet}
      </AddBlock.Row>
    </div>
  {/snippet}
</Story>
