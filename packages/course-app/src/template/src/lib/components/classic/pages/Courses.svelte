<script lang="ts">
  import { Button } from '@/components/ui/button';
  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import { COURSE_TYPE } from '@/utils/constants/course';
  import { getPageSection } from '@/utils/helpers/page';
  import type { Course, CourseFilterItem } from '@/utils/types/course';
  import type { Page } from '$lib/utils/types/page';

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
  }
</script>

<section class="overflow-x-hidden">
  {#if section.header?.show}
    <div
      class="h-full pt-20 pb-36 flex flex-col items-center justify-center text-center w-full bg-gradient-to-r from-[#f0a5f11a] via-white to-[#f6e7f61a]"
    >
      <h1 class="font-bold text-5xl mb-4 w-full md:w-[50%] text-center">
        {section.header.settings.title}
        <span class="text-[#CE02CE]/80 font-bold text-5xl">
          {section.header.settings.titleHighlight}</span
        >
      </h1>
      <p class="md:text-xl text-[#878787] w-full md:w-[60%] lg:w-[40%] text-center">
        {section.header.settings.subtitle}
      </p>
    </div>
  {/if}

  {#if section.courses?.show}
    <section id="course" class="px-4 pt-4 pb-20 h-full bg-white">
      <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-6 w-full md:w-[60%] mx-auto">
        {section.courses.settings.title}
      </h1>
      <div class="w-full md:w-[90%] mx-auto">
        {#if data.courses.length > 0}
          <div class="w-full flex gap-4 lg:ml-[5%]">
            <div class="hidden lg:block w-fit space-y-2">
              <p class="font-medium text-[#3C4043] uppercase">Filter</p>
              <div class="w-max border border-[#EAEAEA] p-6 space-y-8">
                {#each filter as item}
                  <form class="space-x-2 text-[#3C4043]">
                    <input
                      type="checkbox"
                      name={item.title}
                      checked={item.checked}
                      onchange={applyFilter}
                    />
                    <label for={item.title}>{item.title}</label>
                  </form>
                {/each}
              </div>
            </div>
            <section
              class="grid place-items-center grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full"
            >
              {#each filteredCourses.slice(0, viewAll ? filteredCourses.length : 3) as courseData}
                <CourseCard
                  slug={courseData.slug}
                  bannerImage={courseData.banner ?? './classroomio-courseData-img-template.jpg'}
                  title={courseData.title}
                  type={courseData.type}
                  description={courseData.description}
                  cost={courseData.cost}
                  currency={courseData.currency}
                  totalLessons={courseData.lessonsCount}
                />
              {/each}
              {#if filteredCourses.length == 0}
                <div class="px-4 w-full mx-auto">
                  <EmptyState headerClassName="text-[#CE02CE]" />
                </div>
              {/if}
            </section>
            {#if filteredCourses.length > 3}
              <div class="w-full flex items-center justify-center my-5">
                <Button
                  class="text-lg font-semibold text-white !bg-[#CE02CE]"
                  on:click={() => (viewAll = !viewAll)}>View more programs</Button
                >
              </div>
            {/if}
          </div>
        {:else}
          <div class="px-4 w-full lg:w-[70%] mx-auto">
            <EmptyState headerClassName="text-[#CE02CE]" />
          </div>
        {/if}
      </div>
    </section>
  {/if}
</section>
