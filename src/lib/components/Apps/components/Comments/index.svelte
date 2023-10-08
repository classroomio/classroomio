<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import PageNav from '$lib/components/PageNav/index.svelte';
  import CloseButton from '$lib/components/Buttons/Close/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { getSupabase } from '$lib/utils/functions/supabase';
  import type {
    RealtimeChannel,
    RealtimePostgresChangesPayload,
    PostgrestSingleResponse
  } from '@supabase/supabase-js';
  import type { LessonCommentInsertPayload, GroupPerson, LessonComment } from '$lib/utils/types';
  import { lesson } from '$lib/components/Course/components/Lesson/store/lessons';
  import { group } from '$lib/components/Course/store';
  import { profile } from '$lib/utils/store/user';
  import { calDateDiff } from '$lib/utils/functions/date';

  export let handleClose = () => {};

  const supabase = getSupabase();

  let comment = '';
  let bodyRef: HTMLDivElement;
  let lessonCommentChannel: RealtimeChannel;
  let comments: LessonComment[] = [];
  let groupmember: GroupPerson | undefined;
  let isSaving: boolean = false;

  interface FetchComments {
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
    console.log('groupmember', groupmember);
    if (!comment || !groupmember) {
      return;
    }

    comments = [
      ...comments,
      {
        comment: comment,
        name: 'You',
        avatar: $profile.avatar_url,
        commentAt: new Date().getTime().toLocaleString()
      }
    ];
    scrollToBottom();

    isSaving = true;
    supabase
      .from('lesson_comment')
      .insert({
        lesson_id: $lesson.id,
        groupmember_id: groupmember.id,
        comment
      })
      .then(() => {
        isSaving = false;
      });

    comment = '';
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      handleSend();
    }
  }

  function scrollToBottom() {
    setTimeout(() => {
      bodyRef.scrollTo({
        top: bodyRef.scrollHeight
      });
    }, 100);
  }

  async function handleInsert(payload: RealtimePostgresChangesPayload<LessonCommentInsertPayload>) {
    const insertedComment = payload.new as LessonCommentInsertPayload;

    if (groupmember && groupmember.id === insertedComment.groupmember_id) {
      console.log('is my comment');
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

    console.log('data', data);
    console.log('error', error);

    if (error || !data) {
      return;
    }

    comments = [
      ...comments,
      {
        comment: insertedComment.comment,
        name: data.profile.fullname,
        avatar: data.profile.avatar_url,
        commentAt: insertedComment.created_at
      }
    ];
    $lesson.totalComments = comments.length;

    scrollToBottom();
  }

  async function fetchComments(people: GroupPerson[], lessonId?: string | null) {
    groupmember = people.find((person) => person.profile_id === $profile.id);

    if (!groupmember || !lessonId) return;

    const { data, error } = await supabase
      .from('lesson_comment')
      .select(
        `
          groupmember_id,
          created_at,
          comment,
          groupmember:groupmember_id(
            id,
            profile:profile_id(fullname, avatar_url)
          )
        `
      )
      .match({
        lesson_id: lessonId
      })
      .returns<FetchComments[]>();

    if (error || !data) {
      console.error('error');
      return;
    }

    comments = data.map((lessonComment) => {
      return {
        comment: lessonComment.comment,
        avatar: lessonComment.groupmember.profile.avatar_url,
        commentAt: lessonComment.created_at,
        name:
          lessonComment.groupmember.id === groupmember?.id
            ? 'You'
            : lessonComment.groupmember.profile.fullname
      };
    });
    scrollToBottom();
  }

  onMount(async () => {
    lessonCommentChannel = supabase
      .channel('any')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lesson_comment' },
        handleInsert
      )
      .subscribe();
  });

  onDestroy(() => {
    supabase.removeChannel(lessonCommentChannel);
  });

  $: fetchComments($group.people, $lesson.id);
</script>

<PageNav title="Comments" overidableStyle="padding: 0 10px">
  <div slot="widget">
    <CloseButton onClick={handleClose} />
  </div>
</PageNav>

<div bind:this={bodyRef} class="overflow-auto h-[90%] pb-10 px-2 max-w-[350px]">
  {#each comments as comment}
    <div class="pb-2 mt-2">
      <div class="flex items-start">
        <img
          alt="Placeholder"
          class="block rounded-full"
          width="24"
          height="20"
          src={comment.avatar}
        />
        <div class="ml-2">
          <p class="dark:text-white text-sm font-bold">{comment.name}</p>
          <p class="dark:text-white text-xs font-normal text-gray-800">
            {calDateDiff(comment.commentAt)}
          </p>
        </div>
      </div>
      <article class="prose prose-sm sm:prose ml-8">
        {comment.comment}
      </article>
    </div>
  {/each}
</div>

<div class="footer">
  <TextField
    placeholder="Say something"
    bind:value={comment}
    onKeyDown={handleKeyDown}
    isDisabled={isSaving}
  />
</div>

<style>
  .footer {
    position: absolute;
    bottom: 0px;
    width: 100%;
  }
</style>
