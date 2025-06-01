<script lang="ts">
  import CourseCard from '../CourseCard.svelte';
  import PrimaryButton from '../PrimaryButton.svelte';
  import { getPageSection } from '@/utils/helpers/page';
  import { SECTION } from '@/utils/constants/page';
  import { COURSE_TYPE } from '@/utils/constants/course';
  import type { Course, CourseFilterItem } from '@/utils/types/course';
  import type { Page } from '@/utils/types/page';

  interface Props {
    data: {
      page: Page;
      sharedPage: Page;
      courses: Course[];
    };
  }

  const { data }: Props = $props();

  let viewAll = $state(false);
  let filter: CourseFilterItem[] = $state([
    { title: 'Self Paced', type: COURSE_TYPE.PACED, checked: false },
    { title: 'Live Sessions', type: COURSE_TYPE.LIVE, checked: false }
  ]);
  let filteredCourses: Course[] = $state([...data.courses]);

  const section = $derived({
    header: getPageSection(data.page, SECTION.HERO),
    courses: getPageSection(data.page, SECTION.COURSE)
  });

  function applyFilter() {
    const activeFilters = new Set(
      filter.filter((item) => item.checked).map((item) => item.type.toLowerCase())
    );
    filteredCourses =
      activeFilters.size === 0
        ? data.courses
        : data.courses.filter((course) => activeFilters.has((course.type || '').toLowerCase()));
  }
</script>

<!-- EmptyState block -->
{#if false}<div class="py-12 text-center text-gray-400">No courses found.</div>{/if}

<main class="min-h-screen bg-[#FAF8F6] font-sans text-black">
  {#if section.header?.show}
    <section class="flex min-h-full items-center justify-center py-10 md:py-20">
      <section class="flex flex-col items-center justify-center gap-5 text-center">
        <div class="w-full space-y-6">
          <p class="mx-auto w-full text-3xl font-black md:w-[60%] md:text-4xl">
            {section.header.settings.title}
          </p>
          <p class="mx-auto w-full text-lg md:w-[70%]">
            {section.header.settings.subtitle}
          </p>
        </div>
        {#if section.header.settings.banner?.image}
          <div
            class="flex h-[250px] max-h-[300px] w-[800px] max-w-[80vw] rounded-lg lg:max-w-[80%]"
          >
            <img
              style="min-width:280px; min-height:200px"
              alt="landing page banner"
              src={section.header.settings.banner.image}
              class="h-full max-h-[300px] w-full rounded-lg object-cover"
            />
          </div>
        {/if}
      </section>
    </section>
  {/if}
  {#if section.courses?.show}
    <div class="bg-white px-2 py-10 md:px-8">
      <div class="mb-4 flex flex-col items-center justify-between md:flex-row">
        <span class="mx-auto mb-4 space-y-2 text-center lg:mb-0">
          <p class="mx-auto w-full text-2xl font-black md:w-[60%] lg:text-3xl">
            {section.courses.settings.title}
          </p>
          <p class="text-xs text-gray-400 lg:text-sm">
            {section.courses.settings.subtitle}
          </p>
        </span>
      </div>
      <div class="flex w-full items-start gap-6 lg:ml-[5%] lg:flex">
        <div class="hidden w-fit lg:block">
          <p class="mb-2 font-medium">Filter by</p>
          <div class="flex w-fit flex-col space-y-2">
            {#each filter as item}
              <label
                for={item.title}
                class="rounded-md border border-gray-100 bg-gray-50 px-4 py-4 font-medium text-gray-700"
              >
                <input
                  type="checkbox"
                  bind:checked={item.checked}
                  on:change={applyFilter}
                  name={item.title}
                  class="mr-2"
                />
                {item.title}
              </label>
            {/each}
          </div>
        </div>
        <section
          class="flex flex-wrap items-center justify-center gap-4 p-4 lg:w-fit lg:justify-start"
        >
          {#if filteredCourses.length > 0}
            {#each filteredCourses.slice(0, viewAll ? filteredCourses.length : 3) as courseData}
              <CourseCard
                slug={courseData.slug}
                bannerImage={courseData.banner}
                title={courseData.title}
                description={courseData.description}
              />
            {/each}
          {:else}
            <div class="py-12 text-center text-gray-400">No courses found.</div>
          {/if}
        </section>
      </div>
      {#if filteredCourses.length > 3}
        <div class="my-5 flex w-full items-center justify-center">
          <PrimaryButton
            label={viewAll ? 'Show less' : 'View more courses'}
            onClick={() => (viewAll = !viewAll)}
            className="text-lg"
          />
        </div>
      {/if}
    </div>
  {/if}
</main>
