<script>
  import CardLoader from '$lib/component/CardLoader.svelte';
  import CourseCard from '$lib/component/CourseCard.svelte';
  import EmptyState from '$lib/component/EmptyState.svelte';
  import Footer from '$lib/component/Footer.svelte';
  import Navigation from '$lib/component/Navigation.svelte';
  import PageLoader from '$lib/component/PageLoader.svelte';
  import { courseMetaData } from '$lib/component/store';
  import { Button } from '$lib/components/ui/button';
  import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
  import { onMount } from 'svelte';

  export let data;
  const { org, courses } = data;
  console.log('courses page', data);

  let viewAll = false;
  const DISPLAY_COURSE = {
    ALL: 'all',
    PACED: 'paced',
    LIVE: 'live'
  };

  let filter = [
    {
      title: 'All Courses',
      type: DISPLAY_COURSE.ALL,
      checked: true
    },
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

  function filterCourse(selectedItem) {
    selectedItem.checked = !selectedItem.checked;

    filter.forEach((item) => (item.checked = item === selectedItem));

    const selectedFilter = filter.find((f) => f.checked).type;

    if (!selectedFilter || selectedFilter === DISPLAY_COURSE.ALL) {
      return (filteredCourses = courses);
    } else {
      return (filteredCourses = courses.filter(
        (course) => course.data.type.toLowerCase() === selectedFilter
      ));
    }
  }
</script>

<svelte:head>
  <title>Posthog saas</title>
</svelte:head>

{#if !data}
  <PageLoader />
{:else}
  <main class="bg-[#EEEFE9] dark:bg-black dark:text-white overflow-x-hidden">
    <Navigation />
    {#if org.header.banner.show}
      <section class="flex items-center justify-center my-12 py-10 px-4 md:px-14 min-h-full">
        <section
          class="mx-auto text-center px-4 lg:px-10 py-20 space-y-4 bg-[#E5E7E0] dark:bg-[#232429] rounded-md w-full lg:w-[70%]"
        >
          <div class="flex flex-col items-center gap-8 relative rounded-lg">
            <span class="absolute w-2 h-2 rounded-full bg-red-500 -top-14 left-3" />
            <span class="absolute w-2 h-2 rounded-full bg-white top-10 -left-10" />
            <span class="absolute w-2 h-2 rounded-full bg-yellow-500 -top-10 -right-3" />
            <span class="absolute w-2 h-2 rounded-full bg-blue-800 top-14 -right-10" />

            <p class="text-center text-3xl md:text-5xl font-bold w-full md:w-[90%]">
              {org.header.title}
            </p>

            <p class="text-center w-full text-lg text-[#878787] md:w-[70%]">
              {org.header.subtitle}
            </p>
          </div>
        </section>
      </section>
    {/if}

    {#if org.courses.show}
      <section id="course" class=" pt-4 pb-20 h-full">
        <h1 class="text-center text-5xl mb-8 font-bold">
          {org.courses.title}
          <span class="text-[#F54E00] dark:text-[#EB9D2A]">{org.courses.titleHighlight}</span>
        </h1>

        <div class="w-full lg:w-[90%] mx-auto">
          {#if $courseMetaData.isLoading}
            <div class="cards-container my-4 mx-2">
              <CardLoader />
              <CardLoader />
              <CardLoader />
            </div>
          {:else if filteredCourses.length > 0}
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
                        on:change={() => filterCourse(item)}
                        class=" dark:accent-[#EB9D2A] accent-[#F54E00] focus:ring-0"
                      />

                      <label for={item.title} class="whitespace-nowrap">{item.title}</label>
                    </form>
                  {/each}
                </div>
              </div>
              <section
                class="flex flex-wrap items-center justify-center md:justify-start gap-4 px-4 lg:px-2 py-4 w-full"
              >
                {#each filteredCourses.slice(0, viewAll ? filteredCourses.length : 3) as courseData}
                  <CourseCard
                    slug={courseData.data.slug}
                    title={courseData.data.title}
                    description={courseData.data.description}
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
    {/if}
    <Footer data={org} />
  </main>
{/if}
