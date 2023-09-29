<script lang="ts">
  import { Search } from 'carbon-components-svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';
  import Courses from '$lib/components/Courses/index.svelte';
  import { courses } from '$lib/components/Courses/store';

  const tabs = [
    {
      label: 'In progress',
      value: 1
    },
    {
      label: 'Complete',
      value: 2
    }
  ];
  let currentTab = tabs[0].value;

  const onChange =
    (tab = 0) =>
    () =>
      (currentTab = tab);
</script>

<section class="max-w-6xl mx-auto">
  <div class="m-2 md:m-5">
    <div role="searchbox" class=" bg-gray-100 w-full md:w-[60%] lg:w-[30%]">
      <Search placeholder="Search courses" class="dark:text-black" />
    </div>
    <h1 class="text-3xl font-semibold my-4">My Learning</h1>
    <Tabs {tabs} {currentTab} {onChange}>
      <slot:fragment slot="content">
        <TabContent value={tabs[0].value} index={currentTab}>
          <Courses courses={$courses} />
        </TabContent>
        <TabContent value={tabs[1].value} index={currentTab}>
          <Courses courses={[]} />
        </TabContent>
      </slot:fragment>
    </Tabs>
  </div>
</section>
