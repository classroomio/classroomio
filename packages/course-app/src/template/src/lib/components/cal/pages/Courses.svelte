<script lang="ts">
  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import { Button } from '$lib/components/ui/button';
  import { getPageSection } from '$lib/utils/helpers/page';
  import { COURSE_TYPE } from '$lib/utils/constants/course';
  import type { CourseFilterItem, Course } from '$lib/utils/types/course';
  import type { Page } from '$lib/utils/types/page';
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

<!-- Header -->
<div class="w-full">
  {#if section.header?.show}
    <section
      style="background-image: url('calcom-background.svg');"
      class="bg-cover bg-center flex items-center justify-center py-10 px-2 lg:px-14 min-h-[30vh]"
    >
      <section class="flex flex-col text-center items-center gap-5 justify-center">
        <div class="space-y-6 w-full mb-4">
          <div class="bg-[#E5E7E0] py-1 px-4 md:border-b border-black rounded-sm w-fit mx-auto">
            <p class="uppercase font-bold text-xs lg:text-base text-[#0F163F]">
              {section.header.settings.title}
            </p>
          </div>
          <p class="w-full text-5xl font-bold md:w-[70%] mx-auto">
            {section.header.settings.titleHighlight}
          </p>
          <p class="w-full font-semibold text-lg md:w-[70%] mx-auto">
            {section.header.settings.subtitle}
          </p>
        </div>
      </section>
    </section>
  {/if}

  {#if section.courses?.show}
    <section id="course" class="px-2 pt-4 pb-20 h-full lg:px-16">
      <div class="relative w-full flex flex-row items-start justify-start lg:gap-2 mt-10">
        <!-- filter start -->
        <div class="hidden lg:block sticky top-0 min-w-max">
          <p class="font-semibold mb-4">Filter by</p>
          <div class="w-full space-y-2">
            {#each filter as item}
              <form
                class="space-x-2 text-[#3C4043] font-medium border border-[#D0D1C9] bg-[#F4F4F4] rounded-md pl-4 pr-8 py-4"
              >
                <input
                  type="checkbox"
                  bind:checked={item.checked}
                  name={item.title}
                  onchange={applyFilter}
                  class="focus:ring-0"
                />

                <label for={item.title} class="whitespace-nowrap">{item.title}</label>
              </form>
            {/each}
          </div>
        </div>
        <!-- filter end -->

        <div class="text-white rounded-3xl w-full h-full mx-auto">
          <!-- courses start -->
          <div class="w-full max-h-screen p-4 md:p-8">
            {#if data.courses.length > 0}
              <section class="flex flex-wrap items-center justify-center gap-4 w-full">
                {#each filteredCourses.slice(0, viewAll ? filteredCourses.length : 3) as course}
                  <CourseCard
                    slug={course.slug}
                    title={course.title}
                    bannerImage={course.banner}
                    description={course.description}
                  />
                {/each}
              </section>
              {#if filteredCourses.length == 0}
                <div class="px-4 w-full mx-auto">
                  <EmptyState />
                </div>
              {/if}
            {:else}
              <div class="px-4 w-full mx-auto">
                <EmptyState />
              </div>
            {/if}
          </div>
          <!-- courses end -->

          {#if filteredCourses.length > 2}
            <div class="w-full flex items-center justify-center py-8">
              <Button
                on:click={() => (viewAll = !viewAll)}
                class="uppercase rounded-2xl py-6  hover:bg-white hover:text-black border-[1.5px] border-white text-white shadow-[0px_3px_white]"
              >
                {viewAll === true ? 'Show less' : 'View more courses'}
              </Button>
            </div>
          {/if}
        </div>
      </div>
    </section>
  {/if}
  <!-- course end -->
</div>
