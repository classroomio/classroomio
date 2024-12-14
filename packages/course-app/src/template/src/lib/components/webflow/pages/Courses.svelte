<script lang="ts">
  import { Button } from '@/components/ui/button';
  import { COURSE_TYPE } from '@/utils/constants/course';
  import { getPageSection } from '@/utils/helpers/page';
  import type { Course, CourseFilterItem } from '@/utils/types/course';

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
    <!-- <div class="fixed lg:sticky top-2 left-[5%] lg:left-[2%] w-[90%] mx-auto lg:w-fit z-50">
              <Navigation />
            </div> -->
    <div class="w-full">
      {#if section.header?.show}
        <section
          class="flex items-center justify-center py-10 px-2 lg:px-14 min-h-[100vh] lg:min-h-[60vh] overflow-hidden bg-[radial-gradient(ellipse_at_top_right,_rgba(11,92,215,0.6)_1%,_rgba(0,0,0,0.8)_30%,_transparent_40%),radial-gradient(ellipse_at_bottom_left,_rgba(11,92,215,0.3)_10%,_rgba(0,0,0,0.8)_30%,_transparent_50%)]"
        >
          <section
            class=" w-full lg:ml-auto lg:w-[80%] flex flex-col-reverse md:flex-col text-center items-center gap-5 justify-center"
          >
            <div class="space-y-6 w-full mb-4">
              <p class="text-3xl md:text-6xl font-bold w-full md:w-[90%] mx-auto">
                {section.header.settings.title}
              </p>

              <p class="w-full text-lg md:w-[70%] mx-auto">
                {section.header.settings.subtitle}
              </p>
            </div>
          </section>
        </section>
      {/if}
      <div class="w-full lg:ml-auto lg:w-[80%]">
        {#if section.courses?.show}
          <section id="course" class="px-2 pt-4 pb-20 h-full xl:px-6">
            <h1 class="text-start text-3xl mb-2 font-bold pl-2">
              {section.courses.settings.title}
            </h1>
            <p class="text-start text-[#878787] mb-2 pl-2">{section.courses.settings.subtitle}</p>

            <div class="w-full mx-auto">
              {#if data.courses.length > 0}
                <div class="w-full flex flex-row-reverse items-start justify-start lg:gap-2 mt-10">
                  <div class="hidden lg:block min-w-max">
                    <p class="font-semibold mb-4">Filter by</p>
                    <div class="w-full space-y-2">
                      {#each filter as item}
                        <form
                          class="space-x-2 text-white font-medium border border-[#232429] bg-[#232429] rounded-md px-4 py-4"
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
                  <section class="flex flex-wrap mx-auto w-fit items-start gap-4">
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
                    <div class="px-4 w-full mx-auto">
                      <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" />
                    </div>
                  {/if}
                </div>
                {#if filteredCourses.length > 3}
                  <div class="w-full flex items-center justify-center my-5">
                    <Button
                      on:click={() => (viewAll = !viewAll)}
                      class="bg-[#0737BE] hover:bg-[#0737BE] rounded-none text-white gap-6 w-full"
                      >{viewAll === true ? 'Show less' : 'View more courses'}</Button
                    >
                  </div>
                {/if}
              {:else}
                <div class="px-4 w-full lg:w-[70%] mx-auto">
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
