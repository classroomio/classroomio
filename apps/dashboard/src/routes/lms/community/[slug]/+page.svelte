<script lang="ts">
  import { goto } from '$app/navigation';
  import pluralize from 'pluralize';
  import TrashCanIcon from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import { Dropdown, SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
  import ArrowLeftIcon from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import Vote from '$lib/components/Vote/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import CheckmarkOutlineIcon from 'carbon-icons-svelte/lib/CheckmarkOutline.svelte';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { supabase } from '$lib/utils/functions/supabase';
  import {
    askCommunityValidation,
    commentInCommunityValidation
  } from '$lib/utils/functions/validator';
  import { snackbar } from '$lib/components/Snackbar/store';
  import TextField from '$lib/components/Form/TextField.svelte';
  import DeleteModal from '$lib/components/Org/Community/DeleteModal.svelte';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { browser } from '$app/environment';
  import { fetchCourses } from '$lib/components/Courses/api.js';

  export let data;
  const { slug } = data;

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

  let question: Question;
  let comment = '';
  let errors: {
    title?: string;
  } = {};
  let isValidAnswer = false; // V2 allow admin mark an answer as accepted
  let resetInput = 1;
  let voted: {
    question: boolean;
    comment: {
      [key: string]: boolean;
    };
  } = { question: false, comment: {} };
  let isEditMode = false;
  let deleteComment = {
    shouldDelete: false,
    commentId: '',
    isDeleting: false
  };
  let deleteQuestion = {
    shouldDelete: false,
    questionId: '',
    isDeleting: false
  };
  let editContent = {
    title: '',
    body: '',
    course_id: ''
  };

  let editorInstance = false;
  let fetchedCourses = [];

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
    const coursesResults = await fetchCourses(userId, orgId);
    fetchedCourses = coursesResults.allCourses;
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
      console.error('[LMS] Error loading community', error);
      return goto(`/lms`);
    }

    question = mapResToQuestion(data);
    question.totalComments = question.comments.length;
  }

  async function submitComment() {
    errors = commentInCommunityValidation({ comment });
    console.log('submitComment errors', errors);

    if (Object.keys(errors).length) {
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
      snackbar.error('Error - Please try again later');
    } else {
      console.log('Success: commenting', data);

      snackbar.success('Comment Submitted!');

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
      snackbar.error('Error - Please try again later');
    } else {
      if (isQuestion) {
        voted.question = true;
      } else if (commentId) {
        voted.comment[commentId] = true;
      }
    }
  }

  async function handleQuestionEdit() {
    if (isEditMode) {
      const fields = {
        title: editContent.title,
        body: editContent.body,
        course_id: editContent.course_id
      };
      errors = askCommunityValidation(fields);
      console.log('handleQuestionEdit errors', errors);

      if (Object.keys(errors).length) {
        return;
      }
    }

    isEditMode = !isEditMode;
    editorInstance = !editorInstance;

    if (!isEditMode) {
      const fields = {
        title: editContent.title,
        body: editContent.body,
        course_id: editContent.course_id
      };
      errors = askCommunityValidation(fields);
      console.log('handleQuestionEdit errors', errors);

      if (Object.keys(errors).length) {
        return;
      }
      const { error } = await supabase
        .from('community_question')
        .update(fields)
        .match({ id: question.id });
      if (error) {
        console.error('Error: handleQuestionEdit', error);
        snackbar.error('Error - Please try again later');
      } else {
        question.title = fields.title;
        question.body = fields.body;
        question.courseId = fields.course_id;

        editContent.title = '';
        editContent.body = '';
        editContent.course_id = '';
      }
    } else {
      editContent.title = question.title;
      editContent.body = question.body;
      editContent.course_id = question.courseId;
    }
  }

  async function handleDelete(isQuestion: boolean) {
    if (!isQuestion) {
      deleteComment.isDeleting = true;

      const { error } = await supabase
        .from('community_answer')
        .delete()
        .match({ id: deleteComment.commentId });

      deleteComment.isDeleting = false;

      if (error) {
        snackbar.error('Error deleting comments');
        console.log('Error deleting comments', error);
        return;
      }
      snackbar.success('Deleted successfully');

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
      snackbar.error('Error deleting comments');
      console.log('Error deleting comments', commentDeleteError);

      deleteQuestion.isDeleting = false;
      return;
    }

    const { error: questionDeleteError } = await supabase
      .from('community_question')
      .delete()
      .match({ id: deleteQuestion.questionId });

    if (questionDeleteError) {
      snackbar.error('Error deleting question');
      console.log('Error deleting question', questionDeleteError);
      return;
    }

    snackbar.success('Deleted successfully');
    goto(`/lms/community`);
    deleteQuestion.isDeleting = false;
  }

  $: browser && fetchCommunityQuestion(slug);
  $: {
    if ($profile.id && $currentOrg.id) {
      getCourses($profile.id, $currentOrg.id);
    }
  }
</script>

<svelte:head>
  <title>{question?.title || 'Question'}</title>
</svelte:head>

<DeleteModal
  bind:open={deleteQuestion.shouldDelete}
  bind:isDeleting={deleteQuestion.isDeleting}
  onCancel={() => {
    deleteQuestion.shouldDelete = false;
    deleteQuestion.questionId = '';
  }}
  onDelete={() => handleDelete(true)}
  isQuestion={true}
/>

<DeleteModal
  bind:open={deleteComment.shouldDelete}
  isDeleting={deleteComment.isDeleting}
  onCancel={() => {
    deleteComment.shouldDelete = false;
    deleteComment.commentId = '';
  }}
  onDelete={() => handleDelete(false)}
/>
<section class="max-w-3xl mx-auto md:mx-10 lg:mb-20">
  {#if !question}
    <div class="py-10 px-5 mb-3">
      <SkeletonText style="width: 25%;" />
      <SkeletonText style="width: 100%; margin-bottom: 2rem" />
      <SkeletonPlaceholder style="width: 100%; height: 20rem;" />
    </div>
  {:else}
    <div class="py-10 px-5">
      <a class="text-gray-500 dark:text-white text-md flex items-center" href={`/lms/community`}>
        <ArrowLeftIcon size={24} class="carbon-icon dark:text-white" /> Go Back
      </a>
      <div class="my-5 flex justify-between items-center">
        {#if isEditMode}
          <TextField
            bind:value={editContent.title}
            className="w-full mr-2"
            errorMessage={errors.title}
          />
          <Dropdown
            class="w-[25%] h-fit"
            size="xl"
            label="Select Course"
            items={fetchedCourses.map((course) => ({ id: course.id, text: course.title }))}
            bind:selectedId={editContent.course_id}
          />
        {:else}
          <div class="flex items-center">
            <Vote
              value={question.votes}
              upVote={() => upvoteQuestion('question')}
              disabled={voted.question}
            />
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
      <div class="my-1 px-1 rounded-lg border border-1 border-gray">
        <header class="flex items-center justify-between leading-none p-2">
          <div class="flex items-center no-underline hover:underline text-black">
            <Avatar
              src={question.author.avatar}
              name={question.author.name}
              width="w-7"
              height="h-7"
            />
            <p class="dark:text-white ml-2 text-sm">{question.author.name}</p>
            <p class="dark:text-white ml-2 text-sm text-gray-500">
              {question.createdAt}
            </p>
          </div>
          {#if question.author.id === $profile.id || $isOrgAdmin}
            <IconButton
              value="delete-question"
              onClick={() => {
                deleteQuestion.shouldDelete = true;
                deleteQuestion.questionId = question.id;
              }}
            >
              <TrashCanIcon size={16} class="carbon-icon dark:text-white" />
            </IconButton>
          {/if}
        </header>
        {#if isEditMode && editorInstance}
          <div class="my-2">
            <TextEditor
              bind:value={editContent.body}
              placeholder="Give an answer"
              onChange={(html) => (editContent.body = html)}
            />
          </div>
        {:else}
          <section class="prose prose-sm sm:prose p-2">
            {@html question.body}
          </section>
        {/if}
      </div>

      <div class="my-8 font-bold">
        {pluralize('answers', question.totalComments, true)}
      </div>

      {#each question.comments as comment}
        <div class="my-5 px-1 flex items-start">
          <Vote
            value={comment.votes}
            upVote={() => upvoteQuestion('comment', comment.id)}
            disabled={voted.comment[comment.id]}
          />
          <div class="w-full rounded-lg border border-1 border-gray">
            <header class="flex items-center justify-between leading-none p-2">
              <div class="flex items-center text-black">
                <Avatar src={comment.avatar} name={comment.name} width="w-7" height="h-7" />
                <p class="dark:text-white ml-2 text-sm">{comment.name}</p>
                <p class="dark:text-white ml-2 text-sm text-gray-500">
                  {comment.createdAt}
                </p>
              </div>

              {#if isValidAnswer}
                <CheckmarkOutlineIcon size={20} />
              {/if}

              {#if comment.authorId === $profile.id || $isOrgAdmin}
                <IconButton
                  value="delete-comment"
                  onClick={() => {
                    deleteComment.shouldDelete = true;
                    deleteComment.commentId = comment.id;
                  }}
                >
                  <TrashCanIcon size={16} class="carbon-icon dark:text-white" />
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
          <TextEditor
            bind:value={comment}
            placeholder="Give an answer"
            onChange={(html) => (comment = html)}
          />
        {/if}

        <div class="flex justify-end mr-2">
          <PrimaryButton label="Comment" onClick={submitComment} />
        </div>
      </div>
    </div>
  {/if}
</section>
