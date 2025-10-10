<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import Box from '$lib/components/Box/index.svelte';
  import { courses } from '$lib/components/Courses/store';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';
  import Vote from '$lib/components/Vote/index.svelte';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { supabase } from '$lib/utils/functions/supabase';
  import { t } from '$lib/utils/functions/translations';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import { profile } from '$lib/utils/store/user';
  import { Dropdown, Search } from 'carbon-components-svelte';
  import AddCommentIcon from 'carbon-icons-svelte/lib/AddComment.svelte';
  import CommunityLoader from './Loader.svelte';

  interface Props {
    isLMS?: boolean;
  }

  let { isLMS = false }: Props = $props();

  let isLoading = $state(false);
  let discussions = $state([]);
  let searchValue = $state('');
  let allCourses: any[] = $state([]);
  let selectedId = $state('');

  function fetchCommunityQuestions(orgId?: string, profileId?: string) {
    if (!orgId || !profileId) return;

    untrack(async () => {
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
    });
  }

  $effect(() => {
    fetchCommunityQuestions($currentOrg.id, $profile.id);
  });

  let filteredDiscussions = $derived(
    discussions.filter(
      (discussion) =>
        discussion.title.toLowerCase().includes(searchValue.toLowerCase()) &&
        (!selectedId || discussion.courseId === selectedId)
    )
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
    class="h-full w-[25%]"
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
  class="border-c m-auto my-4 flex flex-wrap items-center justify-center rounded bg-gray-100 lg:justify-start dark:bg-neutral-800"
>
  {#if isLoading}
    <CommunityLoader />
    <CommunityLoader />
    <CommunityLoader />
    <CommunityLoader />
  {:else}
    {#each filteredDiscussions as discussion}
      <div class="border-bottom-c flex w-full p-3">
        <Vote value={discussion.votes} />
        <div class="flex flex-col gap-y-0.5 text-sm">
          <h4 class="mt-0">
            <a class="text-black dark:text-white" href="{isLMS ? '/lms' : $currentOrgPath}/community/{discussion.slug}">
              {discussion.title}
            </a>
          </h4>
          <span class="text-gray-600 dark:text-white">
            {discussion.author} asked {discussion.createdAt}
          </span>
          <a class="m-0" href="/courses/{discussion.courseId}">
            <span class="text-primary-200 text-primary-700 p-0 text-xs dark:text-black">
              #{discussion.courseTitle}
            </span>
          </a>
        </div>
        <div class="flex-grow"></div>
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
