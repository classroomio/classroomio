<script module lang="ts">
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';
  import { Button } from '@cio/ui/base/button';
  import { ChecklistItem } from '@cio/ui/custom/checklist-item';
  import { FIELDS } from './fields';

  const { Story } = defineMeta({
    title: 'Molecules/ChecklistItem',
    component: ChecklistItem,
    parameters: {
      layout: 'centered',
      controls: {
        include: FIELDS
      }
    },
    tags: ['autodocs'],
    argTypes: {
      onclick: { control: false },
      media: { control: false },
      action: { control: false }
    }
  });

  let isInviteOpened = $state(false);
</script>

{#snippet courseIcon()}
  <BookOpenIcon class="size-5 text-gray-600" />
{/snippet}

{#snippet todoButton()}
  <Button variant="outline" size="sm">
    Todo
    <ChevronRightIcon class="ml-2 size-4" />
  </Button>
{/snippet}

<Story name="Open">
  {#snippet template()}
    <div class="w-[560px]">
      <ChecklistItem
        title="Create a course"
        description="Add your first course to start teaching."
        doneLabel="Done"
        media={courseIcon}
        action={todoButton}
        onclick={() => {}}
      />
    </div>
  {/snippet}
</Story>

<Story name="Completed">
  {#snippet template()}
    <div class="w-[560px]">
      <ChecklistItem
        title="Create a course"
        description="Add your first course to start teaching."
        doneLabel="Done"
        completed
        media={courseIcon}
        action={todoButton}
        onclick={() => {}}
      />
    </div>
  {/snippet}
</Story>

<Story name="Title only, not clickable">
  {#snippet template()}
    <div class="w-[560px]">
      <ChecklistItem title="Invite your team" doneLabel="Done" action={todoButton} />
    </div>
  {/snippet}
</Story>

<Story name="Numbered steps">
  {#snippet template()}
    <ol class="flex w-[560px] flex-col gap-3">
      <li>
        <ChecklistItem
          title="Accept the invite"
          description="Opening the invite marks this step done."
          doneLabel="Done"
          completed={isInviteOpened}
        >
          {#snippet media()}
            <span class="text-xs font-semibold">1</span>
          {/snippet}
          {#snippet action()}
            <Button variant="secondary" size="sm" onclick={() => (isInviteOpened = true)}>Open the invite</Button>
          {/snippet}
        </ChecklistItem>
      </li>
      <li>
        <ChecklistItem title="Continue" description="Enabled once step 1 is done." doneLabel="Done">
          {#snippet media()}
            <span class="text-xs font-semibold">2</span>
          {/snippet}
          {#snippet action()}
            <Button size="sm" disabled={!isInviteOpened}>Continue</Button>
          {/snippet}
        </ChecklistItem>
      </li>
    </ol>
  {/snippet}
</Story>
