<script lang="ts">
  import { NextFilled } from 'carbon-icons-svelte';
  import EmptyState from '../EmptyState.svelte';
  import PrimaryButton from '../PrimaryButton.svelte';
  import { courses } from '@/utils/stores/course';
  import CourseCard from '../CourseCard.svelte';
  import type { Course, CourseFilterItem } from '@/utils/types/course';
  import type { Page } from '$lib/utils/types/page';
  import { COURSE_TYPE } from '@/utils/constants/course';
  import { getPageSection } from '@/utils/helpers/page';

  interface Props {
    data: {
      page: Page;
      sharedPage: Page;
      courses: Course[];
    };
  }

  let viewAllCourses = $state(false);

  function getCourseUrl(slug: string) {
    return `/pathway/${slug}`;
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

<main class="overflow-x-hidden">
  {#if section.header?.show}
    <section class="flex h-screen items-center justify-center py-10">
      <section class="flex flex-col items-start gap-10 p-4 text-center md:items-center">
        <div class="w-full space-y-6">
          <p
            class="mx-auto w-full font-serif text-3xl font-medium text-[#3D3D3D] md:w-[60%] md:text-4xl"
          >
            {section.header.settings.title}
          </p>

          <p class="mx-auto w-full font-normal text-[#656565] md:w-[70%]">
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
          <p class=" w-full text-sm font-medium text-[#878787] md:w-[80%]">
            {section.courses.settings.subtitle}
          </p>
        </span>
        <div class=" w-full md:w-fit">
          <div class="flex w-full items-center gap-1 bg-[#F7F7F7] p-2 md:gap-4">
            <p class="whitespace-nowrap text-sm font-medium md:text-base">Filter by</p>
            <div class="flex w-full flex-row items-center bg-white p-1 md:w-fit">
              {#each filter as item}
                <label
                  for={item.title}
                  class="flex flex-row items-center whitespace-nowrap rounded-md bg-[#FDFDFD] p-2 text-xs font-medium text-[#3C4043]"
                >
                  <input type="checkbox" name={item.title} class="text-ielts mr-2" />

                  {item.title}
                </label>
              {/each}
            </div>
          </div>
        </div>
      </div>

      <div>
        {#if $courses.length > 0}
          <section class="flex flex-wrap items-center justify-center gap-4 p-4 md:justify-start">
            {#each $courses.slice(0, viewAllCourses ? $courses.length : 3) as courseData}
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
                onClick={() => (viewAllCourses = !viewAllCourses)}
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
  <!-- pathways -->
  <!-- <div class="bg-white py-10 px-2 md:px-10 lg:px-20">
      <div class="text-start mb-4 px-4 py-4">
        <p class="text-2xl md:text-3xl mb-4 font-serif">Prep Course Packages</p>
        <p class=" text-[#878787] text-sm font-medium w-full md:w-[80%]">
          We offer tailored packages that group similar prep courses to suit your specific goals and
          needs.
        </p>
        <div>
          {#if $courseMetaDeta.isLoading}
            <div class="cards-container my-4 mx-2">
              <CardLoader />
              <CardLoader />
              <CardLoader />
            </div>
          {:else if $courses.length > 0}
            <section class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
              {#each $courses.slice(0, viewAllPath ? $courses.length : 3) as courseData}
                <div
                  class="relative flex flex-col justify-between gap-4 p-4 h-[400px] min-w-[280px] max-w-[400px] md:max-h-[500px] rounded-lg bg-cover"
                  style="background-image: url('/org-banner.png');"
                >
                  <div class="absolute bg-black/30 w-full h-full top-0 left-0" />
                  <div class="text-white space-y-2 z-10">
                    <p class="font-serif font-medium text-xl uppercase line-clamp-2">
                      {courseData.title}
                    </p>
                    <p>{courseData.description}</p>
                  </div>

                  <a href={getCourseUrl(courseData.slug)} class="hover:no-underline z-10">
                    <div
                      class=" flex items-center justify-between uppercase font-medium text-white text-start w-full bg-[#0233BD]/90 p-3 cursor-pointer hover:scale-90 transition-all duration-200"
                    >
                      Register here
                      <NextFilled size={24} class="fill-white stroke-black" />
                    </div>
                  </a>
                </div>
              {/each}
            </section>
            {#if $courses.length > 3}
              <div class="w-full flex items-center justify-center my-5">
                <PrimaryButton
                  label="VIEW MORE PACKAGES"
                  variant={VARIANTS.NONE}
                  className="rounded-none text-lg !bg-[#0233BD] text-white font-semibold"
                  onClick={() => (viewAllPath = !viewAllPath)}
                />
              </div>
            {/if}
          {:else}
            <div class="px-10">
              <EmptyState  />
            </div>
          {/if}
        </div>
      </div>
     
    </div> -->
</main>
