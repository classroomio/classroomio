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

  export let isLMS = false;

  let isLoading = false;
  let discussions = [];

  async function fetchCommunityQuestions(orgId?: string) {
    if (!orgId) return;
    isLoading = true;
    const { data, error } = await supabase
      .from('community_question')
      .select(
        `
        organization_id,
        course_id,
        title,
        votes,
        created_at,
        slug,
        comments:community_answer(count),
        author:profile(
          fullname
        ),
        course_title:course(
          title
        )
      `
      )
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false });
    console.log('data', data);
    console.log('error', error);
    console.log();

    isLoading = false;

    if (error) {
      console.error('Error loading community', error);
      return goto(isLMS ? '/lms' : $currentOrgPath);
    }

    discussions =
      data?.map((discussion) => ({
        title: discussion.title,
        course_id: discussion.course_id,
        course_title: discussion.course_title.title,
        slug: discussion.slug,
        author: discussion?.author?.fullname,
        comments: discussion.comments?.[0]?.count || 0,
        votes: discussion.votes,
        createdAt: calDateDiff(discussion.created_at)
      })) || [];
  }

  $: fetchCommunityQuestions($currentOrg.id);
</script>

<div
  class="flex items-center justify-center lg:justify-start flex-wrap my-4 m-auto border-c rounded bg-gray-100 dark:bg-neutral-800"
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
        <div class="discussion-topic-author flex flex-col gap-y-0.5">
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
          <a
            class="text-gray-600 dark:text-white text-xs"
            href={isLMS
              ? `/lms/courses/${discussion.course_id}`
              : `/courses/${discussion.course_id}`}
          >
            {discussion.course_title}
          </a>
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
