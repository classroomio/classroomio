<script lang="ts">
  import EmptyState from '../EmptyState.svelte';
  import PrimaryButton from '../PrimaryButton.svelte';
  import { courses } from '@/utils/stores/course';
  import CourseCard from '../CourseCard.svelte';
  import type { Course, CourseFilterItem } from '@/utils/types/course';
  import type { Page } from '$lib/utils/types/page';
  import { COURSE_TYPE } from '@/utils/constants/course';
  import { getPageSection } from '@/utils/helpers/page';
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
  }
</script>

<main class="overflow-x-hidden">
  {#if section.header?.show}
    <section class="flex h-[50vh] items-center justify-center py-20">
      <section class="flex flex-col items-start gap-10 p-4 text-center md:items-center">
        <div class="w-full space-y-6">
          <p
            class="mx-auto w-full font-serif text-3xl font-medium text-gray-800 md:w-[60%] md:text-4xl"
          >
            {section.header.settings.title}
          </p>

          <p class="mx-auto w-full font-normal text-gray-500 md:w-[70%]">
            {section.header.settings.subtitle}
          </p>
        </div>
      </section>
    </section>
  {/if}
  {#if section.courses?.show}
    <div class="border-b bg-white px-2 py-10 md:px-10 lg:px-20">
      <div class="mb-4 flex flex-col items-start justify-between md:flex-row md:items-center">
        <span class="mb-4 space-y-2 px-4 text-start lg:mb-0">
          <p class="mb-4 font-serif text-2xl md:text-3xl">{section.courses.settings.title}</p>
          <p class="w-full text-sm font-medium text-gray-500 md:w-[80%]">
            {section.courses.settings.subtitle}
          </p>
        </span>
        <div class="w-full md:w-fit">
          <div class="flex w-full items-center gap-1 bg-slate-100 p-2 md:gap-4">
            <p class="whitespace-nowrap text-sm font-medium md:text-base">Filter by</p>
            <div class="flex w-full flex-row items-center bg-white p-1 md:w-fit">
              {#each filter as item}
                <label
                  for={item.title}
                  class="flex flex-row items-center whitespace-nowrap rounded-md bg-white p-2 text-xs font-medium text-gray-800"
                >
                  <input type="checkbox" name={item.title} class="text-examprep mr-2" />

                  {item.title}
                </label>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <div>
        {#if $courses.length > 0}
          <section class="flex flex-wrap items-center justify-center gap-5 p-4 md:justify-start">
            {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
              <CourseCard
                slug={courseData.slug}
                title={courseData.title}
                description={courseData.description}
              />
            {/each}
          </section>
          {#if $courses.length > 3}
            <div class="my-5 flex w-full items-center justify-center">
              <PrimaryButton
                label="VIEW MORE PREPCOURSES"
                class="rounded-none text-lg font-semibold"
                onClick={() => (viewAll = !viewAll)}
              />
            </div>
          {/if}
        {:else}
          <div class="px-10">
            <EmptyState />
          </div>
        {/if}
      </div>
    </div>
  {/if}
</main>
