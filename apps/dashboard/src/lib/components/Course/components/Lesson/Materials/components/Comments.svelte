<script lang="ts">
  import Avatar from '$lib/components/Avatar/index.svelte';
  import { lesson, lessonCommentsChannel } from '$lib/components/Course/components/Lesson/store/lessons';
  import { group } from '$lib/components/Course/store';
  import TextArea from '$lib/components/Form/TextArea.svelte';
  import DeleteModal from '$lib/components/Modal/DeleteModal.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';
  import { profile } from '$lib/utils/store/user';
  import type { GroupPerson, LessonComment, LessonCommentInsertPayload } from '$lib/utils/types';
  import type { PostgrestSingleResponse, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
  import { OverflowMenu, OverflowMenuItem } from 'carbon-components-svelte';
  import { onDestroy, onMount } from 'svelte';

  const supabase = getSupabase();
  const PAGE_SIZE = 20;

  interface Props {
    lessonId?: string;
  }

  let { lessonId = '' }: Props = $props();

  let comment = $state('');
  let comments: LessonComment[] = $state([]);
  let groupmember: GroupPerson | undefined = $state();
  let isSaving: boolean = $state(false);
  let isFetching = $state(false);
  let openDeleteModal = $state(false);
  let deleteCommentId: number | null = $state(null);
  let editCommentId: number | null = $state(null);

  interface FetchComments {
    id: number;
    comment: string;
    created_at: string;
    groupmember: {
      id: string;
      profile: {
        avatar_url: string;
        fullname: string;
      };
    };
  }

  async function handleSend() {
    if (!comment || !groupmember) {
      return;
    }

    isSaving = true;

    comments = [
      {
        id: 0,
        comment: comment,
        name: $t('course.navItem.lessons.comments.you'),
        avatar: $profile.avatar_url,
        commentAt: new Date(),
        groupmember_id: groupmember.id
      },
      ...comments
    ];
    pagination.count = comments.length;

    supabase
      .from('lesson_comment')
      .insert({
        lesson_id: $lesson.id,
        groupmember_id: groupmember.id,
        comment
      })
      .select('id')
      .single()
      .then(({ data, error }) => {
        isSaving = false;
        if (error) {
          console.error('Error adding comment:', error);
          return;
        }

        comments = comments.map((comment) => (comment.id === 0 ? { ...comment, id: data.id } : comment));
        isSaving = false;
        comment = '';
      });
  }

  async function handleUpdate(commentItem: LessonComment) {
    if (!editCommentId || !commentItem.comment) {
      return;
    }

    const { error } = await supabase
      .from('lesson_comment')
      .update({ comment: commentItem.comment })
      .eq('id', editCommentId);

    if (error) {
      console.error('handleUpdate', error);
      snackbar.error($t('snackbar.something'));
    } else {
      snackbar.success($t('snackbar.success_update'));
    }

    editCommentId = null;
    pagination.count = comments.length;
  }

  async function handleDeleteComment() {
    if (!deleteCommentId) {
      return;
    }

    const { error } = await supabase.from('lesson_comment').delete().eq('id', deleteCommentId);

    if (error) {
      console.error('error', error);
      snackbar.error($t('snackbar.something'));
    } else {
      snackbar.success($t('snackbar.success_delete'));
    }

    comments = comments.filter((comment) => comment.id !== deleteCommentId);
    pagination.count = comments.length;

    deleteCommentId = null;
  }

  async function handleInsert(payload: RealtimePostgresChangesPayload<LessonCommentInsertPayload>) {
    const insertedComment = payload.new as LessonCommentInsertPayload;

    if (groupmember && groupmember.id === insertedComment.groupmember_id) {
      return;
    }

    const {
      data,
      error
    }: PostgrestSingleResponse<{
      id: string;
      profile: {
        fullname: string;
        avatar_url: string;
      };
    }> = await supabase
      .from('groupmember')
      .select('id, profile:profile_id(fullname, avatar_url)')
      .eq('id', insertedComment.groupmember_id)
      .single();

    if (error || !data) {
      console.error('handleInsert', error);
      return;
    }

    comments = [
      {
        id: insertedComment.id,
        comment: insertedComment.comment,
        name: data.profile.fullname,
        avatar: data.profile.avatar_url,
        commentAt: insertedComment.created_at,
        groupmember_id: insertedComment.groupmember_id
      },
      ...comments
    ];
    pagination.count = comments.length;
  }

  let pagination = $state({
    hasMore: true,
    count: 0,
    page: 0
  });

  async function fetchComments(people: GroupPerson[]) {
    if (!pagination.hasMore) return;

    groupmember = people.find((person) => person.profile_id === $profile.id);

    if (!groupmember || !lessonId) return;

    isFetching = true;

    const from = pagination.page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data, error, count } = await supabase
      .from('lesson_comment')
      .select(
        `
        groupmember_id,
        created_at,
        id,
        comment,
        groupmember:groupmember_id(
            id,profile:profile_id(fullname, avatar_url)
        )
        `,
        { count: 'exact' }
      )
      .match({
        lesson_id: lessonId
      })
      .order('created_at', { ascending: false })
      .range(from, to)
      .returns<FetchComments[]>();

    if (error || !data) {
      console.error('error');
      return;
    }

    const newComments = data.map((lessonComment) => {
      return {
        id: lessonComment.id,
        comment: lessonComment.comment,
        avatar: lessonComment.groupmember.profile.avatar_url,
        commentAt: lessonComment.created_at,
        groupmember_id: lessonComment.groupmember.id,
        name:
          lessonComment.groupmember.id === groupmember?.id
            ? $t('course.navItem.lessons.comments.you')
            : lessonComment.groupmember.profile.fullname
      };
    });

    comments = pagination.page === 0 ? newComments : [...comments, ...newComments];
    pagination.hasMore = count ? from + data.length < count : false;
    pagination.count = count ?? 0;
    pagination.page++;

    isFetching = false;
  }

  onMount(async () => {
    fetchComments($group.people);

    if (!$lessonCommentsChannel) {
      lessonCommentsChannel.set(
        supabase
          .channel('any')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'lesson_comment' }, handleInsert)
          .subscribe()
      );
    }
  });

  onDestroy(() => {
    supabase.removeChannel($lessonCommentsChannel);
  });
</script>

<DeleteModal bind:open={openDeleteModal} onDelete={handleDeleteComment} />

<div class="mx-auto w-full max-w-[65ch]">
  <!-- <hr class="my-5" /> -->
  <div class="mb-5">
    <p class="text-xl font-bold capitalize">
      {$t('course.navItem.lessons.comments.title')} ({pagination.count})
    </p>
  </div>
  <div>
    <div class="flex h-full items-start gap-3">
      <Avatar src={$profile.avatar_url} name={$profile.fullname} width="w-8" height="h-8" className="mt-2" />
      <div class="h-full w-full">
        <TextArea
          label={$t('course.navItem.lessons.comments.text_area_title')}
          placeholder={$t('course.navItem.lessons.comments.placeholder')}
          bind:value={comment}
        />
      </div>
    </div>

    <div class="mt-2 flex flex-row-reverse">
      <PrimaryButton
        label={$t('course.navItem.lessons.comments.comment_btn')}
        onClick={handleSend}
        isDisabled={!comment}
        isLoading={isSaving}
      />
    </div>
  </div>

  <div class="my-10">
    {#each comments as commentItem}
      <div class="mt-2 flex items-start gap-3 pb-2">
        <Avatar src={commentItem.avatar} name={commentItem.name} width="w-8" height="h-8" />

        <div class="w-full rounded-md border px-4 pb-4 pt-2 dark:border-neutral-700">
          <div class="flex items-center justify-between gap-2">
            <p class="text-md font-bold dark:text-white">
              {commentItem.name}
              <span
                class="ml-1 text-xs font-normal text-gray-800 dark:text-white"
                title={commentItem.commentAt.toLocaleString()}
              >
                {calDateDiff(commentItem.commentAt)}
              </span>
            </p>

            {#if groupmember?.id === commentItem.groupmember_id}
              <OverflowMenu flipped>
                <OverflowMenuItem text="Edit" on:click={() => (editCommentId = commentItem.id)} />
                <OverflowMenuItem
                  danger
                  text="Delete"
                  on:click={() => {
                    deleteCommentId = commentItem.id;
                    openDeleteModal = true;
                  }}
                />
              </OverflowMenu>
            {/if}
          </div>

          {#if editCommentId === commentItem.id}
            <TextArea
              placeholder={$t('course.navItem.lessons.comments.placeholder')}
              bind:value={commentItem.comment}
            />
            <div class="mt-2 flex flex-row-reverse items-center gap-2">
              <PrimaryButton
                variant={VARIANTS.OUTLINED}
                label={$t('course.navItem.lessons.comments.cancel_btn')}
                onClick={() => (editCommentId = null)}
              />
              <PrimaryButton
                label={$t('course.navItem.lessons.comments.comment_btn')}
                onClick={() => handleUpdate(commentItem)}
                isDisabled={!commentItem.comment}
                isLoading={isSaving}
              />
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
  {#if pagination.hasMore}
    <div class="mt-2 flex items-center justify-center">
      <PrimaryButton
        label={$t('course.navItem.lessons.comments.load_more_btn')}
        variant={VARIANTS.OUTLINED}
        onClick={() => fetchComments($group.people)}
        isLoading={isFetching}
      />
    </div>
  {/if}
</div>
