<script lang="ts">
  import { untrack } from 'svelte';
  import pluralize from 'pluralize';
  import { goto } from '$app/navigation';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import * as Select from '@cio/ui/base/select';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

  import { t } from '$lib/utils/functions/translations';
  import { courses } from '$lib/features/course/utils/store';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { supabase } from '$lib/utils/functions/supabase';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { currentOrg, currentOrgPath, isOrgAdmin } from '$lib/utils/store/org';
  import { askCommunityValidation, commentInCommunityValidation } from '$lib/utils/functions/validator';

  import type { Course } from '$lib/utils/types';
  import { profile } from '$lib/utils/store/user';
  import Vote from '$lib/components/Vote/index.svelte';
  import { IconButton } from '$lib/components/IconButton';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import TextField from '$lib/components/Form/TextField.svelte';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { CommunityDeleteModal } from '$lib/features/community/components';
  import CircleCheckIcon from '$lib/components/Icons/CircleCheckIcon.svelte';
  import * as Page from '@cio/ui/base/page';

  interface Comment {
    id: string;
    authorId: string;
    name: string;
    avatar: string;
    votes: number;
    comment: string;
    createdAt: string;
  }
  interface Question {
    id: string;
    title: string;
    votes: number;
    author: {
      id: string;
      name: string;
      avatar: string;
    };
    body: string;
    createdAt: string;
    comments: Comment[];
    totalComments: number;
    courseId: string;
  }

  let { data } = $props();
  const { slug } = data;

  let question: Question | undefined = $state();
  let comment = $state('');
  let errors: {
    title?: string;
  } = $state({});
  let isValidAnswer = false; // V2 allow admin mark an answer as accepted
  let resetInput = 1;
  let voted: {
    question: boolean;
    comment: {
      [key: string]: boolean;
    };
  } = $state({ question: false, comment: {} });
  let isEditMode = $state(false);
  let deleteComment = $state({
    shouldDelete: false,
    commentId: '',
    isDeleting: false
  });
  let deleteQuestion = $state({
    shouldDelete: false,
    questionId: '',
    isDeleting: false
  });
  let editContent = $state({
    title: '',
    body: '',
    courseId: ''
  });

  let editorInstance = $state(false);
  let fetchedCourses: Course[] = $state([]);

  function mapResToQuestion(data): Question {
    return {
      id: data.id,
      title: data.title,
      votes: data.votes,
      author: {
        id: data?.author?.id || '',
        name: data?.author?.fullname || '',
        avatar: data?.author?.avatar_url || ''
      },
      body: data.body,
      createdAt: calDateDiff(data.created_at),
      comments: data.comments.map((c) => ({
        id: c.id,
        authorId: c.author?.id || '',
        name: c.author?.fullname || '',
        avatar: c.author?.avatar_url || '',
        votes: c.votes,
        comment: c.body,
        createdAt: calDateDiff(c.created_at)
      })),
      totalComments: 0,
      courseId: data.course_id
    };
  }

  let hasFetched = $state(false);
  function getCourses(userId: string | null, orgId: string) {
    if (hasFetched) return;

    untrack(async () => {
      if ($courses.length) {
        fetchedCourses = [...$courses];
        hasFetched = true;
        return;
      }

      const coursesResults = await fetchCourses(userId, orgId);
      fetchedCourses = coursesResults?.allCourses || [];

      hasFetched = true;
    });
  }

  async function fetchCommunityQuestion(slug: string) {
    if (!slug) return;

    const { data, error } = await supabase
      .from('community_question')
      .select(
        `
        id,
        title,
        body,
        votes,
        created_at,
        course_id,
        slug,
        comments:community_answer(
          id,
          body,
          votes,
          created_at,
          author:profile(id, fullname, avatar_url)
        ),
        author:profile(id, fullname, avatar_url),
        course!inner (
          title
        )
      `
      )
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('[ORG] Error loading community', error);
      return goto(`${$currentOrgPath}`);
    }

    untrack(() => {
      question = mapResToQuestion(data);
      question.totalComments = question.comments.length;
    });
  }

  async function submitComment() {
    errors = commentInCommunityValidation({ comment });
    console.log('submitComment errors', errors);

    if (Object.keys(errors).length || !question) {
      return;
    }

    const { data, error } = await supabase
      .from('community_answer')
      .insert({
        id: undefined,
        body: comment,
        question_id: question.id,
        author_profile_id: $profile.id,
        votes: 0
      })
      .select();

    if (error) {
      console.error('Error: commenting', error);
      snackbar.error('snackbar.community.error.try_again');
    } else {
      console.log('Success: commenting', data);

      snackbar.success('snackbar.community.success.comment_submitted');

      // Add to comment
      const _c = data?.[0];
      question.comments = [
        ...question.comments,
        {
          id: _c.id,
          authorId: $profile.id || '',
          name: $profile?.fullname || '',
          avatar: $profile?.avatar_url || '',
          votes: 0,
          comment: _c.body,
          createdAt: calDateDiff(_c.created_at)
        }
      ];

      // Reset input
      comment = '';
      resetInput = new Date().getTime();
    }
  }

  async function upvoteQuestion(type: string, commentId?: string) {
    if (!question) return;

    const isQuestion = type === 'question';

    if (isQuestion && voted.question) return;
    if (!isQuestion && commentId && voted.comment[commentId]) return;

    const table = isQuestion ? 'community_question' : 'community_answer';
    const matchId = isQuestion ? question.id : commentId;
    let votes = 0;

    if (isQuestion) {
      question.votes = question.votes + 1;
      votes = question.votes;
    } else {
      question.comments = question.comments.map((c) => {
        if (c.id === commentId) {
          c.votes = c.votes + 1;
          votes = c.votes;
        }
        return c;
      });
    }
    const { error } = await supabase.from(table).update({ votes }).match({ id: matchId });
    if (error) {
      console.error('Error: upvoteQuestion', error);
      snackbar.error('snackbar.community.error.try_again');
    } else {
      if (isQuestion) {
        voted.question = true;
      } else if (commentId) {
        voted.comment[commentId] = true;
      }
    }
  }

  async function handleQuestionEdit() {
    if (!question) return;

    if (isEditMode) {
      errors = askCommunityValidation(editContent);
      console.log('handleQuestionEdit errors', errors);

      if (Object.keys(errors).length) {
        return;
      }
    }

    isEditMode = !isEditMode;
    editorInstance = !editorInstance;

    if (!isEditMode) {
      errors = askCommunityValidation(editContent);
      console.log('handleQuestionEdit errors', errors);

      if (Object.keys(errors).length) {
        return;
      }
      const { error } = await supabase
        .from('community_question')
        .update({
          title: editContent.title,
          body: editContent.body,
          course_id: editContent.courseId
        })
        .match({ id: question.id });
      if (error) {
        console.error('Error: handleQuestionEdit', error);
        snackbar.error('snackbar.community.error.try_again');
      } else {
        question.title = editContent.title;
        question.body = editContent.body;
        question.courseId = editContent.courseId;

        editContent.title = '';
        editContent.body = '';
        editContent.courseId = '';
      }
    } else {
      editContent.title = question.title;
      editContent.body = question.body;
      editContent.courseId = question.courseId;
    }
  }

  async function handleDelete(isQuestion: boolean) {
    if (!question) return;

    if (!isQuestion) {
      deleteComment.isDeleting = true;

      const { error } = await supabase.from('community_answer').delete().match({ id: deleteComment.commentId });

      deleteComment.isDeleting = false;

      if (error) {
        snackbar.error('snackbar.community.error.deleting_comments');
        console.log('Error deleting comments', error);
        return;
      }
      snackbar.success('snackbar.community.success.success_delete');

      question.comments = question.comments.filter((c) => c.id !== deleteComment.commentId);
      deleteComment.shouldDelete = false;
      deleteComment.commentId = '';

      // Handle only delete comment
      return;
    }
    deleteQuestion.isDeleting = true;

    const { error: commentDeleteError } = await supabase
      .from('community_answer')
      .delete()
      .match({ question_id: deleteQuestion.questionId });

    if (commentDeleteError) {
      snackbar.error('snackbar.community.error.deleting_comments');
      console.log('Error deleting comments', commentDeleteError);

      deleteQuestion.isDeleting = false;
      return;
    }

    const { error: questionDeleteError } = await supabase
      .from('community_question')
      .delete()
      .match({ id: deleteQuestion.questionId });

    if (questionDeleteError) {
      snackbar.error('snackbar.community.error.deleting_question');
      console.log('Error deleting question', questionDeleteError);
      return;
    }

    snackbar.success('snackbar.community.success.success_delete');
    goto(`${$currentOrgPath}/community`);
    deleteQuestion.isDeleting = false;
  }

  $effect(() => {
    fetchCommunityQuestion(slug);
  });
  $effect(() => {
    if ($profile.id && $currentOrg.id) {
      getCourses($profile.id, $currentOrg.id);
    }
  });
</script>

<svelte:head>
  <title>{question?.title || $t('community.ask.question')}</title>
</svelte:head>

<CommunityDeleteModal
  bind:open={deleteComment.shouldDelete}
  isDeleting={deleteComment.isDeleting}
  onCancel={() => {
    deleteComment.shouldDelete = false;
    deleteComment.commentId = '';
  }}
  onDelete={() => handleDelete(false)}
/>

{#if !question}
  <div class="mb-3 px-5 py-10">
    <Skeleton class="h-4 w-[25%]" />
    <Skeleton class="mb-2 h-4 w-full" />
    <Skeleton class="h-80 w-full" />
  </div>
{:else}
  <Page.Root class="mx-auto max-w-3xl md:mx-10 lg:mb-20">
    <div class="px-5 py-10">
      <a class="text-md flex items-center text-gray-500 dark:text-white" href={`${$currentOrgPath}/community`}>
        <ArrowLeftIcon size={16} />
        {$t('community.ask.go_back')}
      </a>
    </div>
    <Page.Header>
      <Page.HeaderContent>
        {#if isEditMode}
          <div class="flex w-full items-center gap-2">
            <TextField bind:value={editContent.title} className="flex-1" errorMessage={errors.title} />
            <Select.Root type="single" bind:value={editContent.courseId}>
              <Select.Trigger class="h-full w-[25%]">
                <p>
                  {editContent.courseId
                    ? fetchedCourses.find((course) => course.id === editContent.courseId)?.title
                    : $t('community.ask.select_course')}
                </p>
              </Select.Trigger>
              <Select.Content>
                {#each fetchedCourses as course}
                  <Select.Item value={course.id || ''}>{course.title}</Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        {:else}
          <div class="flex items-center gap-2">
            <Vote value={question.votes} upVote={() => upvoteQuestion('question')} disabled={voted.question} />
            <Page.Title>{question.title}</Page.Title>
          </div>
        {/if}
      </Page.HeaderContent>
      {#if question.author.id === $profile.id}
        <Page.Action>
          <PrimaryButton
            label={isEditMode ? $t('community.ask.save') : $t('community.ask.edit')}
            variant={VARIANTS.OUTLINED}
            onClick={handleQuestionEdit}
            className="h-fit"
          />
          {#if isEditMode}
            <PrimaryButton
              label={$t('community.ask.cancel')}
              variant={VARIANTS.TEXT}
              onClick={() => (isEditMode = !isEditMode)}
              className="py-3 px-6 rounded-sm h-fit"
              disablePadding={true}
            />
          {/if}
        </Page.Action>
      {/if}
    </Page.Header>
    <Page.Body>
      {#snippet child()}
        <div class="border-gray my-1 rounded-lg border px-1">
          <header class="flex items-center justify-between p-2 leading-none">
            <div class="flex items-center text-black no-underline hover:underline">
              <Avatar src={question.author.avatar} name={question.author.name} width="w-7" height="h-7" />
              <p class="ml-2 text-sm dark:text-white">{question.author.name}</p>
              <p class="ml-2 text-sm text-gray-500 dark:text-white">
                {question.createdAt}
              </p>
            </div>
            {#if question.author.id === $profile.id || $isOrgAdmin}
              <IconButton
                value="delete-question"
                onClick={() => {
                  if (!question) return;

                  deleteQuestion.shouldDelete = true;
                  deleteQuestion.questionId = question.id;
                }}
              >
                <TrashIcon size={16} />
              </IconButton>
            {/if}
          </header>
          {#if isEditMode && editorInstance}
            <div class="my-2">
              <TextEditor
                placeholder="Give an answer"
                content={editContent.body}
                onChange={(content) => (editContent.body = content)}
              />
            </div>
          {:else}
            <section class="prose prose-sm sm:prose p-2">
              {@html question.body}
            </section>
          {/if}
        </div>

        <div class="my-8">
          {pluralize($t('community.answers'), question.totalComments, true)}
        </div>

        {#each question.comments as comment}
          <div class="my-5 flex items-start px-1">
            <Vote
              value={comment.votes}
              upVote={() => upvoteQuestion('comment', comment.id)}
              disabled={voted.comment[comment.id]}
            />
            <div class="border-gray w-full rounded-lg border">
              <header class="flex items-center justify-between p-2 leading-none">
                <div class="flex items-center text-black">
                  <Avatar src={comment.avatar} name={comment.name} width="w-7" height="h-7" />
                  <p class="ml-2 text-sm dark:text-white">{comment.name}</p>
                  <p class="ml-2 text-sm text-gray-500 dark:text-white">
                    {comment.createdAt}
                  </p>
                </div>

                {#if isValidAnswer}
                  <CircleCheckIcon size={16} />
                {/if}

                {#if comment.authorId === $profile.id || $isOrgAdmin}
                  <IconButton
                    value="delete-comment"
                    onClick={() => {
                      deleteComment.shouldDelete = true;
                      deleteComment.commentId = comment.id;
                    }}
                  >
                    <TrashIcon size={16} />
                  </IconButton>
                {/if}
              </header>
              <article class="prose prose-sm sm:prose p-2">
                {@html comment.comment}
              </article>
            </div>
          </div>
        {/each}

        <hr />

        <div class="mt-4">
          {#if !editorInstance}
            <TextEditor placeholder="Give an answer" content={comment} onChange={(content) => (comment = content)} />
          {/if}

          <div class="mt-2 flex justify-end">
            <PrimaryButton label={$t('community.ask.comment')} onClick={submitComment} />
          </div>
        </div>
      {/snippet}
    </Page.Body>
  </Page.Root>
{/if}
