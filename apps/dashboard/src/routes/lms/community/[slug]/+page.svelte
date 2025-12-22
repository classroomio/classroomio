<script lang="ts">
  import { untrack } from 'svelte';
  import pluralize from 'pluralize';
  import { goto } from '$app/navigation';
  import * as Select from '@cio/ui/base/select';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import TrashIcon from '@lucide/svelte/icons/trash';

  import type { Course } from '$lib/utils/types';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { courses } from '$features/course/utils/store';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { snackbar } from '$features/ui/snackbar/store';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import { Button } from '@cio/ui/base/button';
  import { askCommunityValidation, commentInCommunityValidation } from '$lib/utils/functions/validator';

  import { Vote } from '$features/ui';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import * as Avatar from '@cio/ui/base/avatar';
  import { InputField } from '@cio/ui/custom/input-field';
  import { shortenName } from '$lib/utils/functions/string';
  import { TextEditor } from '$features/ui';
  import { CircleCheckIcon } from '$features/ui/icons';
  import { CommunityDeleteModal } from '$features/community/components';
  import { currentCommunityQuestion } from '$features/community/utils/store';
  import * as Page from '@cio/ui/base/page';
  import { communityApi } from '$features/community/api/community.svelte';

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
    courseId?: string;
  } = $state({});
  let isValidAnswer = false; // V2 allow admin mark an answer as accepted
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

  async function getCourses(userId: string | null, orgId: string) {
    if ($courses.length) {
      fetchedCourses = [...$courses];
      return;
    }

    const coursesResults = await fetchCourses(userId, orgId);
    fetchedCourses = coursesResults?.allCourses || [];
  }

  async function fetchCommunityQuestion(slug: string) {
    if (!slug) return;

    await communityApi.fetchCommunityQuestion({ slug: slug });

    if (communityApi.error) {
      console.error('[LMS] Error loading community', communityApi.error);
      return goto(`/lms`);
    }

    untrack(() => {
      question = mapResToQuestion(data);
      question.totalComments = question.comments.length;
      // Update store for breadcrumb
      currentCommunityQuestion.set({ title: question.title });
    });
  }

  async function submitComment() {
    if (!question) return;

    errors = commentInCommunityValidation({ comment });
    console.log('submitComment errors', errors);

    if (Object.keys(errors).length) {
      return;
    }

    await communityApi.createComment({
      id: Number(question.id),
      body: comment,
      authorProfileId: String($profile.id),
      votes: 0
    });

    if (communityApi.error) {
      console.error('Error: commenting', communityApi.error);
      snackbar.error('snackbar.community.error.try_again');
    } else {
      console.log('Success: commenting', communityApi.answer);

      snackbar.success('snackbar.community.success.comment_submitted');

      // Add to comment
      const _c = communityApi.answer;
      question.comments = [
        ...question.comments,
        {
          id: _c.id,
          authorId: $profile.id || '',
          name: $profile?.fullname || '',
          avatar: $profile?.avatarUrl || '',
          votes: 0,
          comment: _c.body,
          createdAt: calDateDiff(_c.createdAt)
        }
      ];

      // Reset input
      comment = '';
    }
  }

  async function upvoteQuestion(type: string, commentId?: string) {
    if (!question) return;

    const isQuestion = type === 'question';

    if (isQuestion && voted.question) return;
    if (!isQuestion && commentId && voted.comment[commentId]) return;

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

    await communityApi.upvotePost({
      id: Number(matchId) || 0,
      votes,
      isQuestion
    });

    if (communityApi.error) {
      console.error('Error: upvoteQuestion', communityApi.error);
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

      await communityApi.handleUpdateQuestion({
        id: Number(question.id),
        title: editContent.title,
        body: editContent.body,
        courseId: editContent.courseId
      });

      if (communityApi.error) {
        console.error('Error: handleQuestionEdit', communityApi.error);
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

      await communityApi.handleDeleteCommentById({ id: deleteComment.commentId });

      deleteComment.isDeleting = false;

      if (communityApi.error) {
        snackbar.error('snackbar.community.error.deleting_comments');
        console.log('Error deleting comments', communityApi.error);
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

    await communityApi.handleDeleteCommentByQuestionId({ questionId: deleteQuestion.questionId });

    if (communityApi.error) {
      snackbar.error('snackbar.community.error.deleting_comments');
      console.log('Error deleting comments', communityApi.error);
      deleteQuestion.isDeleting = false;
      return;
    }

    await communityApi.handleDeleteQuestionById({ id: deleteQuestion.questionId });

    if (communityApi.error) {
      snackbar.error('snackbar.community.error.deleting_question');
      console.log('Error deleting question', communityApi.error);
      return;
    }

    snackbar.success('snackbar.community.success.success_delete');
    goto(`/lms/community`);
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

  // Clear store when component unmounts
  $effect(() => {
    return () => {
      currentCommunityQuestion.set({ title: null });
    };
  });
</script>

<svelte:head>
  <title>{question?.title || 'Question'}</title>
</svelte:head>

<CommunityDeleteModal
  bind:open={deleteQuestion.shouldDelete}
  isDeleting={deleteQuestion.isDeleting}
  onCancel={() => {
    deleteQuestion.shouldDelete = false;
    deleteQuestion.questionId = '';
  }}
  onDelete={() => handleDelete(true)}
  isQuestion={true}
/>

{#if !question}
  <div class="mb-3 px-5 py-10">
    <Skeleton class="h-4 w-[25%]" />
    <Skeleton class="mb-2 h-4 w-full" />
    <Skeleton class="h-80 w-full" />
  </div>
{:else}
  {@const currentQuestion = question}
  <Page.Root class="mx-auto max-w-3xl md:mx-10 lg:mb-20">
    <Page.Header>
      <Page.HeaderContent>
        {#if isEditMode}
          <div class="flex w-full items-center gap-2">
            <InputField bind:value={editContent.title} className="flex-1" errorMessage={errors.title} />
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
                  {#if course.id}
                    <Select.Item value={course.id}>{course.title}</Select.Item>
                  {/if}
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        {:else}
          <div class="flex items-center gap-2">
            <Vote value={currentQuestion.votes} upVote={() => upvoteQuestion('question')} disabled={voted.question} />
            <Page.Title>{currentQuestion.title}</Page.Title>
          </div>
        {/if}
      </Page.HeaderContent>
      {#if currentQuestion.author.id === $profile.id}
        <Page.Action>
          <Button variant="outline" onclick={handleQuestionEdit}>
            {isEditMode ? $t('community.ask.save') : $t('community.ask.edit')}
          </Button>
          {#if isEditMode}
            <Button variant="ghost" onclick={() => (isEditMode = !isEditMode)}>
              {$t('community.ask.cancel')}
            </Button>
          {/if}
        </Page.Action>
      {/if}
    </Page.Header>
    <Page.Body>
      {#snippet child()}
        <div class="border-gray my-1 rounded-lg border px-1">
          <header class="flex items-center justify-between p-2 leading-none">
            <div class="flex items-center text-black no-underline hover:underline">
              <Avatar.Root class="h-7 w-7">
                <Avatar.Image
                  src={currentQuestion.author.avatar ? currentQuestion.author.avatar : '/logo-192.png'}
                  alt={currentQuestion.author.name ? currentQuestion.author.name : 'User'}
                />
                <Avatar.Fallback>{shortenName(currentQuestion.author.name) || 'U'}</Avatar.Fallback>
              </Avatar.Root>
              <p class="ml-2 text-sm dark:text-white">{currentQuestion.author.name}</p>
              <p class="ml-2 text-sm text-gray-500 dark:text-white">
                {currentQuestion.createdAt}
              </p>
            </div>
            {#if currentQuestion.author.id === $profile.id || $isOrgAdmin}
              <IconButton
                onclick={() => {
                  deleteQuestion.shouldDelete = true;
                  deleteQuestion.questionId = currentQuestion.id;
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
              {@html currentQuestion.body}
            </section>
          {/if}
        </div>

        <div class="my-8">
          {pluralize($t('community.answers'), currentQuestion.totalComments, true)}
        </div>

        {#each currentQuestion.comments as comment}
          <div class="my-5 flex items-start px-1">
            <Vote
              value={comment.votes}
              upVote={() => upvoteQuestion('comment', comment.id)}
              disabled={voted.comment[comment.id]}
            />
            <div class="border-gray w-full rounded-lg border">
              <header class="flex items-center justify-between p-2 leading-none">
                <div class="flex items-center text-black">
                  <Avatar.Root class="h-7 w-7">
                    <Avatar.Image
                      src={comment.avatar ? comment.avatar : '/logo-192.png'}
                      alt={comment.name ? comment.name : 'User'}
                    />
                    <Avatar.Fallback>{shortenName(comment.name) || 'U'}</Avatar.Fallback>
                  </Avatar.Root>
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
                    onclick={() => {
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
            <Button onclick={submitComment}>
              {$t('community.ask.comment')}
            </Button>
          </div>
        </div>
      {/snippet}
    </Page.Body>
  </Page.Root>
{/if}
