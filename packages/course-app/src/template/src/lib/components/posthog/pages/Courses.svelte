<script lang="ts">
  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import { Button } from '$lib/components/ui/button';
  import { getPageSection } from '$lib/utils/helpers/page';
  import type { CourseFilterItem, Course } from '$lib/utils/types/course';
  import type { Page } from '$lib/utils/types/page';
  import { COURSE_TYPE } from '@/utils/constants/course';

  interface Props {
    data: {
      page: Page;
      sharedPage: Page;
      courses: Course[];
    };
  }

  let { data }: Props = $props();

  /**
   * State
   */
  let viewAll = $state(false);

  let filter: CourseFilterItem[] = $state([
    {
      title: 'Self Paced',
      type: COURSE_TYPE.PACED,
      checked: false
    },
    {
      title: 'Live Sessions',
      type: COURSE_TYPE.LIVE,
      checked: false
    }
  ]);

  let filteredCourses = $state([...data.courses]);

  /**
   * Constants
   */
  const section = $derived({
    header: getPageSection(data.page, 'header'),
    courses: getPageSection(data.page, 'courses')
  });

  /**
   * Functions
   */
  function applyFilter() {
    const activeFilters = new Set(
      filter
        .filter((filterItem) => filterItem.checked)
        .map((filterItem) => filterItem.type.toLowerCase())
    );

    filteredCourses =
      activeFilters.size === 0
        ? data.courses
        : data.courses.filter((course) => activeFilters.has(course.type.toLowerCase()));
    console.log('filtered', filteredCourses);
  }
</script>

<main class="bg-[#EEEFE9] dark:bg-black dark:text-white overflow-x-hidden">
  {#if section.header?.show}
    <section class="flex items-center justify-center my-12 py-10 px-4 md:px-14 min-h-full">
      <section
        class="mx-auto text-center px-4 lg:px-10 py-20 space-y-4 bg-[#E5E7E0] dark:bg-[#232429] rounded-md w-full lg:w-[70%]"
      >
        <div class="flex flex-col items-center gap-8 relative rounded-lg">
          <span class="absolute w-2 h-2 rounded-full bg-red-500 -top-14 left-3"></span>
          <span class="absolute w-2 h-2 rounded-full bg-white top-10 -left-10"></span>
          <span class="absolute w-2 h-2 rounded-full bg-yellow-500 -top-10 -right-3"></span>
          <span class="absolute w-2 h-2 rounded-full bg-blue-800 top-14 -right-10"></span>

          <p class="text-center text-3xl md:text-5xl font-bold w-full md:w-[90%]">
            {section.header.settings.title}
            <span class="text-[#F54E00]">{section.header.settings.titleHighlight}</span>
          </p>

          <p class="text-center w-full text-lg text-[#878787] md:w-[70%]">
            {section.header.settings.subtitle}
          </p>
        </div>
      </section>
    </section>
  {/if}

  <section id="course" class=" pt-4 pb-20 h-full">
    <h1 class="text-center text-5xl mb-8 font-bold w-full md:w-[90%] lg:w-[70%] mx-auto">
      {section.header?.settings.title}
      <span class="text-[#F54E00] dark:text-[#EB9D2A]"
        >{section.header?.settings.titleHighlight}</span
      >
    </h1>

    <div class="w-full lg:w-[90%] mx-auto">
      {#if data.courses.length > 0}
        <div class="w-full flex gap-2 mt-10">
          <div class="hidden lg:block min-w-max">
            <p class="font-semibold mb-4">Filter by</p>
            <div class="w-full space-y-2">
              {#each filter as item}
                <form
                  class="space-x-2 text-[#3C4043] dark:text-white font-medium border border-[#EAEAEA] dark:border-[#232429] bg-[#FDFDFD] dark:bg-[#232429] rounded-md px-4 py-4"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    name={item.title}
                    onchange={applyFilter}
                    class=" dark:accent-[#EB9D2A] accent-[#F54E00] focus:ring-0"
                  />

                  <label for={item.title} class="whitespace-nowrap">{item.title}</label>
                </form>
              {/each}
            </div>
          </div>
          <section class="grid place-items-center grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {#each filteredCourses.slice(0, viewAll ? filteredCourses.length : 3) as courseData}
              <CourseCard
                slug={courseData.slug}
                title={courseData.title}
                description={courseData.description}
              />
            {/each}
          </section>

          {#if filteredCourses.length == 0}
            <div class="px-4 w-full mx-auto">
              <EmptyState />
            </div>
          {/if}
        </div>
        {#if filteredCourses.length > 3}
          <div class="w-full flex items-center justify-center my-5">
            <Button
              on:click={() => (viewAll = !viewAll)}
              class="dark:text-black bg-transparent uppercase text-black ring-1 ring-[#B17816] dark:bg-[#EB9D2A] hover:scale-95 hover:bg-[#EB9D2A] shadow-[0px_3px_#B17816] font-bold mb-4"
              >{viewAll === true ? 'Show less' : 'View more courses'}</Button
            >
          </div>
        {/if}
      {:else}
        <div class="px-4 w-full lg:w-[70%] mx-auto">
          <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" type="course" />
        </div>
      {/if}
    </div>
  </section>
</main>
