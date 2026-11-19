<script lang="ts">
  import { untrack } from 'svelte';
  import { SvelteSet } from 'svelte/reactivity';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import * as Sheet from '@cio/ui/base/sheet';
  import EllipsisIcon from '@lucide/svelte/icons/ellipsis';
  import { UserAvatar } from '@cio/ui/custom/user-avatar';
  import { Textarea } from '@cio/ui/base/textarea';
  import { DeleteModal } from '$features/ui';
  import { Button } from '@cio/ui/base/button';

  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { lessonApi } from '$features/course/api';
  import { courseApi } from '$features/course/api';
  import { ReportMenuItem } from '$features/report';
  import { COMMENT_PREVIEW_COUNT, isLongComment } from '$features/course/utils/comment-utils';

  interface Props {
    lessonId: string;
  }

  let { lessonId }: Props = $props();

  const borderlessTextareaClass =
    'min-h-12 resize-none rounded-none border-0 bg-transparent px-0 py-1 text-[15px] leading-7 shadow-none md:text-[15px] focus-visible:ring-0 dark:bg-transparent';

  let comment = $state('');
  let isComposing = $state(false);
  let isDrawerOpen = $state(false);
  let openDeleteModal = $state(false);
  let deleteCommentId: number | null = $state(null);
  let editCommentId: number | null = $state(null);
  let editingText = $state('');
  const expandedCommentIds = new SvelteSet<number>();

  const courseId = $derived(courseApi.course?.id ?? '');
  const groupmemberId = $derived(courseApi.group.memberId ?? '');

  const totalCount = $derived(lessonApi.commentsByLessonId[lessonId]?.totalCount || 0);
  const hasMore = $derived(lessonApi.commentsByLessonId[lessonId]?.hasMore || false);
  const isLoadingComments = $derived(lessonApi.commentsByLessonId[lessonId]?.isLoading || false);

  const comments = $derived.by(() => {
    const commentData = lessonApi.commentsByLessonId[lessonId];
    if (!commentData || !commentData.items || !Array.isArray(commentData.items)) {
      return [];
    }

    return commentData.items.map((apiComment) => {
      const isCurrentUser = apiComment.groupmember?.id === groupmemberId;
      const fallbackName = $t('course.navItem.lessons.comments.unknown_user');

      return {
        id: apiComment.id,
        comment: apiComment.comment ?? '',
        avatar: apiComment.profile?.avatarUrl ?? '',
        commentAt: new Date(apiComment.createdAt),
        groupmemberId: apiComment.groupmemberId,
        name: isCurrentUser ? $t('course.navItem.lessons.comments.you') : apiComment.profile?.fullname || fallbackName
      };
    });
  });

  const previewComments = $derived(comments.slice(0, COMMENT_PREVIEW_COUNT));
  const showSeeAll = $derived(totalCount > COMMENT_PREVIEW_COUNT);
  const isComposerOpen = $derived(isComposing || comment.length > 0);

  function cancelCompose() {
    comment = '';
    isComposing = false;
  }

  async function handleSend() {
    if (!comment.trim()) return;

    await lessonApi.createComment(courseId, lessonId, comment);

    if (lessonApi.success) {
      cancelCompose();
    }
  }

  async function saveEdit() {
    if (!editCommentId) return;

    await lessonApi.updateComment(courseId, lessonId, String(editCommentId), editingText);

    if (lessonApi.success) {
      editCommentId = null;
    }
  }

  function toggleExpanded(commentId: number) {
    if (expandedCommentIds.has(commentId)) {
      expandedCommentIds.delete(commentId);
      return;
    }

    expandedCommentIds.add(commentId);
  }

  async function openDrawer() {
    isDrawerOpen = true;

    if (comments.length > COMMENT_PREVIEW_COUNT || !hasMore) return;

    await lessonApi.loadMoreComments(courseId, lessonId);
  }

  async function loadMoreComments() {
    if (!lessonId) return;

    await lessonApi.loadMoreComments(courseId, lessonId);
  }

  $effect(() => {
    if (!courseId || !lessonId) return;
    if (lessonApi.commentsByLessonId[lessonId]) return;

    untrack(() => {
      lessonApi.getComments(courseId, lessonId);
    });
  });
</script>

<DeleteModal
  bind:open={openDeleteModal}
  onDelete={() => {
    if (!deleteCommentId) return;
    lessonApi.deleteComment(courseId, lessonId, String(deleteCommentId));
    deleteCommentId = null;
  }}
/>

{#snippet composer()}
  <div class="ui:border-border ui:bg-background rounded-lg border px-4 py-3">
    <div class="flex items-center gap-3">
      <UserAvatar src={$profile.avatarUrl} alt={$profile.fullname ?? ''} class="size-8!" />
      <span class="text-sm font-medium">{$profile.fullname}</span>
    </div>

    <Textarea
      bind:value={comment}
      aria-label={$t('course.navItem.lessons.comments.text_area_title')}
      placeholder={$t('course.navItem.lessons.comments.placeholder')}
      class="mt-2 {borderlessTextareaClass}"
      onfocus={() => (isComposing = true)}
    />

    {#if isComposerOpen}
      <div class="mt-2 flex items-center justify-end gap-2">
        <Button size="sm" variant="ghost" onclick={cancelCompose} disabled={lessonApi.isCommenting}>
          {$t('course.navItem.lessons.comments.cancel_btn')}
        </Button>
        <Button
          size="sm"
          testId="lesson-comment-submit"
          onclick={handleSend}
          disabled={!comment.trim() || !courseId || !lessonId}
          loading={lessonApi.isCommenting}
        >
          {$t('course.navItem.lessons.comments.comment_btn')}
        </Button>
      </div>
    {/if}
  </div>
{/snippet}

{#snippet commentList(items: typeof comments)}
  <ul class="ui:divide-border divide-y">
    {#each items as commentItem (commentItem.id)}
      {@const isLong = isLongComment(commentItem.comment)}
      {@const isExpanded = expandedCommentIds.has(commentItem.id)}
      <li class="py-6">
        <div class="flex items-center gap-3">
          <UserAvatar src={commentItem.avatar} alt={commentItem.name} class="size-8!" />

          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{commentItem.name}</p>
            <p class="ui:text-muted-foreground text-xs" title={commentItem.commentAt.toLocaleString()}>
              {calDateDiff(commentItem.commentAt)}
            </p>
          </div>

          <DropdownMenu.Root>
            <DropdownMenu.Trigger
              class="ui:text-muted-foreground ui:hover:bg-muted ui:hover:text-foreground flex size-8 items-center justify-center rounded-md"
              aria-label={$t('course.navItem.lessons.comments.actions')}
            >
              <EllipsisIcon class="size-4" />
            </DropdownMenu.Trigger>
            <DropdownMenu.Content align="end">
              {#if courseApi.group.memberId === commentItem.groupmemberId}
                <DropdownMenu.Item
                  onclick={() => {
                    editCommentId = commentItem.id;
                    editingText = commentItem.comment;
                  }}
                >
                  {$t('course.navItem.lessons.comments.edit')}
                </DropdownMenu.Item>
                <DropdownMenu.Item
                  variant="destructive"
                  onclick={() => {
                    deleteCommentId = commentItem.id;
                    openDeleteModal = true;
                  }}
                >
                  {$t('course.navItem.lessons.comments.delete')}
                </DropdownMenu.Item>
              {:else}
                <ReportMenuItem targetType="lesson_comment" targetId={commentItem.id} />
              {/if}
            </DropdownMenu.Content>
          </DropdownMenu.Root>
        </div>

        {#if editCommentId === commentItem.id}
          <div class="ui:border-border mt-3 rounded-lg border px-4 py-3">
            <Textarea
              bind:value={editingText}
              aria-label={$t('course.navItem.lessons.comments.edit')}
              placeholder={$t('course.navItem.lessons.comments.placeholder')}
              class={borderlessTextareaClass}
            />
            <div class="mt-2 flex items-center justify-end gap-2">
              <Button
                size="sm"
                variant="ghost"
                onclick={() => (editCommentId = null)}
                disabled={lessonApi.isUpdatingComment}
              >
                {$t('course.navItem.lessons.comments.cancel_btn')}
              </Button>
              <Button size="sm" onclick={saveEdit} disabled={!editingText.trim()} loading={lessonApi.isUpdatingComment}>
                {$t('course.navItem.lessons.comments.save_btn')}
              </Button>
            </div>
          </div>
        {:else}
          <p
            class="mt-3 text-[15px] leading-7 break-words whitespace-pre-wrap"
            class:line-clamp-6={isLong && !isExpanded}
          >
            {commentItem.comment}
          </p>
          {#if isLong}
            <button
              type="button"
              class="ui:text-muted-foreground ui:hover:text-foreground mt-1 cursor-pointer text-sm font-medium"
              onclick={() => toggleExpanded(commentItem.id)}
            >
              {isExpanded
                ? $t('course.navItem.lessons.comments.show_less')
                : $t('course.navItem.lessons.comments.read_more')}
            </button>
          {/if}
        {/if}
      </li>
    {/each}
  </ul>
{/snippet}

<section class="w-full pt-10 pb-12" aria-labelledby="lesson-comments-heading">
  <h2 id="lesson-comments-heading" class="text-xl tracking-tight">
    {$t('course.navItem.lessons.comments.title')} ({totalCount})
  </h2>

  <div class="mt-6">
    {@render composer()}
  </div>

  <div class="mt-4">
    {@render commentList(previewComments)}
  </div>

  {#if showSeeAll}
    <Button variant="outline" class="mt-2 w-full" testId="lesson-comments-see-all" onclick={openDrawer}>
      {$t('course.navItem.lessons.comments.see_all', { count: totalCount })}
    </Button>
  {/if}
</section>

<Sheet.Root bind:open={isDrawerOpen}>
  <Sheet.Content
    side="right"
    class="w-full gap-0 overflow-y-auto pb-10 sm:max-w-lg"
    onOpenAutoFocus={(event) => event.preventDefault()}
  >
    <Sheet.Header class="border-b">
      <Sheet.Title>{$t('course.navItem.lessons.comments.title')} ({totalCount})</Sheet.Title>
    </Sheet.Header>

    <div class="px-4 pt-4">
      {@render composer()}

      <div class="mt-2">
        {@render commentList(comments)}
      </div>

      {#if hasMore}
        <Button variant="outline" class="mt-2 w-full" onclick={loadMoreComments} loading={isLoadingComments}>
          {$t('course.navItem.lessons.comments.show_more')}
        </Button>
      {/if}
    </div>
  </Sheet.Content>
</Sheet.Root>
