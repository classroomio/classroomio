<script lang="ts">
  import { goto } from '$app/navigation';
  import CardLoader from '$lib/component/CardLoader.svelte';
  import CourseCard from '$lib/component/CourseCard.svelte';
  import EmptyState from '$lib/component/EmptyState.svelte';
  import Footer from '$lib/component/Footer.svelte';
  import Navigation from '$lib/component/Navigation.svelte';
  import PageLoader from '$lib/component/PageLoader.svelte';
  import { courseMetaData } from '$lib/component/store';
  import { Button } from '$lib/components/ui/button';
  import { DirectionStraightRight } from 'carbon-icons-svelte';

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
</script>

{#if !data}
  <PageLoader />
{:else}
  <main class="bg-[#EEEFE9] dark:bg-black dark:text-white">
    <div class="flex items-start lg:gap-4">
      <div class="fixed lg:sticky top-2 left-[5%] lg:left-[2%] w-[90%] mx-auto lg:w-fit z-50">
        <Navigation />
      </div>
      <div class="w-full">
        {#if org.courseHeader.banner.show}
          <section
            class="flex items-center justify-center py-10 px-2 lg:px-14 min-h-[100vh] lg:min-h-[60vh] overflow-hidden dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(11,92,215,0.6)_1%,_rgba(0,0,0,0.8)_30%,_transparent_40%),radial-gradient(ellipse_at_bottom_left,_rgba(11,92,215,0.3)_10%,_rgba(0,0,0,0.8)_30%,_transparent_50%)]"
          >
            <section
              class="flex flex-col-reverse md:flex-col text-center items-center gap-5 justify-center"
            >
              <div class="space-y-6 w-full mb-4">
                <p class="text-3xl md:text-6xl font-bold w-full md:w-[90%] mx-auto">
                  {org.courseHeader.title}
                </p>

                <p class="w-full text-lg md:w-[70%] mx-auto">
                  {org.courseHeader.subtitle}
                </p>
              </div>
            </section>
          </section>
        {/if}

        {#if org.courses.show}
          <section id="course" class="px-2 pt-4 pb-20 h-full lg:px-16">
            <h1 class="text-start text-3xl mb-2 font-bold pl-2">
              {org.courses.title}
            </h1>
            <p class="text-start text-[#878787] mb-2 pl-2">{org.courses.subtitle}</p>

            <div class="w-full mx-auto">
              {#if $courseMetaData.isLoading}
                <div class="cards-container my-4 mx-2">
                  <CardLoader />
                  <CardLoader />
                  <CardLoader />
                </div>
              {:else if courses.length > 0}
                <div class="w-full flex flex-row-reverse items-start justify-start lg:gap-2 mt-10">
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
                            on:change={() => filterCourse(item)}
                            class="focus:ring-0"
                          />

                          <label for={item.title} class="whitespace-nowrap">{item.title}</label>
                        </form>
                      {/each}
                    </div>
                  </div>
                  <section
                    class="flex flex-wrap items-start justify-center md:justify-start gap-4 px-4 lg:px-2 py-4 w-full"
                  >
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
    <Footer data={org} />
  </main>
{/if}
