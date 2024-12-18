<script lang="ts">
  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import { Button } from '$lib/components/ui/button';
  import { getPageSection } from '$lib/utils/helpers/page';
  import type { CourseFilterItem, Course } from '$lib/utils/types/course';
  import type { Page } from '$lib/utils/types/page';
  import { COURSE_TYPE } from '@/utils/constants/course';
  import { SECTION } from '@/utils/constants/page';

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
    header: getPageSection(data.page, SECTION.HERO),
    courses: getPageSection(data.page, SECTION.COURSE)
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

<main class="bg-posthog-background overflow-x-hidden dark:bg-black dark:text-white">
  {#if section.header?.show}
    <section class="flex min-h-full items-center justify-center px-4 py-10 md:px-14">
      <section
        class="mx-auto w-full space-y-4 rounded-md bg-[#E5E7E0] px-4 py-20 text-center dark:bg-[#232429] lg:w-[70%] lg:px-10"
      >
        <div class="relative flex flex-col items-center gap-8 rounded-lg">
          <span class="absolute -top-14 left-3 h-2 w-2 rounded-full bg-red-500"></span>
          <span class="absolute -left-10 top-10 h-2 w-2 rounded-full bg-white"></span>
          <span class="absolute -right-3 -top-10 h-2 w-2 rounded-full bg-yellow-500"></span>
          <span class="absolute -right-10 top-14 h-2 w-2 rounded-full bg-blue-800"></span>

          <p class="w-full text-center text-3xl font-bold md:w-[90%] md:text-5xl">
            {section.header.settings.title}
            <span class="text-[#F54E00]">{section.header.settings.titleHighlight}</span>
          </p>

          <p class="w-full text-center text-lg text-[#878787] md:w-[70%]">
            {section.header.settings.subtitle}
          </p>
        </div>
      </section>
    </section>
  {/if}

  <section id="course" class="h-full px-2 py-20 lg:px-16">
    <div class="relative mt-2 flex w-full flex-row items-start justify-start lg:gap-2">
      {#if data.courses.length > 0}
        <div class="flex w-full gap-2">
          <div class="hidden min-w-max lg:block">
            <p class="mb-4 font-semibold">Filter by</p>
            <div class="w-full space-y-2">
              {#each filter as item}
                <form
                  class="space-x-2 rounded-md border border-[#EAEAEA] bg-[#FDFDFD] px-4 py-4 font-medium text-[#3C4043] dark:border-[#232429] dark:bg-[#232429] dark:text-white"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    name={item.title}
                    onchange={applyFilter}
                    class="accent-[#F54E00] focus:ring-0 dark:accent-[#EB9D2A]"
                  />

                  <label for={item.title} class="whitespace-nowrap">{item.title}</label>
                </form>
              {/each}
            </div>
          </div>

          <div class="max-h-screen w-full p-4 md:p-8">
            <section class="flex w-full flex-wrap items-center justify-center gap-4">
              {#each filteredCourses.slice(0, viewAll ? filteredCourses.length : 3) as courseData}
                <CourseCard
                  slug={courseData.slug}
                  title={courseData.title}
                  description={courseData.description}
                />
              {/each}
            </section>

            {#if filteredCourses.length == 0}
              <div class="mx-auto w-full px-4">
                <EmptyState />
              </div>
            {/if}
          </div>

          {#if filteredCourses.length > 3}
            <div class="my-5 flex w-full items-center justify-center">
              <Button
                on:click={() => (viewAll = !viewAll)}
                class="mb-4 bg-transparent font-bold uppercase text-black shadow-[0px_3px_#B17816] ring-1 ring-[#B17816] hover:scale-95 hover:bg-[#EB9D2A] dark:bg-[#EB9D2A] dark:text-black"
                >{viewAll === true ? 'Show less' : 'View more courses'}</Button
              >
            </div>
          {/if}
        </div>
      {:else}
        <div class="mx-auto w-full px-4 lg:w-[70%]">
          <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" type="course" />
        </div>
      {/if}
    </div>
  </section>
</main>
