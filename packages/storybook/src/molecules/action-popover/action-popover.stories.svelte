<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import { ActionPopover } from '@cio/ui/custom/action-popover';
  import { Button } from '@cio/ui/base/button';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/ActionPopover',
    component: ActionPopover,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  const sampleGroups = [
    {
      id: 'g1',
      name: 'Subject',
      tags: [
        { id: 't1', name: 'Design', color: '#8b5cf6' },
        { id: 't2', name: 'Engineering', color: '#06b6d4' }
      ]
    },
    {
      id: 'g2',
      name: 'Level',
      tags: [
        { id: 't3', name: 'Beginner', color: '#22c55e' },
        { id: 't4', name: 'Advanced', color: '#ef4444' }
      ]
    }
  ];

  let selectedTagIds = $state<string[]>(['t1']);
  let tagSearchQuery = $state('');

  const sampleTags = [
    { id: 't1', name: 'Design', color: '#8b5cf6' },
    { id: 't2', name: 'Engineering', color: '#06b6d4' },
    { id: 't3', name: 'Beginner', color: '#22c55e' },
    { id: 't4', name: 'Advanced', color: '#ef4444' }
  ];

  const visibleSampleTags = $derived(
    tagSearchQuery.trim()
      ? sampleTags.filter((tag) => tag.name.toLowerCase().includes(tagSearchQuery.trim().toLowerCase()))
      : sampleTags
  );

  function toggleTag(tagId: string) {
    if (selectedTagIds.includes(tagId)) {
      selectedTagIds = selectedTagIds.filter((id) => id !== tagId);

      return;
    }

    selectedTagIds = [...selectedTagIds, tagId];
  }

  async function fakeSave() {
    await new Promise((resolve) => setTimeout(resolve, 800));
  }
</script>

<Story name="Default">
  {#snippet template()}
    <div class="p-24">
      <ActionPopover title="Tags" buttonText="Create tag" onAction={() => alert('Create tag clicked')}>
        <div class="space-y-4">
          {#each sampleGroups as group (group.id)}
            <div class="space-y-2">
              <p class="text-muted-foreground text-xs font-semibold uppercase">{group.name}</p>
              <div class="flex flex-wrap gap-2">
                {#each group.tags as tag (tag.id)}
                  <Button
                    size="sm"
                    variant={selectedTagIds.includes(tag.id) ? 'secondary' : 'outline'}
                    onclick={() => toggleTag(tag.id)}
                  >
                    <span
                      class="inline-block h-2 w-2 rounded-full border"
                      style={`background-color: ${tag.color}`}
                      aria-hidden="true"
                    ></span>
                    <span>{tag.name}</span>
                  </Button>
                {/each}
              </div>
            </div>
          {/each}
        </div>
      </ActionPopover>
    </div>
  {/snippet}
</Story>

<Story name="Custom Trigger">
  {#snippet template()}
    <div class="p-24">
      <ActionPopover buttonText="Create tag group" onAction={() => alert('Create tag group clicked')}>
        {#snippet trigger({ props })}
          <Button {...props} type="button" variant="outline" class="w-56 justify-start">
            {selectedTagIds.length ? `${selectedTagIds.length} selected` : 'Pick tags'}
          </Button>
        {/snippet}

        <div class="space-y-2">
          {#each sampleGroups[0].tags as tag (tag.id)}
            <Button
              variant={selectedTagIds.includes(tag.id) ? 'secondary' : 'ghost'}
              class="w-full justify-start"
              onclick={() => toggleTag(tag.id)}
            >
              <span
                class="inline-block h-2 w-2 rounded-full border"
                style={`background-color: ${tag.color}`}
                aria-hidden="true"
              ></span>
              {tag.name}
            </Button>
          {/each}
        </div>
      </ActionPopover>
    </div>
  {/snippet}
</Story>

<Story name="Without Title">
  {#snippet template()}
    <div class="p-24">
      <ActionPopover buttonText="Add all" onAction={() => alert('Added')}>
        <p class="text-sm">No heading here — the scrollable body starts right away.</p>
      </ActionPopover>
    </div>
  {/snippet}
</Story>

<Story name="With Search">
  {#snippet template()}
    <div class="p-24">
      <ActionPopover
        title="Tags"
        searchPlaceholder="Search tags…"
        bind:searchQuery={tagSearchQuery}
        buttonText="Create tag"
        onAction={() => alert('Create tag clicked')}
      >
        <div class="space-y-2">
          {#each visibleSampleTags as tag (tag.id)}
            <Button variant={selectedTagIds.includes(tag.id) ? 'secondary' : 'ghost'} onclick={() => toggleTag(tag.id)}>
              <span
                class="inline-block h-2 w-2 rounded-full border"
                style={`background-color: ${tag.color}`}
                aria-hidden="true"
              ></span>
              {tag.name}
            </Button>
          {/each}
          {#if !visibleSampleTags.length}
            <p class="text-muted-foreground text-sm">No tags match your search.</p>
          {/if}
        </div>
      </ActionPopover>
      <p class="mt-4 text-sm text-gray-500">Query: "{tagSearchQuery}"</p>
    </div>
  {/snippet}
</Story>

<Story name="Search Without Title">
  {#snippet template()}
    <div class="p-24">
      <ActionPopover searchPlaceholder="Filter groups…" buttonText="Done" onAction={() => alert('Done')}>
        <p class="text-sm">The search bar works on its own — no title required.</p>
      </ActionPopover>
    </div>
  {/snippet}
</Story>

<Story name="Async Action (loading)">
  {#snippet template()}
    <div class="p-24">
      <ActionPopover title="Sync" buttonText="Sync now" onAction={fakeSave}>
        <p class="text-sm">The footer button shows a spinner while the async action runs, then the popover closes.</p>
      </ActionPopover>
    </div>
  {/snippet}
</Story>

<Story name="Disabled Button">
  {#snippet template()}
    <div class="p-24">
      <ActionPopover title="Invite" buttonText="Send invite" buttonDisabled onAction={() => alert('Sent')}>
        <p class="text-sm">The action is disabled until the consumer enables it.</p>
      </ActionPopover>
    </div>
  {/snippet}
</Story>

<Story name="Stays Open After Action">
  {#snippet template()}
    <div class="p-24">
      <ActionPopover
        title="Multi pick"
        buttonText="Add another"
        closeOnAction={false}
        onAction={() => alert('Kept open')}
      >
        <p class="text-sm">With <code>closeOnAction</code> off, the popover stays open after acting.</p>
      </ActionPopover>
    </div>
  {/snippet}
</Story>

<Story name="No Footer (buttonText omitted)">
  {#snippet template()}
    <div class="p-24">
      <ActionPopover title="Plain popover">
        <p class="text-sm">Omitting <code>buttonText</code> renders no footer at all.</p>
      </ActionPopover>
    </div>
  {/snippet}
</Story>
