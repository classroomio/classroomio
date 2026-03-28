<script lang="ts">
  import TrashIcon from '@lucide/svelte/icons/trash';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { Vote } from '$features/ui';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';

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
        <UserAvatar src={comment.author?.avatarUrl} alt={comment.author?.fullname ?? 'User'} class="size-7" />

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
      <SafeHtmlContent content={comment.body ?? ''} />
    </article>
  </div>
</div>
