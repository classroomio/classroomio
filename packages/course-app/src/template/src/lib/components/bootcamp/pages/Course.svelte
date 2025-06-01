<script lang="ts">
  import { COURSE_TYPE } from '@/utils/constants/course';
  import { SECTION } from '@/utils/constants/page';
  import { getPageSection } from '@/utils/helpers/page';
  import { courses } from '@/utils/stores/course';
  import type { Course, CourseFilterItem } from '@/utils/types/course';
  import type { Page } from '@/utils/types/page';
  import CourseCard from '../CourseCard.svelte';
  import PrimaryButton from '../PrimaryButton.svelte';
  import EmptyState from '../EmptyState.svelte';
  import bannerImg from '../assets/org-banner.png';

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

<main class="overflow-x-hidden bg-black/90">
  {#if section.header?.show}
    <section class="flex min-h-full items-center justify-center py-10 md:py-20">
      <section class="flex flex-col items-center justify-center gap-5 text-center">
        <div class="w-full space-y-6 text-white">
          <p class="mx-auto w-full text-3xl font-normal md:w-[60%] md:text-4xl">
            {section.header.settings.title}
          </p>

          <p class="mx-auto w-full font-normal md:w-[70%]">
            {section.header.settings.subtitle}
          </p>
        </div>
        <div class="flex h-[250px] max-h-[300px] w-[800px] max-w-[80vw] rounded-lg lg:max-w-[80%]">
          <img
            style="min-width:280px; min-height:200px"
            alt="landing page banner"
            src={section.header.settings.banner.image
              ? section.header.settings.banner.image
              : bannerImg}
            class="h-full max-h-[300px] w-full rounded-lg object-cover"
          />
        </div>
      </section>
    </section>
  {/if}
  {#if section.courses?.show}
    <div class="bg-white px-2 py-10 md:px-8">
      <div class="mb-4 flex flex-col items-center justify-between md:flex-row">
        <span class="mx-auto mb-4 space-y-2 text-center lg:mb-0">
          <p class="mx-auto w-full text-2xl md:w-[60%] lg:text-3xl">
            {section.courses.settings.title}
          </p>
          <p class="text-xs text-gray-400 lg:text-sm">
            {section.courses.settings.subtitle}
          </p>
        </span>
      </div>
      <div>
        {#if $courses.length > 0}
          <div class="w-full items-start gap-6 lg:ml-[5%] lg:flex">
            <div class="hidden w-fit lg:block">
              <p class="mb-2 font-medium">Filter by</p>
              <div class="flex w-fit flex-col space-y-2">
                {#each filter as item}
                  <label
                    for={item.title}
                    class="font-inter rounded-md border border-gray-100 bg-gray-50 px-4 py-4 font-medium text-gray-700"
                  >
                    <input
                      type="checkbox"
                      bind:checked={item.checked}
                      onchange={applyFilter}
                      name={item.title}
                      class="text-bootcamp mr-2"
                    />
                    {item.title}
                  </label>
                {/each}
              </div>
            </div>
            <section
              class="flex flex-wrap items-center justify-center gap-4 p-4 lg:w-fit lg:justify-start"
            >
              {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
                <CourseCard
                  className="bg-gray-50"
                  slug={courseData.slug}
                  bannerImage={courseData.banner}
                  title={courseData.title}
                />
              {/each}
            </section>
          </div>

          {#if $courses.length > 3}
            <div class="my-5 flex w-full items-center justify-center">
              <PrimaryButton
                label="VIEW MORE"
                class="rounded-none  text-lg"
                onClick={() => (viewAll = !viewAll)}
              />
            </div>
          {/if}
        {:else}
          <div class="px-4 md:px-10">
            <EmptyState className="bg-slate-100" />
          </div>
        {/if}
      </div>
    </div>
  {/if}
</main>
