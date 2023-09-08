<script>
  import { goto } from '$app/navigation';
  import dayjs from 'dayjs';
  import relativeTime from 'dayjs/plugin/relativeTime';
  import AddCommentIcon from 'carbon-icons-svelte/lib/AddComment.svelte';
  import CommunityLoader from './Loader.svelte';
  import Vote from '$lib/components/Vote/index.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import Space from '$lib/components/Space/index.svelte';
  import { currentOrgPath, currentOrg } from '$lib/utils/store/org';
  import { supabase } from '$lib/utils/functions/supabase';

  export let isLMS = false;

  let isLoading = false;
  let discussions = [];

  dayjs.extend(relativeTime);

  async function fetchCommunityQuestions(orgId) {
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
        author:organizationmember!community_question_author_id_fkey!inner(
          profile!inner(fullname)
        )
      `
      )
      .eq('organization_id', orgId);
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
        author: discussion?.author?.profile?.fullname,
        comments: discussion.comments?.[0]?.count || 0,
        votes: discussion.votes,
        createdAt: dayjs(discussion.created_at).fromNow(true)
      })) || [];
  }

  $: fetchCommunityQuestions($currentOrg.id);
</script>

<div
  class="flex items-center justify-center lg:justify-start flex-wrap my-4 m-auto border-c rounded bg-gray-100 dark:bg-gray-700"
>
  {#if isLoading}
    <CommunityLoader />
    <CommunityLoader />
    <CommunityLoader />
    <CommunityLoader />
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
