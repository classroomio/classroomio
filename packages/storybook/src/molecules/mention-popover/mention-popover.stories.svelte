<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { MentionPopover } from '@cio/ui';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/MentionPopover',
    component: MentionPopover,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });

  const sampleItems = [
    { id: '1', label: 'Introduction to Programming', type: 'lesson' },
    { id: '2', label: 'Variables and Data Types', type: 'lesson' },
    { id: '3', label: 'Quiz: Variables', type: 'exercise' },
    { id: '4', label: 'Control Flow', type: 'lesson' },
    { id: '5', label: 'Practice: Loops', type: 'exercise' },
    { id: '6', label: 'Functions and Scope', type: 'lesson' },
    { id: '7', label: 'Final Assessment', type: 'exercise' }
  ];
</script>

<script lang="ts">
  import { LessonIcon, ExerciseIcon } from '@cio/ui/custom/moving-icons';

  let lastSelected = $state('');
</script>

<Story name="Default">
  {#snippet template()}
    <MentionPopover
      items={sampleItems}
      query=""
      selectedIndex={0}
      onSelect={(item) => (lastSelected = item.label)}
      typeLabel={(item) => (item.type === 'exercise' ? 'Exercise' : 'Lesson')}
    >
      {#snippet icon({ item })}
        {#if item.type === 'exercise'}
          <ExerciseIcon size={14} />
        {:else}
          <LessonIcon size={14} />
        {/if}
      {/snippet}
    </MentionPopover>
    {#if lastSelected}
      <p class="ui:mt-3 ui:text-muted-foreground ui:text-sm">Selected: {lastSelected}</p>
    {/if}
  {/snippet}
</Story>

<Story name="Filtered with Highlight">
  {#snippet template()}
    <MentionPopover
      items={sampleItems}
      query="Quiz"
      selectedIndex={0}
      onSelect={(item) => (lastSelected = item.label)}
      typeLabel={(item) => (item.type === 'exercise' ? 'Exercise' : 'Lesson')}
    >
      {#snippet icon({ item })}
        {#if item.type === 'exercise'}
          <ExerciseIcon size={14} />
        {:else}
          <LessonIcon size={14} />
        {/if}
      {/snippet}
    </MentionPopover>
  {/snippet}
</Story>

<Story name="No Results">
  {#snippet template()}
    <MentionPopover
      items={sampleItems}
      query="zzzzz"
      selectedIndex={0}
      onSelect={() => {}}
      emptyMessage="No matching content"
    />
  {/snippet}
</Story>

<Story name="Without Icons or Type Labels">
  {#snippet template()}
    <MentionPopover items={sampleItems} query="" selectedIndex={2} onSelect={(item) => (lastSelected = item.label)} />
  {/snippet}
</Story>
