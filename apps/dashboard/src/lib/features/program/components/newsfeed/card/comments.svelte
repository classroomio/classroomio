<script lang="ts">
  import pluralize from 'pluralize';
  import UsersIcon from '@lucide/svelte/icons/users';
  import SendHorizontalIcon from '@lucide/svelte/icons/send-horizontal';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import { profile } from '$lib/utils/store/user';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { t } from '$lib/utils/functions/translations';
  import { programNewsfeedApi } from '$features/program/api';
  import { Button } from '@cio/ui/base/button';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import type { ProgramNewsfeedItem } from '$features/program/utils/types';
  import type { ProgramNewsfeedCommentsByFeedId } from '$features/program/api';

  interface Props {
    programId?: string;
    feed: ProgramNewsfeedItem;
    author: {
      id: string;
      username: string;
      fullname: string;
      avatarUrl: string;
    };
    canComment?: boolean;
    comments?: ProgramNewsfeedCommentsByFeedId;
    onAddComment: (content: string) => Promise<void> | void;
    onDeleteComment: (commentId: string | number) => void;
  }

  let { programId, feed, author, canComment = true, comments, onAddComment, onDeleteComment }: Props = $props();

  let comment = $state('');
  let isSubmitting = $state(false);
  let isBootstrapping = $state(false);
  let didBootstrap = $state(false);

  const pageSize = 5;
  let visibleCount = $state(1);

  const loadedCount = $derived((comments?.items?.length ?? 0) as number);
  const totalCount = $derived(comments?.totalCount || feed.commentCount);
  const isLoading = $derived((comments?.isLoading ?? false) as boolean);
  const shownCount = $derived(Math.min(visibleCount, loadedCount));

  const bootstrap = async () => {
    if (!programId || !comments) return;
    if (didBootstrap) return;

    didBootstrap = true;
    isBootstrapping = true;

    try {
      await programNewsfeedApi.getComments(programId, feed.id);
    } finally {
      isBootstrapping = false;
    }
  };

  const submitComment = async () => {
    if (isSubmitting) return;

    isSubmitting = true;

    try {
      await onAddComment(comment);
      comment = '';
    } finally {
      isSubmitting = false;
    }
  };

  const handleAddNewComment = async (event: KeyboardEvent | MouseEvent) => {
    if (isSubmitting) return;

    const maybeKey = event as KeyboardEvent & { key?: string };
    if (maybeKey.key !== 'Enter' && event.type !== 'click') {
      return;
    }

    event.preventDefault();
    await submitComment();
  };

  const showMore = async () => {
    if (!comments) {
      return;
    }

    if (!didBootstrap) {
      await bootstrap();
    }

    visibleCount = visibleCount <= 1 ? pageSize : visibleCount + pageSize;
  };

  const minimize = () => {
    visibleCount = visibleCount > 1 ? 1 : shownCount;
  };

  const toggleComments = async () => {
    if (totalCount === shownCount) {
      minimize();
      return;
    }

    await showMore();
  };
</script>

<section class="border-t border-gray-200 p-3">
  <div class="flex w-full items-center justify-between">
    <Button
      variant="ghost"
      size="sm"
      onclick={toggleComments}
      loading={isBootstrapping || isLoading}
      class="justify-start"
    >
      <UsersIcon size={16} />
      <p class="py-2 text-sm">{pluralize($t('programs.newsfeed.comments.comment'), totalCount, true)}</p>

      {#if totalCount > shownCount}
        <span class="ml-auto text-xs text-gray-600">
          {$t('programs.newsfeed.comments.showing_of', { shown: shownCount, total: totalCount })}
        </span>
      {/if}
    </Button>

    {#if shownCount > 1}
      <Button variant="ghost" size="sm" onclick={minimize}>
        <span class="ml-auto text-xs text-gray-600">{$t('programs.newsfeed.comments.hide')}</span>
      </Button>
    {/if}
  </div>

  <div>
    {#if comments}
      {#each comments.items.slice(0, shownCount) as commentItem (commentItem.id)}
        {#if commentItem.content}
          <div class="group flex items-center justify-between py-2">
            <span class="flex items-center gap-3">
              <div class="h-9 w-9">
                <img
                  src={commentItem.authorAvatarUrl || ''}
                  alt={$t('programs.newsfeed.user_avatar_alt')}
                  class="h-full w-full rounded-full object-cover"
                />
              </div>
              <span>
                <div class="flex items-center gap-2">
                  <p class="text-sm font-medium capitalize">{commentItem.authorFullname || ''}</p>
                  <p class="text-xs font-medium text-gray-600">{calDateDiff(commentItem.createdAt)}</p>
                </div>
                <p>{commentItem.content}</p>
              </span>
            </span>

            {#if commentItem.authorProfileId === $profile.id || $isOrgAdmin}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger
                  class="hidden h-8 w-8 items-center justify-center rounded-md group-hover:flex hover:bg-gray-100 dark:hover:bg-neutral-700"
                >
                  <EllipsisVerticalIcon class="h-5 w-5" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Item class="text-red-600" onclick={() => onDeleteComment(commentItem.id)}>
                    {$t('programs.newsfeed.comments.delete')}
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            {/if}
          </div>
        {/if}
      {/each}
    {/if}
  </div>

  {#if canComment}
    <div class="flex items-center justify-between gap-2">
      <UserAvatar src={author.avatarUrl} alt={$t('programs.newsfeed.user_avatar_alt')} class="size-7" />
      <div class="flex-1">
        <input
          type="text"
          bind:value={comment}
          onkeydown={handleAddNewComment}
          placeholder={$t('programs.newsfeed.comments.placeholder')}
          class="w-full rounded-3xl border border-gray-200 bg-transparent p-1 pl-2 text-sm disabled:opacity-50"
          disabled={isSubmitting}
          required
        />
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        class="rounded-full"
        loading={isSubmitting}
        onclick={handleAddNewComment}
        aria-label={$t('programs.newsfeed.comments.submit_aria')}
      >
        <SendHorizontalIcon size={16} />
      </Button>
    </div>
  {/if}
</section>
