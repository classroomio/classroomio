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
  <div class="flex items-start lg:gap-4">
    <div class="w-full">
      {#if section.header?.show}
        <section class="flex min-h-[50vh] items-center justify-center px-2 py-20 lg:px-14">
          <section
            class="relative flex w-full flex-col-reverse items-center justify-center gap-5 text-center md:flex-col lg:ml-auto lg:w-[80%]"
          >
            <DotPattern
              class="[mask-image:radial-gradient(30vw_circle_at_center,white,transparent)]"
            />
            <div class="z-10 mb-4 w-full space-y-6">
              <p class="mx-auto w-full text-3xl font-bold md:w-[90%] md:text-6xl">
                {section.header.settings.title}
              </p>

              <p class="mx-auto w-full text-lg text-gray-400 md:w-[70%]">
                {section.header.settings.subtitle}
              </p>
            </div>
          </section>
        </section>
      {/if}

      <div class="w-full lg:ml-auto lg:w-[80%]">
        {#if section.courses?.show}
          <section id="course" class="h-full px-2 pb-20 pt-4 xl:px-6">
            <div class="max-w-2xl">
              <h1 class="mb-2 pl-2 text-start text-3xl font-bold">
                {section.courses.settings.title}
              </h1>
              <p class="mb-2 pl-2 text-start text-gray-400">
                {section.courses.settings.subtitle}
              </p>
            </div>

            <div class="mx-auto max-w-6xl">
              {#if data.courses.length > 0}
                <div class="mt-10 flex w-full items-start justify-start lg:gap-2">
                  <div class="hidden min-w-max">
                    <p class="mb-4 font-semibold">Filter by</p>
                    <div class="w-full space-y-2">
                      {#each filter as item}
                        <form
                          class="space-x-2 rounded-md border border-[#232429] bg-[#232429] px-4 py-4 font-medium text-white"
                        >
                          <input
                            type="checkbox"
                            checked={item.checked}
                            name={item.title}
                            onchange={applyFilter}
                            class="focus:ring-0"
                          />

                          <label for={item.title} class="whitespace-nowrap">{item.title}</label>
                        </form>
                      {/each}
                    </div>
                  </div>
                  <section class="flex w-fit flex-wrap items-start gap-4">
                    {#each filteredCourses.slice(0, viewAll ? filteredCourses.length : 3) as courseData}
                      <CourseCard
                        slug={courseData.slug}
                        title={courseData.title}
                        bannerImage={courseData.banner}
                        description={courseData.description}
                      />
                    {/each}
                  </section>

                  {#if filteredCourses.length == 0}
                    <div class="mx-auto w-full px-4">
                      <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
                    </div>
                  {/if}
                </div>
                {#if filteredCourses.length > 3}
                  <div class="my-5 flex w-full items-center justify-center">
                    <Button
                      on:click={() => (viewAll = !viewAll)}
                      class="w-full gap-6 rounded-none bg-[#0737BE] text-white hover:bg-[#0737BE]"
                      >{viewAll === true ? 'Show less' : 'View more courses'}</Button
                    >
                  </div>
                {/if}
              {:else}
                <div class="mx-auto w-full px-4 lg:w-[70%]">
                  <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
                </div>
              {/if}
            </div>
          </section>
        {/if}
      </div>
    </div>
    <!-- <Footer data={org} /> -->
  </div>
</section>
