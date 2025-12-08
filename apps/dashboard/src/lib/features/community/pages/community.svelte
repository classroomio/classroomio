<script lang="ts">
  import { untrack } from 'svelte';
  import { goto } from '$app/navigation';
  import * as Select from '@cio/ui/base/select';
  import { Search } from '@cio/ui/custom/search';
  import MessageCirclePlusIcon from '@lucide/svelte/icons/message-circle-plus';

  import { profile } from '$lib/utils/store/user';
  import { t } from '$lib/utils/functions/translations';
  import { courses } from '$lib/features/course/utils/store';
  import { calDateDiff } from '$lib/utils/functions/date';
  import { supabase } from '$lib/utils/functions/supabase';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { currentOrg, currentOrgPath } from '$lib/utils/store/org';
  import MessageSquareMoreIcon from '@lucide/svelte/icons/message-square-more';

  import { CommunityListLoader } from '../components';
  import Vote from '$lib/components/Vote/index.svelte';
  import { Empty } from '@cio/ui/custom/empty';
  import * as Page from '@cio/ui/base/page';
  import * as Item from '@cio/ui/base/item';

  import { AskCommunityButton } from '../components';

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

<Page.BodyHeader>
  <Search placeholder={$t('community.find_question')} bind:value={searchValue} />

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
</Page.BodyHeader>

{#if isLoading}
  <CommunityListLoader />
  <CommunityListLoader />
  <CommunityListLoader />
  <CommunityListLoader />
{:else}
  {#each filteredDiscussions as discussion}
    <Item.Root variant="outline">
      {#snippet child({ props })}
        <a href="{isLMS ? '/lms' : $currentOrgPath}/community/{discussion.slug}" {...props}>
          <Vote value={discussion.votes} />
          <Item.Content class="gap-y-0.5">
            <Item.Title class="mt-0">
              {discussion.title}
            </Item.Title>
            <Item.Description>
              {discussion.author} asked {discussion.createdAt}
            </Item.Description>
            <a class="m-0" href="/courses/{discussion.courseId}" onclick={(e) => e.stopPropagation()}>
              <span class="text-muted-foreground p-0 text-xs">
                #{discussion.courseTitle}
              </span>
            </a>
          </Item.Content>
          <Item.Actions>
            <div class="flex items-center">
              <MessageCirclePlusIcon size={16} />
              <span class="ml-1">{discussion.comments}</span>
            </div>
          </Item.Actions>
        </a>
      {/snippet}
    </Item.Root>
  {:else}
    <Empty
      title={$t('community.no_question')}
      description={$t('community.ask_a_question')}
      icon={MessageSquareMoreIcon}
      variant="page"
    >
      <AskCommunityButton />
    </Empty>
  {/each}
{/if}
