<script lang="ts">
  import { Search } from 'carbon-components-svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import Courses from '$lib/components/Courses/index.svelte';
  import { fetchCourses } from '$lib/utils/services/courses';
  import { profile } from '$lib/utils/store/user';
  import { currentOrg } from '$lib/utils/store/org';
  import { courses, courseMetaDeta, coursesComplete } from '$lib/components/Courses/store';
  import { browser } from '$app/environment';
  import { t } from '$lib/utils/functions/translations';

  const tabs = [
    {
      label: $t('my_learning.progress'),
      value: 1
    },
    {
      label: $t('my_learning.complete'),
      value: 2
    }
  ];
  let currentTab = tabs[0].value;
  let hasFetched = false;

  function onChange(tab: 0) {
    return () => (currentTab = tab);
  }

  async function getCourses(userId: string | null, orgId: string) {
    if (hasFetched || !userId || !orgId) {
      return;
    }
    hasFetched = true;

    // only show is loading when fetching for the first time
    if (!$courses.length) {
      $courseMetaDeta.isLoading = true;
    }

    const coursesResult = await fetchCourses(userId, orgId);
    console.log(`get courses result`, coursesResult);

    $courseMetaDeta.isLoading = false;
    if (!coursesResult) return;

    courses.set(coursesResult.allCourses);
    hasFetched = true;
  }

  $: if (browser && $profile.id && $currentOrg.id) {
    getCourses($profile.id, $currentOrg.id);
  }
</script>

<section class="max-w-6xl mx-auto">
  <div class="m-2 md:m-5">
    <div role="searchbox" class=" bg-gray-100 w-full md:w-[60%] lg:w-[30%]">
      <Search placeholder={$t('my_learning.search')} class="dark:text-black" />
    </div>
    <h1 class="text-3xl font-semibold my-4">{$t('my_learning.heading')}</h1>
    <Tabs {tabs} {currentTab} {onChange}>
      <slot:fragment slot="content">
        <TabContent value={tabs[0].value} index={currentTab}>
          <Courses
            courses={$courses}
            emptyTitle={$t('my_learning.not_in_progress')}
            emptyDescription={$t('my_learning.any_progress')}
          />
        </TabContent>
        <TabContent value={tabs[1].value} index={currentTab}>
          <Courses
            courses={$coursesComplete}
            emptyTitle={$t('my_learning.not_completed')}
            emptyDescription={$t('my_learning.any_course')}
          />
        </TabContent>
      </slot:fragment>
    </Tabs>
  </div>
</section>
