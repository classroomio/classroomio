<script lang="ts">
  import { browser } from '$app/environment';
  import CardLoader from '$lib/component/CardLoader.svelte';
  import CourseCard from '$lib/component/CourseCard.svelte';
  import EmptyState from '$lib/component/EmptyState.svelte';
  import Footer from '$lib/component/Footer.svelte';
  import Navigation from '$lib/component/Navigation.svelte';
  import PageLoader from '$lib/component/PageLoader.svelte';
  import { courseMetaData } from '$lib/component/store';
  import { Button } from '$lib/components/ui/button';
  import { toggleBodyByMode } from '$lib/utils/toggleMode';

  export let data;
  const { org, courses } = data;

  let viewAll = false;
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

  let filteredCourses = [...courses];

  function applyFilter() {
    const activeFilters = filter.filter((f) => f.checked).map((f) => f.type.toLowerCase());

    if (activeFilters.length === 0) {
      filteredCourses = courses;
    } else {
      filteredCourses = courses.filter((course: { data: { type: string } }) =>
        activeFilters.includes(course.data.type.toLowerCase())
      );
    }
  }

  function filterCourse(item: { title?: string; type?: string; checked: any }) {
    item.checked = !item.checked;
    applyFilter();
  }
  $: browser && toggleBodyByMode(false);
</script>

{#if !data}
  <PageLoader />
{:else}
  <main class="bg-[#EEEFE9] font-matter">
    <!-- Navigation -->
    <Navigation />

    <!-- Header -->
    <div class="w-full">
      {#if org.courseHeader.banner.show}
        <section
          style="background-image: url('calcom-background.svg');"
          class="bg-cover bg-center flex items-center justify-center py-10 px-2 lg:px-14 min-h-[100vh] lg:min-h-[60vh] overflow-hidden"
        >
          <section class="flex flex-col text-center items-center gap-5 justify-center">
            <div class="space-y-6 w-full mb-4">
              <div class="bg-[#E5E7E0] py-1 px-4 md:border-b border-black rounded-sm w-fit mx-auto">
                <p class="uppercase font-bold text-xs lg:text-base text-[#0F163F]">
                  {org.courseHeader.title}
                </p>
              </div>
              <p class="w-full text-5xl font-bold md:w-[70%] mx-auto">
                {org.courseHeader.titleHighlight}
              </p>
              <p class="w-full font-semibold text-lg md:w-[70%] mx-auto">
                {org.courseHeader.subtitle}
              </p>
            </div>
          </section>
        </section>
      {/if}
      <!-- course -->
      {#if org.courses.show}
        <section id="course" class="px-2 pt-4 pb-20 h-full lg:px-16">
          <div class="relative w-full flex flex-row items-start justify-start lg:gap-2 mt-10">
            <!-- filter start -->
            <div class="hidden lg:block sticky top-0 min-w-max">
              <p class="font-semibold mb-4">Filter by</p>
              <div class="w-full space-y-2">
                {#each filter as item}
                  <form
                    class="space-x-2 text-[#3C4043] font-medium border border-[#D0D1C9] bg-[#F4F4F4] rounded-md pl-4 pr-8 py-4"
                  >
                    <input
                      type="checkbox"
                      checked={item.checked}
                      name={item.title}
                      on:change={() => filterCourse(item)}
                      class="focus:ring-0"
                    />

                    <label for={item.title} class="whitespace-nowrap">{item.title}</label>
                  </form>
                {/each}
              </div>
            </div>
            <!-- filter end -->
            <!-- courses start -->
            <div
              class="text-white p-8 bg-black rounded-3xl w-fit h-full overflow-scroll mx-auto scrollbar-hide"
            >
              <div class="w-full max-h-screen overflow-scroll scrollbar-hide p-4 md:p-8">
                {#if $courseMetaData.isLoading}
                  <div class="grid grid-cols-2 gap-4">
                    <CardLoader />
                    <CardLoader />
                    <CardLoader />
                  </div>
                {:else if courses.length > 0}
                  <section class="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {#each filteredCourses.slice(0, viewAll ? filteredCourses.length : 3) as courseData}
                      <CourseCard
                        slug={courseData.data.slug}
                        title={courseData.data.title}
                        bannerImage={courseData.data.banner}
                        description={courseData.data.description}
                      />
                    {/each}
                  </section>
                  {#if filteredCourses.length == 0}
                    <div class="px-4 w-full mx-auto">
                      <EmptyState />
                    </div>
                  {/if}
                {:else}
                  <div class="px-4 w-full mx-auto">
                    <EmptyState />
                  </div>
                {/if}
              </div>

              <!-- courses end -->
              {#if filteredCourses.length > 2}
                <div class="w-full flex items-center justify-center py-8">
                  <Button
                    on:click={() => (viewAll = !viewAll)}
                    class="uppercase rounded-2xl py-6  hover:bg-white hover:text-black border-[1.5px] border-white text-white shadow-[0px_3px_white]"
                    >{viewAll === true ? 'Show less' : 'View more courses'}</Button
                  >
                </div>
              {/if}
            </div>
          </div>
        </section>
      {/if}
      <!-- course end -->
    </div>

    <Footer data={org} />
  </main>
{/if}

<style>
  /* Hide scrollbar for Webkit browsers */
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  /* Hide scrollbar for other browsers */
  .scrollbar-hide {
    -ms-overflow-style: none; /* IE and Edge */
    scrollbar-width: none; /* Firefox */
  }
</style>
