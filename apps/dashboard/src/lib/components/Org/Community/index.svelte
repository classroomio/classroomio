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
  import { fetchCourses } from '$lib/components/Courses/api';
  import { profile } from '$lib/utils/store/user';
  import TextChip from '$lib/components/Chip/Text.svelte';
  import { Search, Dropdown } from 'carbon-components-svelte';

  export let isLMS = false;

  let isLoading = false;
  let discussions = [];
  let searchValue = '';
  let allCourses: any[] = [];
  let selectedId = '';

  async function fetchCommunityQuestions(orgId?: string, profileId?: string) {
    if (!orgId || !profileId) return;
    isLoading = true;

    const courseResult = (await fetchCourses(profileId, orgId)) || { allCourses: [] };
    allCourses = courseResult.allCourses;

    const courseIds = allCourses.map((course) => course.id);
    const courseIdsFilter = `(${courseIds.join(',')})`;

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
        course!inner (
          title
        )
      `
      )
      .filter('course_id', 'in', courseIdsFilter)
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
        courseId: discussion.course_id,
        courseTitle: discussion.course?.title,
        slug: discussion.slug,
        author: discussion?.author?.fullname,
        comments: discussion.comments?.[0]?.count || 0,
        votes: discussion.votes,
        createdAt: calDateDiff(discussion.created_at)
      })) || [];
  }

  $: fetchCommunityQuestions($currentOrg.id, $profile.id);
  $: filteredDiscussions = discussions.filter(
    (discussion) =>
      discussion.title.toLowerCase().includes(searchValue.toLowerCase()) &&
      (!selectedId || discussion.courseId === selectedId)
  );
</script>

<div class="flex justify-between">
  <Search
    placeholder="Find Question"
    bind:value={searchValue}
    searchClass="mr-2"
    class=" bg-gray-100 dark:bg-neutral-800"
  />
  <Dropdown
    class="w-[25%]"
    size="xl"
    label="Select Course"
    items={allCourses.map((course) => ({ id: course.id, text: course.title }))}
    bind:selectedId
    on:select={(event) => {
      const { selectedId } = event.detail;
    }}
  />
</div>
<div
  class="flex items-center justify-center lg:justify-start flex-wrap my-4 m-auto border-c rounded bg-gray-100 dark:bg-neutral-800"
>
  {#if isLoading}
    <CommunityLoader />
    <CommunityLoader />
    <CommunityLoader />
    <CommunityLoader />
  {:else if filteredDiscussions.length > 0}
    {#each filteredDiscussions as discussion}
      <div class="w-full flex border-bottom-c p-3">
        <Vote value={discussion.votes} />
        <div class="discussion-topic-author flex flex-col gap-y-0.5">
          <a class="m-0" href="/courses/{discussion.courseId}">
            <span class="text-xs text-primary-200 dark:text-black text-primary-700 p-0 underline">
              #{discussion.courseTitle}
            </span>
          </a>
          <h4 class="mt-0">
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
