<script lang="ts">
  import { Button } from '@/components/ui/button';
  import { COURSE_TYPE } from '@/utils/constants/course';
  import { getPageSection } from '@/utils/helpers/page';
  import type { Course, CourseFilterItem } from '@/utils/types/course';
  import { DotPattern } from '$lib/components/ui/animation/dotpattern';

  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import type { Page } from '@/utils/types/page';
  import { SECTION } from '@/utils/constants/page';
  import { courses } from '@/utils/stores/course';
  import PrimaryButton from '../PrimaryButton.svelte';
  import { DirectionStraightRight } from 'carbon-icons-svelte';
  import { goto } from '$app/navigation';

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

<section class="bg-black text-white">
  <div class="mx-auto flex w-full items-start px-4 md:w-[90%] md:px-0 lg:gap-4">
    <div class="w-full text-center">
      {#if section.header?.show}
        <section class="flex min-h-[70vh] items-center justify-center overflow-hidden px-2 py-20">
          <div class=" flex w-full items-start justify-start gap-4">
            <div class="z-10 mb-4 w-full space-y-6">
              <p class="mx-auto w-full text-3xl font-bold md:w-[90%] md:text-6xl">
                {section.header.settings.title}
              </p>

              <p class="mx-auto w-full text-lg text-gray-400 md:w-[60%]">
                {section.header.settings.subtitle}
              </p>
            </div>
          </div>
        </section>
      {/if}

      {#if section.courses?.show}
        <section id="course" class="h-full pb-20 pt-4 md:px-5">
          <div class=" mb-4 md:pl-4">
            <h1 class="mb-2 text-start text-3xl font-bold">
              {section.courses.settings.title}
            </h1>
            <p class="w-[70%] text-start text-gray-500">
              {section.courses.settings.subtitle}
            </p>
          </div>
          <div class="flex flex-row-reverse">
            <div class="hidden min-w-max lg:block">
              <p class="mb-4 text-start font-semibold">Filter by</p>
              <div class="w-full space-y-2">
                {#each filter as item}
                  <form
                    class="flex items-center justify-start space-x-2 rounded-md py-2 font-medium"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      name={item.title}
                      onchange={applyFilter}
                      class="accent-linear"
                    />

                    <label for={item.title} class="whitespace-nowrap">{item.title}</label>
                  </form>
                {/each}
              </div>
              {#if $courses.length > 3}
                <div class="my-5 flex w-full items-center justify-center px-2">
                  <PrimaryButton
                    onClick={() => {
                      goto('/courses');
                    }}
                    class="group w-full gap-6  text-white"
                    label="View all courses"
                  />
                </div>
              {/if}
            </div>
            {#if $courses.length > 0}
              <section
                class="grid w-full grid-cols-1 place-items-center gap-4 py-2 md:w-fit md:grid-cols-3"
              >
                {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
                  <CourseCard
                    slug={courseData.slug}
                    title={courseData.title}
                    bannerImage={courseData.banner}
                    cost={courseData.cost}
                    description={courseData.description}
                  />
                {/each}
              </section>
              {#if $courses.length > 3}
                <div class="my-5 flex w-full items-center justify-center px-2">
                  <PrimaryButton
                    onClick={() => {
                      goto('/courses');
                    }}
                    class="group w-full gap-6 rounded-none text-white"
                    label="View all courses"
                  >
                    <DirectionStraightRight
                      class="transition-transform duration-300 group-hover:translate-x-1"
                    />
                  </PrimaryButton>
                </div>
              {/if}
            {:else}
              <div class="mx-auto w-full">
                <EmptyState className="bg-black/90 border-linear-border" />
              </div>
            {/if}
          </div>
        </section>
      {/if}
    </div>
  </div>
</section>
