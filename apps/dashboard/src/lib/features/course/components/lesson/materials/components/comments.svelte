<script lang="ts">
  import { onMount } from 'svelte';
  import * as DropdownMenu from '@cio/ui/base/dropdown-menu';
  import EllipsisVerticalIcon from '@lucide/svelte/icons/ellipsis-vertical';

  import * as Avatar from '@cio/ui/base/avatar';
  import { TextareaField } from '@cio/ui/custom/textarea-field';
  import { shortenName } from '$lib/utils/functions/string';
  import { DeleteModal } from '$features/ui';
  import { Button } from '@cio/ui/base/button';

  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { lessonApi } from '$features/course/api';
  import { courseApi } from '$features/course/api';

  interface Props {
    lessonId?: string;
  }

  let { lessonId = '' }: Props = $props();

  let comment = $state('');
  let openDeleteModal = $state(false);
  let deleteCommentId: number | null = $state(null);
  let editCommentId: number | null = $state(null);

  const courseId = $derived(courseApi.course?.id ?? '');
  const groupmemberId = $derived(courseApi.group.memberId ?? '');

  const paginationCount = $derived(lessonApi.commentsByLessonId[lessonId]?.totalCount || 0);
  const hasMore = $derived(lessonApi.commentsByLessonId[lessonId]?.hasMore || false);
  const isLoadingComments = $derived(lessonApi.commentsByLessonId[lessonId]?.isLoading || false);

  const comments = $derived.by(() => {
    const commentData = lessonApi.commentsByLessonId[lessonId];
    if (!commentData || !commentData.items || !Array.isArray(commentData.items)) {
      return [];
    }

    return commentData.items.map((apiComment: any) => {
      const isCurrentUser = apiComment.groupmember?.id === groupmemberId;
      return {
        id: apiComment.id,
        comment: apiComment.comment,
        avatar: apiComment.profile?.avatarUrl ?? 'AV',
        commentAt: new Date(apiComment.createdAt),
        groupmemberId: apiComment.groupmemberId,
        name: isCurrentUser ? $t('course.navItem.lessons.comments.you') : apiComment.profile?.fullname || 'Unknown'
      };
    });
  });

  async function handleSend() {
    if (!comment) {
      return;
    }

    await lessonApi.createComment(courseId, lessonId, comment);

    if (lessonApi.success) {
      comment = '';
    }
  }

  async function loadMoreComments() {
    if (!lessonId) return;

    await lessonApi.loadMoreComments(courseId, lessonId);
  }

  onMount(() => {
    lessonApi.getComments(courseId, lessonId);
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

<div class="mx-auto w-full max-w-[65ch]">
  <!-- <hr class="my-5" /> -->
  <div class="mb-5">
    <p class="text-xl capitalize">
      {$t('course.navItem.lessons.comments.title')} ({paginationCount})
    </p>
  </div>
  <div>
    <div class="flex h-full items-start gap-3">
      <Avatar.Root class="mt-2 h-8 w-8">
        <Avatar.Image
          src={$profile.avatarUrl ? $profile.avatarUrl : '/logo-192.png'}
          alt={$profile.fullname ? $profile.fullname : 'User'}
        />
        <Avatar.Fallback>{shortenName($profile.fullname) || 'U'}</Avatar.Fallback>
      </Avatar.Root>
      <div class="h-full w-full">
        <TextareaField
          label={$t('course.navItem.lessons.comments.text_area_title')}
          placeholder={$t('course.navItem.lessons.comments.placeholder')}
          bind:value={comment}
        />
      </div>
    </div>

    <div class="mt-2 flex flex-row-reverse">
      <Button onclick={handleSend} disabled={!comment} loading={lessonApi.isSaving}>
        {$t('course.navItem.lessons.comments.comment_btn')}
      </Button>
    </div>
  </div>

  <div class="my-10">
    {#each comments as commentItem (commentItem.id)}
      <div class="mt-2 flex items-start gap-3 pb-2">
        <Avatar.Root class="h-8 w-8">
          <Avatar.Image
            src={commentItem.avatar ? commentItem.avatar : '/logo-192.png'}
            alt={commentItem.name ? commentItem.name : 'User'}
          />
          <Avatar.Fallback>{shortenName(commentItem.name) || 'U'}</Avatar.Fallback>
        </Avatar.Root>

        <div class="w-full rounded-md border px-4 pt-2 pb-4 dark:border-neutral-700">
          <div class="flex items-center justify-between gap-2">
            <p class="text-md dark:text-white">
              {commentItem.name}
              <span
                class="ml-1 text-xs font-normal text-gray-800 dark:text-white"
                title={commentItem.commentAt.toLocaleString()}
              >
                {calDateDiff(commentItem.commentAt)}
              </span>
            </p>

            {#if courseApi.group.memberId === commentItem.groupmemberId}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger
                  class="flex h-8 w-8 items-center justify-center rounded-md hover:bg-gray-100 dark:hover:bg-neutral-700"
                >
                  <EllipsisVerticalIcon class="h-5 w-5" />
                </DropdownMenu.Trigger>
                <DropdownMenu.Content align="end">
                  <DropdownMenu.Item onclick={() => (editCommentId = commentItem.id)}>Edit</DropdownMenu.Item>
                  <DropdownMenu.Item
                    class="text-red-600"
                    onclick={() => {
                      deleteCommentId = commentItem.id;
                      openDeleteModal = true;
                    }}
                  >
                    Delete
                  </DropdownMenu.Item>
                </DropdownMenu.Content>
              </DropdownMenu.Root>
            {/if}
          </div>

          {#if editCommentId === commentItem.id}
            <TextareaField
              placeholder={$t('course.navItem.lessons.comments.placeholder')}
              bind:value={commentItem.comment}
            />
            <div class="mt-2 flex flex-row-reverse items-center gap-2">
              <Button variant="outline" onclick={() => (editCommentId = null)}>
                {$t('course.navItem.lessons.comments.cancel_btn')}
              </Button>
              <Button
                onclick={() => {
                  lessonApi.updateComment(courseId, lessonId, String(editCommentId), commentItem.comment);
                }}
                disabled={!commentItem.comment}
                loading={lessonApi.isSaving}
              >
                {$t('course.navItem.lessons.comments.comment_btn')}
              </Button>
            </div>
          {:else}
            <article class="prose sm:prose-sm max-w-[300px] dark:text-white">
              {commentItem.comment}
            </article>
          {/if}
        </div>
      </div>
    {/each}
  </div>
  {#if hasMore}
    <div class="mt-2 flex items-center justify-center">
      <Button variant="outline" onclick={loadMoreComments} loading={isLoadingComments}>
        {$t('course.navItem.lessons.comments.load_more_btn')}
      </Button>
    </div>
  {/if}
</div>
