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
      id="courses-header"
      class="flex min-h-[30vh] items-center justify-center bg-cover bg-center px-2 py-10 lg:px-14"
    >
      <section class="flex flex-col items-center justify-center gap-5 text-center">
        <div class="mb-4 w-full space-y-6">
          <div class="mx-auto w-fit rounded-sm border-black bg-[#E5E7E0] px-4 py-1 md:border-b">
            <p class="text-xs font-bold uppercase text-[#0F163F] lg:text-base">
              {section.header.settings.title}
            </p>
          </div>
          <p class="mx-auto w-full text-5xl font-bold md:w-[70%]">
            {section.header.settings.titleHighlight}
          </p>
          <p class="mx-auto w-full text-lg font-semibold md:w-[70%]">
            {section.header.settings.subtitle}
          </p>
        </div>
      </section>
    </section>
  {/if}

  {#if section.courses?.show}
    <section id="course" class="h-full px-2 pb-20 pt-4 lg:px-16">
      <div class="relative mt-10 flex w-full flex-row items-start justify-start lg:gap-2">
        <!-- filter start -->
        <div class="sticky top-0 hidden min-w-max lg:block">
          <p class="mb-4 font-semibold">Filter by</p>
          <div class="w-full space-y-2">
            {#each filter as item}
              <form
                class="space-x-2 rounded-md border border-[#D0D1C9] bg-[#F4F4F4] py-4 pl-4 pr-8 font-medium text-[#3C4043]"
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

        <div class="mx-auto h-full w-full rounded-3xl text-white">
          <!-- courses start -->
          <div class="max-h-screen w-full p-4 md:p-8">
            {#if data.courses.length > 0}
              <section class="flex w-full flex-wrap items-center justify-center gap-4">
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
                <div class="mx-auto w-full px-4">
                  <EmptyState />
                </div>
              {/if}
            {:else}
              <div class="mx-auto w-full px-4">
                <EmptyState />
              </div>
            {/if}
          </div>
          <!-- courses end -->

          {#if filteredCourses.length > 2}
            <div class="flex w-full items-center justify-center py-8">
              <Button
                on:click={() => (viewAll = !viewAll)}
                class="rounded-2xl border-[1.5px] border-white  py-6 uppercase text-white shadow-[0px_3px_white] hover:bg-white hover:text-black"
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

<style>
  #courses-header {
    background-image: url('$lib/components/cal/assets/calcom-background.svg');
  }
</style>
