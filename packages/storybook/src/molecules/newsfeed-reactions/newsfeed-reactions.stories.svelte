<script module>
  import { defineMeta } from '@storybook/addon-svelte-csf';
  import {
    NewsfeedReactions,
    type NewsfeedReactionCounts,
    type NewsfeedReactionType
  } from '@cio/ui/custom/newsfeed-reactions';

  const { Story } = defineMeta({
    title: 'Molecules/NewsfeedReactions',
    component: NewsfeedReactions,
    parameters: {
      layout: 'centered'
    },
    tags: ['autodocs']
  });
</script>

<script lang="ts">
  let summaryReactionCounts = $state<NewsfeedReactionCounts>({
    clap: 12,
    smile: 4,
    thumbsup: 8,
    thumbsdown: 1
  });
  let summarySelectedReaction = $state<NewsfeedReactionType | null>('smile');

  let openReactionCounts = $state<NewsfeedReactionCounts>({
    clap: 6,
    smile: 3,
    thumbsup: 5,
    thumbsdown: 2
  });
  let openSelectedReaction = $state<NewsfeedReactionType | null>('clap');
  let openPopover = $state(true);

  let interactiveReactionCounts = $state<NewsfeedReactionCounts>({
    clap: 2,
    smile: 7,
    thumbsup: 1
  });
  let interactiveSelectedReaction = $state<NewsfeedReactionType | null>('smile');
  let interactivePopover = $state(false);

  function updateCounts(
    reactionCounts: NewsfeedReactionCounts,
    nextReactionType: NewsfeedReactionType,
    currentReactionType: NewsfeedReactionType | null
  ) {
    const nextCounts: NewsfeedReactionCounts = {
      clap: reactionCounts.clap ?? 0,
      smile: reactionCounts.smile ?? 0,
      thumbsup: reactionCounts.thumbsup ?? 0,
      thumbsdown: reactionCounts.thumbsdown ?? 0
    };

    if (currentReactionType === nextReactionType) {
      nextCounts[nextReactionType] = Math.max(0, (nextCounts[nextReactionType] ?? 0) - 1);
      return nextCounts;
    }

    if (currentReactionType) {
      nextCounts[currentReactionType] = Math.max(0, (nextCounts[currentReactionType] ?? 0) - 1);
    }

    nextCounts[nextReactionType] = (nextCounts[nextReactionType] ?? 0) + 1;
    return nextCounts;
  }
</script>

<Story name="Summary">
  {#snippet template()}
    <div class="ui:w-[360px] ui:rounded-2xl ui:border ui:bg-background ui:p-4">
      <NewsfeedReactions reactionCounts={summaryReactionCounts} selectedReactionType={summarySelectedReaction} />
    </div>
  {/snippet}
</Story>

<Story name="Popover Open">
  {#snippet template()}
    <div class="ui:w-[360px] ui:rounded-2xl ui:border ui:bg-background ui:p-4">
      <NewsfeedReactions
        bind:open={openPopover}
        reactionCounts={openReactionCounts}
        selectedReactionType={openSelectedReaction}
      />
    </div>
  {/snippet}
</Story>

<Story name="Interactive">
  {#snippet template()}
    <div class="ui:w-[360px] ui:rounded-2xl ui:border ui:bg-background ui:p-4">
      <NewsfeedReactions
        bind:open={interactivePopover}
        reactionCounts={interactiveReactionCounts}
        selectedReactionType={interactiveSelectedReaction}
        onReactionToggle={(reactionType) => {
          interactiveReactionCounts = updateCounts(
            interactiveReactionCounts,
            reactionType,
            interactiveSelectedReaction
          );
          interactiveSelectedReaction = interactiveSelectedReaction === reactionType ? null : reactionType;
        }}
      />
      <p class="ui:mt-3 ui:text-sm ui:text-muted-foreground">
        Click the trigger, pick a reaction, then click the active reaction again to clear it.
      </p>
    </div>
  {/snippet}
</Story>
