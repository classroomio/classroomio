<script lang="ts">
  import CourseCard from '../CourseCard.svelte';
  import EmptyState from '../EmptyState.svelte';
  import { Button } from '$lib/components/ui/button';
  import { courses } from '$lib/utils/stores/course';
  import { homePage } from '$lib/utils/stores/pages';
  import { getPageSection } from '$lib/utils/helpers/page';

  let viewAll = $state(false);

  const DISPLAY_COURSE = {
    PACED: 'paced',
    LIVE: 'live'
  };

  let filter = [
    {
      title: 'Self Paced',
      type: DISPLAY_COURSE.PACED,
      checked: false
    },
    {
      title: 'Live Sessions',
      type: DISPLAY_COURSE.LIVE,
      checked: false
    }
  ];

  let filteredCourses = $state([...$courses]);

  const content = $derived(getPageSection($homePage, 'courses'));

  function applyFilter() {
    const activeFilters = filter.filter((f) => f.checked).map((f) => f.type.toLowerCase());

    if (activeFilters.length === 0) {
      filteredCourses = $courses;
    } else {
      filteredCourses = $courses.filter((course) =>
        activeFilters.includes(course.type.toLowerCase())
      );
    }
  }

  function filterCourse(item: { title?: string; type?: string; checked: any }) {
    item.checked = !item.checked;
    applyFilter();
  }
</script>

<main class="bg-[#EEEFE9] dark:bg-black dark:text-white overflow-x-hidden">
  {#if content?.show}
    <section class="flex items-center justify-center my-12 py-10 px-4 md:px-14 min-h-full">
      <section
        class="mx-auto text-center px-4 lg:px-10 py-20 space-y-4 bg-[#E5E7E0] dark:bg-[#232429] rounded-md w-full lg:w-[70%]"
      >
        <div class="flex flex-col items-center gap-8 relative rounded-lg">
          <span class="absolute w-2 h-2 rounded-full bg-red-500 -top-14 left-3"></span>
          <span class="absolute w-2 h-2 rounded-full bg-white top-10 -left-10"></span>
          <span class="absolute w-2 h-2 rounded-full bg-yellow-500 -top-10 -right-3"></span>
          <span class="absolute w-2 h-2 rounded-full bg-blue-800 top-14 -right-10"></span>

          <p class="text-center text-3xl md:text-5xl font-bold w-full md:w-[90%]">
            {content.settings.title}
            <span class="text-[#F54E00]">{content.settings.titleHighlight}</span>
          </p>

          <p class="text-center w-full text-lg text-[#878787] md:w-[70%]">
            {content.settings.subtitle}
          </p>
        </div>
      </section>
    </section>
  {/if}

  <section id="course" class=" pt-4 pb-20 h-full">
    <h1 class="text-center text-5xl mb-8 font-bold w-full md:w-[90%] lg:w-[70%] mx-auto">
      {content?.settings.title}
      <span class="text-[#F54E00] dark:text-[#EB9D2A]">{content?.settings.titleHighlight}</span>
    </h1>

    <div class="w-full lg:w-[90%] mx-auto">
      {#if $courses.length > 0}
        <div class="w-full flex gap-2 mt-10">
          <div class="hidden lg:block min-w-max">
            <p class="font-semibold mb-4">Filter by</p>
            <div class="w-full space-y-2">
              {#each filter as item}
                <form
                  class="space-x-2 text-[#3C4043] dark:text-white font-medium border border-[#EAEAEA] dark:border-[#232429] bg-[#FDFDFD] dark:bg-[#232429] rounded-md px-4 py-4"
                >
                  <input
                    type="checkbox"
                    checked={item.checked}
                    name={item.title}
                    onchange={() => filterCourse(item)}
                    class=" dark:accent-[#EB9D2A] accent-[#F54E00] focus:ring-0"
                  />

                  <label for={item.title} class="whitespace-nowrap">{item.title}</label>
                </form>
              {/each}
            </div>
          </div>
          <section class="grid place-items-center grid-cols-1 md:grid-cols-3 gap-4 p-4">
            {#each filteredCourses.slice(0, viewAll ? filteredCourses.length : 3) as courseData}
              <CourseCard
                slug={courseData.slug}
                title={courseData.title}
                description={courseData.description}
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
            <Button
              on:click={() => (viewAll = !viewAll)}
              class="dark:text-black bg-transparent uppercase text-black ring-1 ring-[#B17816] dark:bg-[#EB9D2A] hover:scale-95 hover:bg-[#EB9D2A] shadow-[0px_3px_#B17816] font-bold mb-4"
              >{viewAll === true ? 'Show less' : 'View more courses'}</Button
            >
          </div>
        {/if}
      {:else}
        <div class="px-4 w-full lg:w-[70%] mx-auto">
          <EmptyState className="dark:bg-[#232429] dark:border-[#EAEAEA]" type="course" />
        </div>
      {/if}
    </div>
  </section>
</main>
