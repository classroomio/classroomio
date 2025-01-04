<script lang="ts">
  import { Button } from '@/components/ui/button';
  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import { COURSE_TYPE } from '@/utils/constants/course';
  import { getPageSection } from '@/utils/helpers/page';
  import type { Course, CourseFilterItem } from '@/utils/types/course';
  import type { Page } from '$lib/utils/types/page';
  import PrimaryButton from '../PrimaryButton.svelte';
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

<section class="overflow-x-hidden">
  {#if section.header?.show}
    <div
      class="flex h-full w-full flex-col items-center justify-center bg-gradient-to-r from-[#F785F9] via-white to-[#fff] pb-36 pt-20 text-center"
    >
      <h1 class="mb-4 w-full text-center text-5xl font-bold md:w-[50%]">
        {section.header.settings.title}
        <span class="text-classic/80 text-5xl font-bold">
          {section.header.settings.titleHighlight}</span
        >
      </h1>
      <p class="w-full text-center text-[#878787] md:w-[60%] md:text-xl lg:w-[40%]">
        {section.header.settings.subtitle}
      </p>
    </div>
  {/if}

  {#if section.courses?.show}
    <section id="course" class="h-full bg-white px-4 pb-20 pt-4">
      <h1
        class="mx-auto my-10 mb-20 w-full text-center text-3xl font-bold text-[#3F3F3F] md:w-[60%]"
      >
        {section.courses.settings.title}
      </h1>
      <div class="mx-auto w-full md:w-[90%]">
        {#if data.courses.length > 0}
          <div class="flex w-full gap-4 lg:ml-[5%]">
            <div class="hidden w-fit space-y-2 lg:block">
              <p class="font-medium uppercase text-[#3C4043]">Filter</p>
              <div class="w-max space-y-8 border border-[#EAEAEA] p-6">
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
              class="grid w-full grid-cols-1 place-items-center md:grid-cols-2 xl:grid-cols-3"
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
                <div class="mx-auto w-full px-4">
                  <EmptyState headerClassName="text-[#CE02CE]" />
                </div>
              {/if}
            </section>
            {#if filteredCourses.length > 3}
              <div class="my-5 flex w-full items-center justify-center">
                <PrimaryButton
                  class="text-lg font-semibold text-white "
                  label="View more programs"
                  onClick={() => (viewAll = !viewAll)}
                />
              </div>
            {/if}
          </div>
        {:else}
          <div class="mx-auto w-full px-4 lg:w-[70%]">
            <EmptyState headerClassName="text-[#CE02CE]" />
          </div>
        {/if}
      </div>
    </section>
  {/if}
</section>
