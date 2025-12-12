<script lang="ts">
  import { untrack } from 'svelte';
  import pluralize from 'pluralize';
  import { goto } from '$app/navigation';
  import * as Select from '@cio/ui/base/select';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import TrashIcon from '@lucide/svelte/icons/trash';
  import ArrowLeftIcon from '@lucide/svelte/icons/arrow-left';

  import type { Course } from '$lib/utils/types';
  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { courses } from '$lib/features/course/utils/store';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { snackbar } from '$lib/components/Snackbar/store';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { askCommunityValidation, commentInCommunityValidation } from '$lib/utils/functions/validator';

  import Vote from '$lib/components/Vote/index.svelte';
  import { IconButton } from '$lib/components/IconButton';
  import * as Avatar from '@cio/ui/base/avatar';
  import TextField from '$lib/components/Form/TextField.svelte';
  import { shortenName } from '$lib/utils/functions/string';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import CircleCheckIcon from '$lib/components/Icons/CircleCheckIcon.svelte';
  import { CommunityDeleteModal } from '$lib/features/community/components';
  import { communityApi } from '$lib/features/community/api/community.svelte.js';

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

<section class="mx-auto max-w-3xl md:mx-10 lg:mb-20">
  {#if !question}
    <div class="mb-3 px-5 py-10">
      <Skeleton class="h-4 w-[25%]" />
      <Skeleton class="mb-2 h-4 w-full" />
      <Skeleton class="h-80 w-full" />
    </div>
  {:else}
    <div class="px-5 py-10">
      <a class="text-md flex items-center text-gray-500 dark:text-white" href="/lms/community">
        <ArrowLeftIcon size={16} />
        {$t('community.ask.go_back')}
      </a>
      <div class="my-5 flex items-center justify-between">
        {#if isEditMode}
          <TextField bind:value={editContent.title} className="w-full mr-2" errorMessage={errors.title} />
          <Select.Root type="single" bind:value={editContent.courseId}>
            <Select.Trigger class="h-full w-[25%]">
              <p>
                {editContent.courseId
                  ? fetchedCourses.find((course) => course.id === editContent.courseId)?.title
                  : 'Select Course'}
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
        {:else}
          <div class="flex items-center">
            <Vote value={question.votes} upVote={() => upvoteQuestion('question')} disabled={voted.question} />
            <h2 class="text-3xl">{question.title}</h2>
          </div>
        {/if}

        {#if question.author.id === $profile.id}
          <PrimaryButton
            label={isEditMode ? 'Save' : 'Edit'}
            variant={VARIANTS.OUTLINED}
            onClick={handleQuestionEdit}
            className="h-fit"
          />
          {#if isEditMode}
            <PrimaryButton
              label="Cancel"
              variant={VARIANTS.TEXT}
              onClick={() => (isEditMode = !isEditMode)}
              className="py-3 px-6 rounded-sm h-fit"
              disablePadding={true}
            />
          {/if}
        {/if}
      </div>
      <div class="border-1 border-gray my-1 rounded-lg border px-1">
        <header class="flex items-center justify-between p-2 leading-none">
          <div class="flex items-center text-black no-underline hover:underline">
            <Avatar.Root class="h-7 w-7">
              <Avatar.Image
                src={question.author.avatar ? question.author.avatar : '/logo-192.png'}
                alt={question.author.name ? question.author.name : 'User'}
              />
              <Avatar.Fallback>{shortenName(question.author.name) || 'U'}</Avatar.Fallback>
            </Avatar.Root>
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
          <div class="border-1 border-gray w-full rounded-lg border">
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

      <div>
        {#if !editorInstance}
          <TextEditor placeholder="Give an answer" content={comment} onChange={(content) => (comment = content)} />
        {/if}

        <div class="mr-2 flex justify-end">
          <PrimaryButton label="Comment" onClick={submitComment} />
        </div>
      </div>
    </div>
  {/if}
</section>
