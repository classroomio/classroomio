<script lang="ts">
  import { run } from 'svelte/legacy';

  import { browser } from '$app/environment';
  import CardLoader from '$lib/component/CardLoader.svelte';
  import CourseCard from '$lib/component/CourseCard.svelte';
  import EmptyState from '$lib/component/EmptyState.svelte';
  import Footer from '$lib/component/Footer.svelte';
  import Navigation from '$lib/component/Navigation.svelte';
  import PageLoader from '$lib/component/PageLoader.svelte';
  import { courseMetaData } from '$lib/component/store.js';
  import { Button } from '$lib/components/ui/button';
  import { toggleBodyByMode } from '$lib/utils/toggleMode';

  interface Props {
    data: any;
  }

  let { data }: Props = $props();

  const { org, courses } = data;
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

  let filteredCourses = $state([...courses]);

  function applyFilter() {
    const activeFilters = filter.filter((f) => f.checked).map((f) => f.type.toLowerCase());

    if (activeFilters.length === 0) {
      filteredCourses = courses;
    } else {
      filteredCourses = courses.filter((course) =>
        activeFilters.includes(course.data.type.toLowerCase())
      );
    }
  }

  function filterCourse(item: { title?: string; type?: string; checked: any }) {
    item.checked = !item.checked;
    applyFilter();
  }
  run(() => {
    browser && toggleBodyByMode(false);
  });
</script>

{#if !data}
  <PageLoader />
{:else}
  <section class="overflow-x-hidden">
    <Navigation />
    {#if org.courseHeader.show}
      <div
        class="h-full pt-20 pb-36 flex flex-col items-center justify-center text-center w-full bg-gradient-to-r from-[#f0a5f11a] via-white to-[#f6e7f61a]"
      >
        <h1 class="font-bold text-5xl mb-4 w-full md:w-[50%] text-center">
          {org.courseHeader.title}
          <span class="text-[#CE02CE]/80 font-bold text-5xl">
            {org.courseHeader.titleHighlight}</span
          >
        </h1>
        <p class="md:text-xl text-[#878787] w-full md:w-[60%] lg:w-[40%] text-center">
          {org.courseHeader.subtitle}
        </p>
      </div>
    {/if}

    {#if org.courses.show}
      <section id="course" class="px-4 pt-4 pb-20 h-full bg-white">
        <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-4">
          {org.courses.title}
        </h1>
        <div class="w-full md:w-[90%] mx-auto">
          {#if $courseMetaData.isLoading}
            <div class="cards-container my-4 mx-2">
              <CardLoader />
              <CardLoader />
              <CardLoader />
            </div>
          {:else if courses.length > 0}
            <div class="w-full flex gap-4 lg:ml-[5%]">
              <div class="hidden lg:block w-fit space-y-2">
                <p class="font-medium text-[#3C4043] uppercase">Filter</p>
                <div class="w-max border border-[#EAEAEA] p-6 space-y-8">
                  {#each filter as item}
                    <form class="space-x-2 text-[#3C4043]">
                      <input
                        type="checkbox"
                        name={item.title}
                        checked={item.checked}
                        onchange={() => filterCourse(item)}
                      />
                      <label for={item.title}>{item.title}</label>
                    </form>
                  {/each}
                </div>
              </div>
              <section
                class="grid place-items-center grid-cols-1 md:grid-cols-2 xl:grid-cols-3 w-full"
              >
                {#each filteredCourses.slice(0, viewAll ? filteredCourses.length : 3) as courseData}
                  <CourseCard
                    slug={courseData.data.slug}
                    bannerImage={courseData.data.banner ?? './classroomio-course-img-template.jpg'}
                    title={courseData.data.title}
                    type={courseData.data.type}
                    description={courseData.data.description}
                    cost={courseData.data.cost}
                    currency={courseData.data.currency}
                    totalLessons={courseData.lessons}
                  />
                {/each}
                {#if filteredCourses.length == 0}
                  <div class="px-4 w-full mx-auto">
                    <EmptyState headerClassName="text-[#CE02CE]" />
                  </div>
                {/if}
              </section>
              {#if filteredCourses.length > 3}
                <div class="w-full flex items-center justify-center my-5">
                  <Button
                    class="text-lg font-semibold text-white !bg-[#CE02CE]"
                    on:click={() => (viewAll = !viewAll)}>View more programs</Button
                  >
                </div>
              {/if}
            </div>
          {:else}
            <div class="px-4 w-full lg:w-[70%] mx-auto">
              <EmptyState headerClassName="text-[#CE02CE]" />
            </div>
          {/if}
        </div>
      </section>
    {/if}
    <Footer data={org} />
  </section>
{/if}
