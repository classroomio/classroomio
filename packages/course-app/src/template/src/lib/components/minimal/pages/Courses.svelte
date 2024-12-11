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

<main class="bg-[#101720] font-ibm overflow-hidden">
  {#if section.header?.show}
    <div class="relative h-full md:h-screen">
      <div
        class="absolute inset-0 bg-cover bg-center"
        style="background-image: url('/classroomio-course-img-template.jpg');"
      ></div>
      <div
        class="absolute inset-0 bg-gradient-to-r from-[#0233BD99] via-[#00000033] to-[#FFFFFF00]"
      ></div>
      <div class="relative flex items-center justify-center h-full text-white px-4 py-20 md:px-10">
        <div class="text-white space-y-6 w-full">
          <p class="text-2xl md:text-4xl font-mono font-semibold w-full md:w-[60%] lg:w-[40%]">
            {section.header.settings.title}
          </p>
          <p class="w-full md:w-[60%] lg:w-[40%]">{section.header.settings.subtitle}</p>
          <div class="flex items-center gap-2 md:gap-4">
            <PrimaryButton
              onClick={() => goto(section.header?.settings.action.link)}
              class="uppercase bg-blue-900 px-6 py-3 font-semibold hover:bg-blue-900 hover:scale-95 rounded-none"
              label={section.header.settings.action.label}
            />
          </div>
        </div>
      </div>
    </div>
  {/if}

  {#if section.courses?.show}
    <div class="bg-white py-10 px-2 md:px-8">
      <p class="dark:text-white text-3xl text-center font-semibold pb-10">
        {section.courses.settings.title}
      </p>
      <div>
        {#if $courses.length > 0}
          <div class="w-full lg:flex items-start gap-4 lg:ml-[5%]">
            <div class="hidden lg:block w-max">
              <p class="font-medium mb-2">Filter by</p>
              <div class="w-max space-y-2">
                {#each filter as item}
                  <form
                    class="space-x-2 text-[#3C4043] font-medium border border-[#EAEAEA] bg-[#FDFDFD] rounded-md px-4 py-4"
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
              class="grid place-items-center grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {#each filteredCourses.slice(0, viewAllCourses ? filteredCourses.length : 3) as courseData}
                <CourseCard
                  className="bg-[#FDFDFD]"
                  slug={courseData.slug}
                  bannerImage={courseData.banner}
                  title={courseData.title}
                  description={courseData.description}
                  cost={courseData.cost}
                  lessons={courseData.lessonsCount}
                  currency={courseData.currency}
                />
              {/each}
            </section>

            {#if filteredCourses.length == 0}
              <div class="px-4 w-full mx-auto">
                <EmptyState />
              </div>
            {/if}
          </div>

          {#if filteredCourses.length > 3}
            <div class="w-full flex items-center justify-center my-5">
              <PrimaryButton
                class="uppercase bg-blue-900 p-2"
                onClick={() => (viewAllCourses = !viewAllCourses)}
                label="VIEW COURSES"
              />
            </div>
          {/if}
        {:else}
          <div class="px-4 w-full lg:w-[70%] mx-auto">
            <EmptyState />
          </div>
        {/if}
      </div>
    </div>
  {/if}
</main>
