<script>
  import CardLoader from '$lib/component/CardLoader.svelte';
  import CourseCard from '$lib/component/CourseCard.svelte';
  import EmptyState from '$lib/component/EmptyState.svelte';
  import Footer from '$lib/component/Footer.svelte';
  import Navigation from '$lib/component/Navigation.svelte';
  import PageLoader from '$lib/component/PageLoader.svelte';
  import { courseMetaData } from '$lib/component/store.js';
  import { Button } from '$lib/components/ui/button';
  import { onMount } from 'svelte';

  export let org = {};

  export let data;
  const DISPLAY_COURSE = {
    ALL: 'all',
    COURSE: 'course',
    PATH: 'path'
  };

  let viewAll = false;
  let type = DISPLAY_COURSE.ALL;
  const filter = [
    {
      title: 'All Course',
      checked: true
    },
    {
      title: 'Live Sessions',
      checked: false
    },
    {
      title: 'Self Paced',
      checked: false
    }
  ];

  // const navItems = [
  //   {
  //     title: 'All',
  //     type: DISPLAY_COURSE.ALL
  //   },
  //   {
  //     title: 'Course',
  //     type: DISPLAY_COURSE.COURSE
  //   },
  //   {
  //     title: 'Learning Path',
  //     type: DISPLAY_COURSE.PATH
  //   }
  // ];

  // const displayCourse = (course) => {
  //   type = course;
  //   const url = new URL(window.location);
  //   url.searchParams.set('type', course);
  //   window.history.pushState({}, '', url); // Update URL without reloading the page
  // };

  const filterCourse = (item) => {
    item.checked = !item.checked;
    console.log(`${item.title} item is ${item.checked}`);
  };

  // On mount, set the active type based on the URL parameter
  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const urlType = params.get('type');
    if (urlType && Object.values(DISPLAY_COURSE).includes(urlType)) {
      type = urlType;
    }
  });
</script>

{#if !data}
  <PageLoader />
  <!-- <p>loading</p> -->
{:else}
  <section class="overflow-x-hidden">
    <Navigation />
    <!-- hero -->
    <div
      class="h-full pt-20 pb-36 flex flex-col items-center justify-center text-center w-full bg-gradient-to-r from-[#f0a5f11a] via-white to-[#f6e7f61a]"
    >
      <h1 class="font-bold text-5xl mb-4">Our <span class="text-[#CE02CE]">Programs</span></h1>
      <p class="md:text-xl text-[#878787] w-full md:w-[60%] lg:w-[40%] text-center">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa dolore assumenda distinctio
        amet eveniet! Inventore earum quisquam qui suscipit quis?
      </p>
    </div>

    <!-- course -->
    {#if data.data.courses.show}
      <section id="course" class="px-4 pt-4 pb-20 h-full bg-white">
        <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-4">
          {data.data.courses.title}
        </h1>

        <!-- <div class="flex items-center justify-center border-b-2 py-4 px-2 mx-auto w-full mb-4">
        <nav
          class="flex justify-between items-center font-semibold uppercase list-none w-full md:w-[80%]"
        >
          {#each navItems as item}
            <li
              class="hover:bg-[#FFE8FF] hover:text-[#CE02CE] cursor-pointer p-1 {type ==
                item.type && 'bg-[#FFE8FF] text-[#CE02CE]'} uppercase"
              on:click={() => displayCourse(item.type)}
            >
              {item.title}
            </li>
          {/each}
        </nav>
      </div> -->
        <div class="w-full md:w-[90%] mx-auto">
          {#if $courseMetaData.isLoading}
            <div class="cards-container my-4 mx-2">
              <CardLoader />
              <CardLoader />
              <CardLoader />
            </div>
          {:else if data.courses.length > 0}
            <div class="w-full flex gap-4 md:ml-[5%]">
              <div class="hidden lg:block w-fit space-y-2">
                <p class="font-medium text-[#3C4043] uppercase">Filter</p>
                <div class="w-max border border-[#EAEAEA] p-6 space-y-8">
                  {#each filter as item}
                    <form class="space-x-2 text-[#3C4043]">
                      <input
                        type="checkbox"
                        name={item.title}
                        checked={item.checked}
                        on:change={() => filterCourse(item)}
                      />
                      <label for={item.title}>{item.title}</label>
                    </form>
                  {/each}
                </div>
              </div>
              <section class="flex flex-wrap items-center justify-center md:justify-start gap-4">
                {#each data.courses.slice(0, viewAll ? data.courses.length : 3) as courseData}
                  <CourseCard
                    id={courseData.id}
                    slug={courseData.slug}
                    bannerImage={courseData.logo || './classroomio-course-img-template.jpg'}
                    title={courseData.title}
                    type={courseData.type}
                    description={courseData.description}
                    cost={courseData.cost}
                    currency={courseData.currency}
                    totalLessons={4}
                  />
                {/each}
              </section>
              {#if data.courses.length > 3}
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
              <EmptyState
                headerClassName="text-[#CE02CE]"
                type={type == DISPLAY_COURSE.PATH ? 'pathways' : 'course'}
              />
            </div>
          {/if}
        </div>
      </section>
    {/if}
    <Footer data={data.data} />
  </section>
{/if}
