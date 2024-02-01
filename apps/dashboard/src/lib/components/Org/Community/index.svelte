<script lang="ts">
  import { goto } from '$app/navigation';
  import AddCommentIcon from 'carbon-icons-svelte/lib/AddComment.svelte';
  import CommunityLoader from './Loader.svelte';
  import Vote from '$lib/components/Vote/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import Space from '$lib/components/Space/index.svelte';
  import { currentOrgPath, currentOrg } from '$lib/utils/store/org';
  import { supabase } from '$lib/utils/functions/supabase';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { course } from '$lib/components/Course/store';

  export let isLMS = false;

  let isLoading = false;
  let discussions = [];
  let lmsDiscussions = [];

  // async function fetchCommunityQuestionsForLMS(orgId?: string, currentCourseId?: string) {
  //   if (!orgId) return;
  //   isLoading = true;
  //   const { data, error } = await supabase
  //     .from('community_question')
  //     .select(
  //       `
  //       organization_id,
  //       course_id,
  //       title,
  //       votes,
  //       created_at,
  //       slug,
  //       comments:community_answer(count),
  //       author:profile(
  //         fullname
  //       )
  //     `
  //     )
  //     .eq('organization_id', orgId)
  //     .eq('course_id', currentCourseId)
  //     .order('created_at', { ascending: false });
  //   console.log('data', data);
  //   console.log('error', error);
  //   isLoading = false;

  //   if (error) {
  //     console.error('Error loading community', error);
  //     // return goto(isLMS ? '/lms' : $currentOrgPath);
  //   }

  //   lmsDiscussions =
  //     data?.map((lmsDiscussion) => ({
  //       title: lmsDiscussion.title,
  //       slug: lmsDiscussion.slug,
  //       author: lmsDiscussion?.author?.fullname,
  //       comments: lmsDiscussion.comments?.[0]?.count || 0,
  //       votes: lmsDiscussion.votes,
  //       createdAt: calDateDiff(lmsDiscussion.created_at)
  //     })) || [];
  // }

  async function fetchCommunityQuestions(orgId?: string) {
    if (!orgId) return;
    isLoading = true;
    const { data, error } = await supabase
      .from('community_question')
      .select(
        `
        organization_id,
        title,
        votes,
        created_at,
        slug,
        comments:community_answer(count),
        author:profile(
          fullname
        )
      `
      )
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    console.log('data', data);
    console.log('error', error);
    isLoading = false;

    if (error) {
      console.error('Error loading community', error);
      return goto(isLMS ? '/lms' : $currentOrgPath);
    }

    discussions =
      data?.map((discussion) => ({
        title: discussion.title,
        slug: discussion.slug,
        author: discussion?.author?.fullname,
        comments: discussion.comments?.[0]?.count || 0,
        votes: discussion.votes,
        createdAt: calDateDiff(discussion.created_at)
      })) || [];
  }

  $: fetchCommunityQuestions($currentOrg.id);
  // $: fetchCommunityQuestionsForLMS($currentOrg.id, $course.id);
</script>

<div
  class="flex items-center justify-center lg:justify-start flex-wrap my-4 m-auto border-c rounded bg-gray-100 dark:bg-neutral-800"
>
  {#if isLoading}
    <CommunityLoader />
    <CommunityLoader />
    <CommunityLoader />
    <CommunityLoader />
  {:else if isLMS}
    {#each lmsDiscussions as discussion}
      <div class="w-full flex border-bottom-c p-5">
        <Vote value={discussion.votes} />
        <div class="discussion-topic-author">
          <h4>
            <a
              class="text-black dark:text-white"
              href="{isLMS ? '/lms' : $currentOrgPath}/community/{discussion.slug}"
            >
              {discussion.title}
            </a>
          </h4>
          <span class="text-gray-600 dark:text-white">
            {discussion.author} asked {discussion.createdAt}
          </span>
        </div>
        <Space />
        <div class="flex items-center">
          <AddCommentIcon size={20} />
          <span class="ml-1">{discussion.comments}</span>
        </div>
      </div>
    {:else}
      <Box className="w-screen">
        <CoursesEmptyIcon />
        <h3 class="dark:text-white text-2xl my-5">No Questions asked</h3>
        <p class="dark:text-white w-1/3 text-center">Ask a question to the community</p>
      </Box>
    {/each}
  {:else}
    {#each discussions as discussion}
      <div class="w-full flex border-bottom-c p-5">
        <Vote value={discussion.votes} />
        <div class="discussion-topic-author">
          <h4>
            <a
              class="text-black dark:text-white"
              href="{isLMS ? '/lms' : $currentOrgPath}/community/{discussion.slug}"
            >
              {discussion.title}
            </a>
          </h4>
          <span class="text-gray-600 dark:text-white">
            {discussion.author} asked {discussion.createdAt}
          </span>
        </div>
        <Space />
        <div class="flex items-center">
          <AddCommentIcon size={20} />
          <span class="ml-1">{discussion.comments}</span>
        </div>
      </div>
    {:else}
      <Box className="w-screen">
        <CoursesEmptyIcon />
        <h3 class="dark:text-white text-2xl my-5">No Questions asked</h3>
        <p class="dark:text-white w-1/3 text-center">Ask a question to the community</p>
      </Box>
    {/each}
  {/if}
</div>

<style>
  h4 {
    font-size: 16px;
    font-weight: 900;
    word-break: break-word;
    overflow-wrap: break-word;
    margin: 0;
  }

  .discussion-topic-author {
    margin-right: 20px;
  }
  .discussion-topic-author span {
    font-size: 12px;
  }
</style>
