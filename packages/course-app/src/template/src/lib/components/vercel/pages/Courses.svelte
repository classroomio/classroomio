<script lang="ts">
  import { COURSE_TYPE } from '@/utils/constants/course';
  import { getPageSection } from '@/utils/helpers/page';
  import type { Course, CourseFilterItem } from '@/utils/types/course';

  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import type { Page } from '@/utils/types/page';
  import { SECTION } from '@/utils/constants/page';
  import { courses } from '@/utils/stores/course';
  import PrimaryButton from '../PrimaryButton.svelte';
  import HeroContainer from '../HeroContainer.svelte';
  import { AddLarge } from 'carbon-icons-svelte';

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

<section class="bg-black py-10 text-white">
  <div class="px-4">
    <div
      class="mx-auto w-full divide-y divide-zinc-400/20 border-[0.2px] border-zinc-400/20 md:max-w-[90vw] lg:max-w-[70vw]"
    >
      {#if section.header?.show}
        <section class="relative flex min-h-[50vh] items-center justify-center">
          <div class="divide-y divide-zinc-400/20">
            <AddLarge class="absolute -left-4 -top-4 z-20 text-white" size={32} />
            <div
              class="relative w-full items-center justify-center gap-5 text-center md:max-w-[90vw] md:flex-col lg:max-w-[70vw]"
            >
              <!-- horizontal lines -->
              <span>
                <div
                  class="absolute left-0 top-[40%] -z-0 hidden h-[0.2px] w-full bg-zinc-400/20 md:block"
                ></div>

                <div
                  class="absolute left-0 top-[60%] -z-0 hidden h-[0.2px] w-full bg-zinc-400/20 md:block"
                ></div>
              </span>

              <HeroContainer>
                <div class="mb-4 w-full space-y-6 p-10 md:p-20">
                  <p class="mx-auto w-full text-3xl font-bold md:w-[90%] md:text-4xl">
                    {section.header.settings.title}
                  </p>
                  <p class="mx-auto w-full md:w-[70%]">
                    {section.header.settings.subtitle}
                  </p>
                </div>
              </HeroContainer>
            </div>
          </div>
        </section>
      {/if}

      <!-- courses -->
      <div class="w-full">
        {#if section.courses?.show}
          <section id="course" class="flex h-full flex-col divide-x divide-zinc-400/20 md:flex-row">
            <div class="w-full p-6 text-center md:w-[40%]">
              <h1 class="mb-2 text-xl font-bold">
                {section.courses.settings.title}
              </h1>
              <p class="mb-6 text-sm text-gray-400">
                {section.courses.settings.subtitle}
              </p>
              <div class="mb-4 hidden w-full">
                <div class="w-full space-y-2">
                  {#each filter as item}
                    <form
                      class="space-x-2 rounded-md bg-zinc-500/10 px-4 py-4 font-medium text-white"
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
              {#if filteredCourses.length > 2}
                <PrimaryButton
                  onClick={() => (viewAll = !viewAll)}
                  class="group w-full gap-6 rounded-full text-white"
                  label={viewAll ? 'Show less' : 'Show more courses'}
                />
              {/if}
            </div>

            {#if $courses.length > 0}
              <section
                class="grid w-full grid-cols-1 place-items-center gap-4 px-4 py-6 md:gap-2 lg:grid-cols-2"
              >
                {#each filteredCourses.slice(0, viewAll ? filteredCourses.length : 2) as courseData}
                  <CourseCard
                    slug={courseData.slug}
                    title={courseData.title}
                    bannerImage={courseData.banner}
                    cost={courseData.cost}
                    description={courseData.description}
                    lessons={courseData.lessonsCount}
                    course={$courses.length}
                  />
                {/each}
              </section>
            {:else}
              <div class="mx-auto w-full p-2">
                <EmptyState />
              </div>
            {/if}
          </section>
        {/if}
      </div>
    </div>
  </div>
</section>
