<script lang="ts">
  import pluralize from 'pluralize';
  import UsersIcon from '@lucide/svelte/icons/users';
  import SendHorizontalIcon from '@lucide/svelte/icons/send-horizontal';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';

  import { profile } from '$lib/utils/store/user';
  import { isOrgAdmin } from '$lib/utils/store/org';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { newsfeedApi } from '$features/course/api';

  import { Button } from '@cio/ui/base/button';
  import type { Feed } from '$features/course/utils/types';
  import type { NewsfeedCommentsByFeedId } from '$features/course/api';

  interface Props {
    courseId?: string;
    feed: Feed;
    author: {
      id: string;
      username: string;
      fullname: string;
      avatarUrl: string;
    };
    comments?: NewsfeedCommentsByFeedId;
    onAddComment: (content: string) => Promise<void> | void;
    onDeleteComment: (commentId: string | number) => void;
  }

  let { courseId, feed, author, comments, onAddComment, onDeleteComment }: Props = $props();

  let comment = $state('');
  let errors: { newComment: string } = $state({ newComment: '' });
  let isSubmitting = $state(false);
  let isBootstrapping = $state(false);
  let didBootstrap = $state(false);

  // Pagination / progressive reveal (newest-first)
  const PAGE_SIZE = 5;
  let visibleCount = $state(1);

  const loadedCount = $derived((comments?.items?.length ?? 0) as number);
  const totalCount = $derived(comments?.totalCount || feed.commentCount);
  const isLoading = $derived((comments?.isLoading ?? false) as boolean);
  const shownCount = $derived(Math.min(visibleCount, loadedCount));

  // Fetch the minimum info needed to:
  // - know totalCount
  // - show the latest comment (1) by default
  const bootstrap = async () => {
    if (!courseId || !comments) return;
    if (didBootstrap) return;

    didBootstrap = true;
    isBootstrapping = true;
    try {
      await newsfeedApi.getComments(courseId, feed.id, PAGE_SIZE);
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
    if (maybeKey.key === 'Enter' || event.type === 'click') {
      event.preventDefault();
      await submitComment();
    }
  };

  const ensureLoaded = async (targetVisible: number) => {
    if (!courseId || !comments) return;

    const target = Math.min(targetVisible, comments.totalCount);

    // Load pages until we have enough locally to render `target` items.
    while (comments.hasMore && comments.items.length < target && !comments.isLoading) {
      await newsfeedApi.loadMoreComments(courseId, feed.id, PAGE_SIZE);
    }
  };

  const showMore = async () => {
    if (!courseId || !comments) return;

    // Ensure we know totalCount and have at least 1 comment (if it exists).
    if (!didBootstrap) {
      await bootstrap();
    }

    const next = visibleCount <= 1 ? PAGE_SIZE : visibleCount + PAGE_SIZE;
    visibleCount = next;
    await ensureLoaded(next);
  };

  const minimize = () => {
    visibleCount = visibleCount > 1 ? 1 : shownCount;
  };

  const toggleComments = async () => {
    // If already showing more than the latest comment, collapse back to 1.
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
      <p class="py-2 text-sm">{pluralize('comment', totalCount, true)}</p>

      {#if totalCount > shownCount}
        <span class="ml-auto text-xs text-gray-600">Showing {shownCount} of {totalCount}</span>
      {/if}
    </Button>

    {#if shownCount > 1}
      <Button variant="ghost" size="sm" onclick={minimize}>
        <span class="ml-auto text-xs text-gray-600">Hide comments</span>
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
                  alt="users banner"
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
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            {/if}
          </div>
        {/if}
      {/each}
    {/if}
  </div>

  <!-- Input for new comment -->
  <div class="flex items-center justify-between gap-2">
    <div class="h-7 w-7">
      <img src={author.avatarUrl} alt="users banner" class="h-full w-full rounded-full object-cover" />
    </div>
    <div class="flex-1">
      <input
        type="text"
        bind:value={comment}
        onkeydown={handleAddNewComment}
        placeholder="Add class comment"
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
      aria-label="Submit comment"
    >
      <SendHorizontalIcon size={16} />
    </Button>
  </div>

  {#if errors?.newComment}
    <p class="text-sm text-red-500">{errors?.newComment}</p>
  {/if}
</section>
