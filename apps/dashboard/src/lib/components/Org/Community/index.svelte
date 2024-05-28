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
  import { Search, Dropdown } from 'carbon-components-svelte';
  import { t } from '$lib/utils/functions/translations';
  import { courses } from '$lib/components/Courses/store';

  export let isLMS = false;

  let isLoading = false;
  let discussions = [];
  let searchValue = '';
  let allCourses: any[] = [];
  let selectedId = '';

  async function fetchCommunityQuestions(orgId?: string, profileId?: string) {
    if (!orgId || !profileId) return;
    isLoading = true;

    if ($courses.length) {
      allCourses = [...$courses];
    } else {
      const courseResult = (await fetchCourses(profileId, orgId)) || { allCourses: [] };
      allCourses = courseResult.allCourses;
    }

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
    placeholder={$t('community.find_question')}
    bind:value={searchValue}
    searchClass="mr-2"
    class=" bg-gray-100 dark:bg-neutral-800"
  />
  <Dropdown
    class="w-[25%] h-full"
    size="xl"
    label={$t('community.ask.select_course')}
    items={[
      { id: '', text: $t('community.all') },
      ...allCourses.map((course) => ({ id: course.id, text: course.title }))
    ]}
    bind:selectedId
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
  {:else}
    {#each filteredDiscussions as discussion}
      <div class="w-full flex border-bottom-c p-3">
        <Vote value={discussion.votes} />
        <div class="text-sm flex flex-col gap-y-0.5">
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
          <a class="m-0" href="/courses/{discussion.courseId}">
            <span class="text-xs text-primary-200 dark:text-black text-primary-700 p-0">
              #{discussion.courseTitle}
            </span>
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
        <h3 class="dark:text-white text-2xl my-5">{$t('community.no_question')}</h3>
        <p class="dark:text-white w-1/3 text-center">{$t('community.ask_a_question')}</p>
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
</style>
