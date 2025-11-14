<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import { Input } from '@cio/ui/base/input';
  import * as Select from '@cio/ui/base/select';
  import Search from '@lucide/svelte/icons/search';
  import MessageCirclePlusIcon from '@lucide/svelte/icons/message-circle-plus';

  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { courses } from '$lib/components/Courses/store';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { supabase } from '$lib/utils/functions/supabase';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';

  import CommunityLoader from './Loader.svelte';
  import Box from '$lib/components/Box/index.svelte';
  import Vote from '$lib/components/Vote/index.svelte';
  import CoursesEmptyIcon from '$lib/components/Icons/CoursesEmptyIcon.svelte';

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

  $effect(() => {
    console.log('allCourses', allCourses);
  });

  let filteredDiscussions = $derived(
    discussions.filter(
      (discussion) =>
        discussion.title.toLowerCase().includes(searchValue.toLowerCase()) &&
        (!selectedId || discussion.courseId === selectedId)
    )
  );
</script>

<div class="flex w-full gap-2">
  <div class="relative flex-1">
    <Search class="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    <Input
      type="text"
      placeholder={$t('community.find_question')}
      bind:value={searchValue}
      class="bg-gray-100 dark:bg-neutral-800"
    />
  </div>
  <div class="w-[25%] border">
    <Select.Root type="single" bind:value={selectedId}>
      <Select.Trigger class="w-full bg-gray-100 dark:bg-neutral-800">
        <p class="truncate">
          {selectedId ? allCourses.find((course) => course.id === selectedId)?.title : $t('community.all')}
        </p>
      </Select.Trigger>
      <Select.Content>
        <Select.Item value="">{$t('community.all')}</Select.Item>
        {#each allCourses as course}
          <Select.Item value={course.id}>{course.title}</Select.Item>
        {/each}
      </Select.Content>
    </Select.Root>
  </div>
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
          <MessageCirclePlusIcon size={16} />
          <span class="ml-1">{discussion.comments}</span>
        </div>
      </div>
    {:else}
      <Box className="w-screen">
        <CoursesEmptyIcon size={16} />
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
