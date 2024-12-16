<script lang="ts">
  import { goto } from '$app/navigation';
  import type { Course, CourseFilterItem } from '@/utils/types/course';
  import EmptyState from '../EmptyState.svelte';
  import { COURSE_TYPE } from '@/utils/constants/course';
  import type { Page } from '@/utils/types/page';
  import { getPageSection } from '@/utils/helpers/page';
  import PrimaryButton from '../PrimaryButton.svelte';
  import { courses } from '@/utils/stores/course';
  import CourseCard from '../CourseCard.svelte';
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
  let viewAllCourses = $state(false);

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

<main class="font-ibm">
  {#if section.header?.show}
    <div id="course-banner" class="h-full bg-cover bg-center md:h-[600px] md:p-10">
      <div class="relative flex h-full items-center justify-center px-4 py-20 text-white md:px-10">
        <div class="w-full space-y-6 text-white">
          <h1 class="w-full font-mono text-2xl font-semibold md:w-[60%] md:text-6xl">
            {section.header.settings.title}
          </h1>
          <p class="w-full md:w-[60%] lg:w-[40%]">{section.header.settings.subtitle}</p>
          <div class="flex items-center gap-2 md:gap-4">
            <PrimaryButton
              onClick={() => goto(section.header?.settings.action.link)}
              class="rounded-none bg-blue-900 px-6 py-3 font-semibold uppercase hover:scale-95 hover:bg-blue-900"
              label={section.header.settings.action.label}
            />
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if section.courses?.show}
    <div class="w-full border-b px-2 py-10 md:px-8">
      <p class="mx-auto w-full pb-10 text-center text-3xl font-semibold dark:text-white md:w-2/4">
        {section.courses.settings.title}
      </p>
      <div class="py-10">
        {#if $courses.length > 0}
          <div class="mx-auto max-w-5xl items-start gap-8 lg:flex">
            <div class="hidden w-max lg:block">
              <p class="mb-2 font-medium">Filter by</p>
              <div class="w-max space-y-2">
                {#each filter as item}
                  <form
                    class="space-x-2 rounded-md border border-[#EAEAEA] bg-[#FDFDFD] px-4 py-4 font-medium text-[#3C4043]"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      name={item.title}
                      onchange={applyFilter}
                    />
                    <label for={item.title}>{item.title}</label>
                  </form>
                {/each}
              </div>
            </div>
            <section
              class="grid grid-cols-1 place-items-center gap-4 md:grid-cols-2 lg:grid-cols-3"
            >
              {#each filteredCourses.slice(0, viewAllCourses ? filteredCourses.length : 3) as courseData}
                <CourseCard
                  className="bg-[#FDFDFD]"
                  slug={courseData.slug}
                  title={courseData.title}
                  description={courseData.description}
                  cost={courseData.cost}
                  lessons={courseData.lessonsCount}
                  currency={courseData.currency}
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
              <PrimaryButton
                class="bg-blue-900 p-2 uppercase"
                onClick={() => (viewAllCourses = !viewAllCourses)}
                label="VIEW COURSES"
              />
            </div>
          {/if}
        {:else}
          <div class="mx-auto w-full px-4 lg:w-[70%]">
            <EmptyState />
          </div>
        {/if}
      </div>
    </div>
  {/if}
</main>

<style>
  #course-banner {
    background-image: url('$lib/components/minimal/assets/courses-pg-bg.png');
  }
</style>
