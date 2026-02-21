<script lang="ts">
  import { Button } from '@cio/ui/base/button';
  import type { Feed } from '$features/course/utils/types';

  interface Props {
    feed: Feed;
    authorId: string;
    isReacting?: boolean;
    onReact: (reactionType: string) => void;
  }

  let { feed, authorId, isReacting = false, onReact }: Props = $props();

  const reactions: Record<string, string> = {
    smile: '😀',
    thumbsup: '👍',
    thumbsdown: '👎',
    clap: '👏'
  };
</script>

<!-- Reactions -->
<div class="flex items-center gap-4 px-3">
  <div class="flex items-center gap-1">
    {#each Object.keys(feed.reaction || {}) as reactionType}
      {#if reactions[reactionType]}
        {@const isAuthorReacted = (feed.reaction?.[reactionType] || []).includes(authorId)}
        <Button
          variant={isAuthorReacted ? 'light-default' : 'ghost'}
          size="icon-sm"
          class="size-unset! px-5! py-0!"
          disabled={isReacting}
          onclick={() => onReact(reactionType)}
        >
          {reactions[reactionType]}
          {#if feed.reaction?.[reactionType]?.length >= 1}
            <span class="text-xs">{feed.reaction?.[reactionType]?.length}</span>
          {/if}
        </Button>
      {/if}
    {/each}
  </div>
</div>
