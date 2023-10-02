<script>
  import { marked } from 'marked';
  import pluralize from 'pluralize';
  import TrashCanIcon from 'carbon-icons-svelte/lib/TrashCan.svelte';
  import { SkeletonPlaceholder, SkeletonText } from 'carbon-components-svelte';
  import ArrowLeftIcon from 'carbon-icons-svelte/lib/ArrowLeft.svelte';
  import Vote from '$lib/components/Vote/index.svelte';
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import Avatar from '$lib/components/Avatar/index.svelte';
  import IconButton from '$lib/components/IconButton/index.svelte';
  import CheckmarkOutlineIcon from 'carbon-icons-svelte/lib/CheckmarkOutline.svelte';
  import { currentOrgPath, currentOrg } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { supabase } from '$lib/utils/functions/supabase';
  import {
    askCommunityValidation,
    commentInCommunityValidation
  } from '$lib/utils/functions/validator';
  import { snackbar } from '$lib/components/Snackbar/store';
  import TextField from '$lib/components/Form/TextField.svelte';
  import DeleteCommentModal from '$lib/components/Org/Community/DeleteCommentModal.svelte';
  import TextEditor from '$lib/components/TextEditor/index.svelte';
  import { calDateDiff } from '$lib/utils/functions/date';

  export let data;
  const { slug } = data;

  let question;
  let comment = '';
  let errors = {};
  let isValidAnswer = false; // V2 allow admin mark an answer as accepted
  let resetInput = 1;
  let voted = { question: false, comment: {} };
  let isEditMode = false;
  let deleteComment = {
    shouldDelete: false,
    commentId: null
  };
  let editContent = {
    title: '',
    body: ''
  };

  let editorInstance = false;

  function mapResToQuestion(data) {
    return {
      id: data.id,
      title: data.title,
      votes: data.votes,
      author: {
        id: data?.author?.profile?.id || '',
        name: data?.author?.profile?.fullname || '',
        avatar: data?.author?.profile?.avatar_url || ''
      },
      body: data.body,
      createdAt: calDateDiff(data.created_at),
      comments: data.comments.map((c) => ({
        id: c.id,
        authorId: c.author?.profile?.id || '',
        name: c.author?.profile?.fullname || '',
        avatar: c.author?.profile?.avatar_url || '',
        votes: c.votes,
        comment: c.body,
        createdAt: calDateDiff(c.created_at)
      })),
      totalComments: 0
    };
  }

  async function fetchCommunityQuestion(slug) {
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
        comments:community_answer(
          id,
          body,
          votes,
          created_at,
          author:organizationmember!community_answer_author_id_fkey!inner(
            profile!inner(id, fullname, avatar_url)
          )
        ),
        author:organizationmember!community_question_author_id_fkey!inner(
          profile!inner(id, fullname, avatar_url)
        )
      `
      )
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Error loading community', error);
      return goto(`${currentOrgPath}`);
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
        author_id: $currentOrg.memberId,
        votes: 0
      })
      .select();

    if (error) {
      console.error('Error: commenting', error);
      snackbar.error('Error - Please try again later');
    } else {
      console.log('Success: commenting', data);

      snackbar.success('Success');

      // Add to comment
      const _c = data?.[0];
      question.comments = [
        ...question.comments,
        {
          id: _c.id,
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

  async function upvoteQuestion(type, commentId) {
    const isQuestion = type === 'question';

    if (isQuestion && voted.question) return;
    if (!isQuestion && voted.comment[commentId]) return;

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
      } else {
        voted.comment[commentId] = true;
      }
    }
  }

  async function handleQuestionEdit() {
    if (isEditMode) {
      const fields = { title: editContent.title, body: editContent.body };
      errors = askCommunityValidation(fields);
      console.log('handleQuestionEdit errors', errors);

      if (Object.keys(errors).length) {
        return;
      }
    }

    isEditMode = !isEditMode;
    editorInstance = !editorInstance;

    if (!isEditMode) {
      const fields = { title: editContent.title, body: editContent.body };
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

        editContent.title = '';
        editContent.body = '';
      }
    } else {
      editContent.title = question.title;
      editContent.body = question.body;
    }
  }

  async function handleCommentDelete() {
    const { error } = await supabase
      .from('community_answer')
      .delete()
      .match({ id: deleteComment.commentId });

    if (!error) {
      question.comments = question.comments.filter((c) => c.id !== deleteComment.commentId);

      deleteComment.shouldDelete = false;
      deleteComment.commentId = null;
    }
  }

  $: fetchCommunityQuestion(slug);
</script>

<svelte:head>
  <title>{question?.title || 'Question'}</title>
</svelte:head>

<DeleteCommentModal
  bind:open={deleteComment.shouldDelete}
  onCancel={() => {
    deleteComment.shouldDelete = false;
    deleteComment.commentId = null;
  }}
  onDelete={handleCommentDelete}
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
      <a
        class="text-gray-500 dark:text-white text-md flex items-center"
        href={`${$currentOrgPath}/community`}
      >
        <ArrowLeftIcon size={24} class="carbon-icon dark:text-white" /> Go Back
      </a>
      <div class="my-5 flex justify-between items-center">
        {#if isEditMode}
          <TextField
            bind:value={editContent.title}
            className="w-full mr-2"
            errorMessage={errors.title}
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
            {@html marked(question.body)}
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

              {#if comment.authorId === $profile.id}
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
              {@html marked(comment.comment)}
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
