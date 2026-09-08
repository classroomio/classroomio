<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import { resolve } from '$app/paths';
  import { page } from '$app/state';
  import { onMount, untrack } from 'svelte';
  import AwardIcon from '@lucide/svelte/icons/award';
  import BookOpenIcon from '@lucide/svelte/icons/book-open';
  import ClockIcon from '@lucide/svelte/icons/clock';
  import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
  import { Badge } from '@cio/ui/base/badge';
  import { Button } from '@cio/ui/base/button';
  import { Empty } from '@cio/ui/custom/empty';
  import * as UnderlineTabs from '@cio/ui/custom/underline-tabs';

  import { t } from '$lib/utils/functions/translations';
  import { StudentCourseCard, StudentGradesTable, StudentProfileRail } from '../components';
  import type { AudienceAnalytics } from '../utils/types';

  type ProfileTab = 'courses' | 'grades' | 'activity';

  function normalizeTab(tabParam: string | null): ProfileTab {
    if (tabParam === 'grades') return 'grades';
    if (tabParam === 'activity') return 'activity';

    return 'courses';
  }

  let {
    data
  }: {
    data: {
      analytics: AudienceAnalytics | null;
      loadFailed: boolean;
    };
  } = $props();

  let selectedTab: ProfileTab = $state('courses');

  onMount(() => {
    selectedTab = normalizeTab(page.url.searchParams.get('tab'));
  });

  $effect(() => {
    const nextTab = normalizeTab(page.url.searchParams.get('tab'));
    if (nextTab === untrack(() => selectedTab)) return;
    selectedTab = nextTab;
  });

  $effect(() => {
    const currentTab = page.url.searchParams.get('tab') ?? '';
    if (currentTab === selectedTab) return;

    untrack(() => {
      const url = new URL(page.url);
      url.searchParams.set('tab', selectedTab);
      goto(resolve(`${url.pathname}${url.search}`, {}), {
        replaceState: true,
        keepFocus: true,
        noScroll: true
      });
    });
  });

  async function handleRetry() {
    await invalidateAll();
  }
</script>

{#if data.loadFailed}
  <Empty
    variant="page"
    icon={TriangleAlertIcon}
    title={$t('audience.user_analytics.load_failed_title')}
    description={$t('audience.user_analytics.load_failed_description')}
  >
    {#snippet children()}
      <Button onclick={handleRetry}>{$t('audience.user_analytics.retry')}</Button>
    {/snippet}
  </Empty>
{:else if data.analytics}
  <div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-[19rem_1fr]">
    <StudentProfileRail analytics={data.analytics} />

    <UnderlineTabs.Root bind:value={selectedTab}>
      <UnderlineTabs.List>
        <UnderlineTabs.Trigger value="courses">
          <BookOpenIcon />
          {$t('audience.user_analytics.tabs.courses')}
          <Badge variant="secondary" class="ui:tabular-nums">{data.analytics.courses.length}</Badge>
        </UnderlineTabs.Trigger>
        <UnderlineTabs.Trigger value="grades">
          <AwardIcon />
          {$t('audience.user_analytics.tabs.grades')}
        </UnderlineTabs.Trigger>
        <UnderlineTabs.Trigger value="activity">
          <ClockIcon />
          {$t('audience.user_analytics.tabs.activity')}
        </UnderlineTabs.Trigger>
      </UnderlineTabs.List>

      <UnderlineTabs.Content value="courses" class="pt-3">
        {#if data.analytics.courses.length === 0}
          <Empty
            variant="page"
            icon={BookOpenIcon}
            title={$t('audience.user_analytics.no_courses_title')}
            description={$t('audience.user_analytics.no_courses_description')}
          />
        {:else}
          <div class="grid grid-cols-1 gap-3 2xl:grid-cols-2">
            {#each data.analytics.courses as course (course.id)}
              <StudentCourseCard {course} />
            {/each}
          </div>
        {/if}
      </UnderlineTabs.Content>

      <UnderlineTabs.Content value="grades" class="pt-3">
        {#if data.analytics.courses.length === 0}
          <Empty
            variant="page"
            icon={AwardIcon}
            title={$t('audience.user_analytics.no_grades_title')}
            description={$t('audience.user_analytics.no_grades_description')}
          />
        {:else}
          <StudentGradesTable courses={data.analytics.courses} studentId={data.analytics.user.id} />
        {/if}
      </UnderlineTabs.Content>

      <UnderlineTabs.Content value="activity" class="pt-3">
        <Empty
          variant="page"
          icon={ClockIcon}
          title={$t('audience.user_analytics.activity_empty_title')}
          description={$t('audience.user_analytics.activity_empty_description')}
        />
      </UnderlineTabs.Content>
    </UnderlineTabs.Root>
  </div>
{/if}
