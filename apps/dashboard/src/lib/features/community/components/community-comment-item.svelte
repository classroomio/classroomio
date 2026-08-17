<script lang="ts">
  import TrashIcon from '@lucide/svelte/icons/trash';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { Vote } from '$features/ui';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { SafeHtmlContent } from '@cio/ui/custom/safe-html-content';
  import { ReportMenuItem } from '$features/report';
  import { t } from '$lib/utils/functions/translations';

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
    canReport?: boolean;
    upVote: () => void;
    onDelete: () => void;
  }

  let {
    comment,
    isVoted,
    isValidAnswer = false,
    isAuthorOrAdmin,
    canReport = false,
    upVote,
    onDelete
  }: Props = $props();
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

      <div class="flex items-center gap-1">
        {#if isValidAnswer}
          <CircleCheckIcon size={16} />
        {/if}

        {#if isAuthorOrAdmin || canReport}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              class="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700"
            >
              <EllipsisVerticalIcon class="size-4" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              {#if isAuthorOrAdmin}
                <DropdownMenu.Item class="text-destructive focus:text-destructive" onclick={onDelete}>
                  <TrashIcon class="mr-2 size-3.5" />
                  <span>{$t('community.delete.comment')}</span>
                </DropdownMenu.Item>
              {/if}
              {#if canReport}
                <ReportMenuItem targetType="community_answer" targetId={comment.id} />
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        {/if}
      </div>
    </header>
    <article class="prose prose-sm sm:prose p-2">
      <SafeHtmlContent content={comment.body ?? ''} />
    </article>
  </div>
</div>
