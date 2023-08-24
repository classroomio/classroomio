<script>
  import TextField from '$lib/components/Form/TextField.svelte';

  import { Search } from 'carbon-components-svelte';
  import AllLearning from '$lib/components/LMS/components/AllLearning.svelte';
  import Completed from '$lib/components/LMS/components/Completed.svelte';
  import InProgress from '$lib/components/LMS/components/InProgress.svelte';
  import Tabs from '$lib/components/Tabs/index.svelte';
  import TabContent from '$lib/components/TabContent/index.svelte';

  // let tabs = CONSTANTS.tabs;

  const tabs = [
    {
      label: 'All',
      value: 1
    },
    {
      label: 'In progress',
      value: 2
    },
    {
      label: 'Complete',
      value: 3
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
          <AllLearning />
        </TabContent>
        <TabContent value={tabs[1].value} index={currentTab}>
          <InProgress />
        </TabContent>
        <TabContent value={tabs[2].value} index={currentTab}>
          <Completed />
        </TabContent>
      </slot:fragment>
    </Tabs>
  </div>
</section>
