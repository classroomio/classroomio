<script lang="ts">
  import * as Avatar from '@cio/ui/base/avatar';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { shortenName } from '$lib/utils/functions/string';
  import { Vote } from '$features/ui';
  import { CircleCheckIcon } from '$features/ui/icons';

  interface CommentAuthor {
    id: number | string | null;
    fullname?: string | null;
    avatarUrl?: string | null;
  }

  interface CommentItem {
    id: string;
    votes?: number | null;
    body: string | null;
    createdAt?: string | null;
    author?: CommentAuthor | null;
  }

  interface Props {
    comment: CommentItem;
    isVoted?: boolean | null;
    isValidAnswer?: boolean;
    isAuthorOrAdmin: boolean;
    upVote: () => void;
    onDelete: () => void;
  }

  let { comment, isVoted, isValidAnswer = false, isAuthorOrAdmin, upVote, onDelete }: Props = $props();
</script>

<div class="flex items-start px-1">
  <Vote value={comment.votes ?? 0} {upVote} disabled={isVoted ?? false} />
  <div class="border-gray w-full rounded-lg border">
    <header class="flex items-center justify-between p-2 leading-none">
      <div class="flex items-center text-black">
        <Avatar.Root class="size-7">
          <Avatar.Image
            src={comment.author?.avatarUrl ? comment.author.avatarUrl : '/logo-192.png'}
            alt={comment.author?.fullname ? comment.author.fullname : 'User'}
          />
          <Avatar.Fallback>{shortenName(comment.author?.fullname) || 'U'}</Avatar.Fallback>
        </Avatar.Root>

        <p class="ml-2 text-sm dark:text-white">{comment.author?.fullname}</p>

        <p class="ui:text-muted-foreground ml-2 text-sm">
          {comment.createdAt ? calDateDiff(comment.createdAt) : ''}
        </p>
      </div>

      {#if isValidAnswer}
        <CircleCheckIcon size={16} />
      {/if}

      {#if isAuthorOrAdmin}
        <IconButton onclick={onDelete}>
          <TrashIcon size={16} />
        </IconButton>
      {/if}
    </header>
    <article class="prose prose-sm sm:prose p-2">
      {comment.body}
    </article>
  </div>
</div>
