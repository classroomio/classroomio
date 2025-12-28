<script lang="ts">
  import pluralize from 'pluralize';
  import * as Page from '@cio/ui/base/page';
  import * as Select from '@cio/ui/base/select';
  import * as Avatar from '@cio/ui/base/avatar';
  import { Skeleton } from '@cio/ui/base/skeleton';
  import TrashIcon from '@lucide/svelte/icons/trash';

  import { t } from '$lib/utils/functions/translations';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { Button } from '@cio/ui/base/button';
  import { currentOrg, isOrgAdmin } from '$lib/utils/store/org';
  import { communityApi } from '$features/community/api/community.svelte';
  import type { TiptapEditor } from '@cio/ui/custom/editor';

  import { profile } from '$lib/utils/store/user';
  import { Vote } from '$features/ui';
  import { IconButton } from '@cio/ui/custom/icon-button';
  import { InputField } from '@cio/ui/custom/input-field';
  import { shortenName } from '$lib/utils/functions/string';
  import { TextEditor } from '$features/ui';
  import { CommunityDeleteModal, CommunityCommentItem } from '$features/community/components';
  import type { CommunityQuestionSuccess } from '../utils/types';
  import { currentCommunityQuestion } from '../utils/store';

  interface Props {
    slug: string;
    isLMS?: boolean;
    question?: CommunityQuestionSuccess['data'] | null;
  }

  let { isLMS = false, question }: Props = $props();

  let commentEditor: TiptapEditor | undefined = $state();
  let isValidAnswer = false; // V2 allow admin mark an answer as accepted
  let voted: {
    question: boolean;
    comment: {
      [key: string]: boolean;
    };
  } = $state({ question: false, comment: {} });
  let deleteQuestionState = $state({
    shouldDelete: false,
    questionId: ''
  });

  // Initialize question from prop if provided
  $effect(() => {
    if (question) {
      communityApi.question = question;
      currentCommunityQuestion.set({ title: question.title });
    }
  });

  $effect(() => {
    if (!$profile.id || !$currentOrg.id) return;

    communityApi.fetchCoursesForOrg($profile.id, $currentOrg.id);
  });
</script>

<svelte:head>
  <title>{communityApi.question?.title || $t('community.ask.question')}</title>
</svelte:head>

<CommunityDeleteModal
  bind:open={communityApi.deleteCommentState.shouldDelete}
  isDeleting={communityApi.isLoading}
  onCancel={() => {
    communityApi.deleteCommentState.shouldDelete = false;
    communityApi.deleteCommentState.commentId = '';
  }}
  onDelete={() => {
    communityApi.deleteComment(communityApi.deleteCommentState.commentId);
  }}
/>

<CommunityDeleteModal
  bind:open={deleteQuestionState.shouldDelete}
  isDeleting={communityApi.isLoading}
  isQuestion={true}
  onCancel={() => {
    deleteQuestionState.shouldDelete = false;
    deleteQuestionState.questionId = '';
  }}
  onDelete={() => {
    if (communityApi.question) {
      communityApi.deleteQuestion(String(communityApi.question.id), isLMS);
    }
  }}
/>

{#if !communityApi.question}
  <div class="mb-3 space-y-2 px-5 py-10">
    <Skeleton class="h-4 w-[25%]" />
    <Skeleton class="h-4 w-full" />
    <Skeleton class="h-80 w-full" />
  </div>
{:else}
  <Page.Root class="mx-auto max-w-3xl md:mx-10 lg:mb-20">
    <Page.Header>
      <Page.HeaderContent>
        {#if communityApi.isEditMode}
          <div class="flex w-full items-center gap-2">
            <InputField
              bind:value={communityApi.editContent.title}
              className="flex-1"
              errorMessage={communityApi.errors.title}
              isDisabled={communityApi.isEditing}
            />

            <Select.Root type="single" bind:value={communityApi.editContent.courseId} disabled={communityApi.isEditing}>
              <Select.Trigger class="w-30! h-full truncate" disabled={communityApi.isEditing}>
                <span class="truncate">
                  {communityApi.editContent.courseId
                    ? communityApi.courses.find((course) => course.id === communityApi.editContent.courseId)?.title
                    : $t('community.ask.select_course')}
                </span>
              </Select.Trigger>
              <Select.Content>
                {#each communityApi.courses as course}
                  {#if course.id}
                    <Select.Item value={course.id}>{course.title}</Select.Item>
                  {/if}
                {/each}
              </Select.Content>
            </Select.Root>
          </div>
        {:else}
          <div class="flex items-center gap-2">
            <Vote
              value={communityApi.question.votes}
              upVote={() => {
                if (voted.question || !communityApi.question) return;
                voted.question = true;
                communityApi.upvotePost({
                  id: Number(communityApi.question.id),
                  isQuestion: true
                });
              }}
              disabled={voted.question}
            />
            <Page.Title>{communityApi.question.title}</Page.Title>
          </div>
        {/if}
      </Page.HeaderContent>
      {#if communityApi.question.authorId === $profile.id}
        <Page.Action>
          <Button
            variant="outline"
            loading={communityApi.isEditing}
            onclick={() => {
              if (!communityApi.question) return;

              if (communityApi.isEditMode) {
                communityApi.updateQuestion(Number(communityApi.question.id), communityApi.editContent);
              } else {
                communityApi.enterEditMode(communityApi.question);
              }
            }}
          >
            {communityApi.isEditMode ? $t('community.ask.save') : $t('community.ask.edit')}
          </Button>

          {#if communityApi.isEditMode}
            <Button variant="ghost" disabled={communityApi.isEditing} onclick={() => communityApi.exitEditMode()}>
              {$t('community.ask.cancel')}
            </Button>
          {/if}
        </Page.Action>
      {/if}
    </Page.Header>

    <Page.Body>
      {#snippet child()}
        <div class="my-1 rounded-md border px-1">
          <div class="flex items-center justify-between p-2 leading-none">
            <div class="flex items-center text-black no-underline hover:underline">
              <Avatar.Root class="h-7 w-7">
                <Avatar.Image
                  src={communityApi.question?.authorAvatarUrl
                    ? communityApi.question?.authorAvatarUrl
                    : '/logo-192.png'}
                  alt={communityApi.question?.authorFullname ? communityApi.question?.authorFullname : 'User'}
                />
                <Avatar.Fallback>{shortenName(communityApi.question?.authorFullname) || 'U'}</Avatar.Fallback>
              </Avatar.Root>
              <p class="ml-2 text-sm dark:text-white">{communityApi.question?.authorFullname}</p>
              <p class="ml-2 text-sm text-gray-500 dark:text-white">
                {communityApi.question?.createdAt ? calDateDiff(communityApi.question.createdAt) : ''}
              </p>
            </div>
            {#if communityApi.question?.authorId === $profile.id || $isOrgAdmin}
              <IconButton
                onclick={() => {
                  if (!communityApi.question) return;

                  deleteQuestionState.shouldDelete = true;
                  deleteQuestionState.questionId = String(communityApi.question.id);
                }}
              >
                <TrashIcon size={16} />
              </IconButton>
            {/if}
          </div>
          {#if communityApi.isEditMode}
            <div class="my-2">
              <TextEditor
                placeholder="Give an answer"
                content={communityApi.editContent.body}
                onChange={(content) => (communityApi.editContent.body = content)}
              />
            </div>
          {:else}
            <section class="prose prose-sm sm:prose p-2">
              {@html communityApi.question?.body}
            </section>
          {/if}
        </div>

        <div class="my-8">
          {pluralize($t('community.answers'), communityApi.question?.comments.length ?? 0, true)}
        </div>

        <div class="space-y-2">
          {#each communityApi.question?.comments as commentItem}
            <CommunityCommentItem
              comment={commentItem}
              isVoted={!!voted.comment[commentItem.id]}
              {isValidAnswer}
              isAuthorOrAdmin={commentItem.author?.id === $profile.id || $isOrgAdmin === true}
              upVote={() => {
                if (voted.comment[commentItem.id]) return;

                voted.comment[commentItem.id] = true;

                communityApi.upvotePost({
                  id: commentItem.id,
                  isQuestion: false
                });
              }}
              onDelete={() => {
                console.log('deleting commentItem', commentItem);
                communityApi.deleteCommentState.shouldDelete = true;
                communityApi.deleteCommentState.commentId = commentItem.id;
              }}
            />
          {/each}
        </div>

        <hr />

        <div class="mt-4">
          <TextEditor
            placeholder="Give an answer"
            class="h-48!"
            bind:content={communityApi.comment}
            onReady={(editor) => (commentEditor = editor)}
          />

          <div class="mt-2 flex justify-end">
            <Button
              onclick={() => {
                console.log('comment', communityApi.comment);
                console.log('question', communityApi.question);
                if (communityApi.question) {
                  communityApi.createComment(Number(communityApi.question.id), isLMS, () => {
                    commentEditor?.commands?.clearContent?.();
                  });
                }
              }}
              loading={communityApi.isCommenting}
            >
              {$t('community.ask.comment')}
            </Button>
          </div>
        </div>
      {/snippet}
    </Page.Body>
  </Page.Root>
{/if}
