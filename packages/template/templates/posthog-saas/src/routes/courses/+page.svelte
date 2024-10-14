<script>
  import CardLoader from '$lib/component/CardLoader.svelte';
  import CourseCard from '$lib/component/CourseCard.svelte';
  import EmptyState from '$lib/component/EmptyState.svelte';
  import Footer from '$lib/component/Footer.svelte';
  import Navigation from '$lib/component/Navigation.svelte';
  import PageLoader from '$lib/component/PageLoader.svelte';
  import { courseMetaData, courses, globalData } from '$lib/component/store';
  import { Button } from '$lib/components/ui/button';
  import Checkbox from '$lib/components/ui/checkbox/checkbox.svelte';
  import { onMount } from 'svelte';
  export let org = {};

  export let data;
  console.log('courses page', data);
  const DISPLAY_COURSE = {
    ALL: 'all',
    COURSE: 'course',
    PATH: 'path'
  };
  let viewAll = false;
  let type = DISPLAY_COURSE.ALL;

  const filter = [
    {
      title: 'All Courses',
      id: 'ALL',
      checked: true
    },
    {
      title: 'Live Sessions',
      id: 'LIVE',
      checked: false
    },
    {
      title: 'Self Paced',
      id: 'SELF',
      checked: false
    }
    // {
    //   title: 'Learning Path'
    // }
  ];
  const navItems = [
    {
      title: 'All',
      type: DISPLAY_COURSE.ALL
    },
    {
      title: 'Course',
      type: DISPLAY_COURSE.COURSE
    },
    {
      title: 'Learning Path',
      type: DISPLAY_COURSE.PATH
    }
  ];

  // const displayCourse = (course) => {
  //   type = course;
  //   const url = new URL(window.location);
  //   url.searchParams.set('type', course);
  //   window.history.pushState({}, '', url);
  // };

  const filterCourse = (item) => {
    item.checked = !item.checked;
    console.log(`${item.title} item is ${item.checked}`);
  };
  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const urlType = params.get('type');
    if (urlType && Object.values(DISPLAY_COURSE).includes(urlType)) {
      type = urlType;
    }
  });
</script>

<svelte:head>
  <title>
    {!org.name ? '' : `${org.name}'s `}
  </title>
</svelte:head>

{#if !data}
  <PageLoader />
{:else}
  <main class="bg-[#EEEFE9] dark:bg-black dark:text-white overflow-x-hidden">
    <Navigation />
    {#if data.data.header.banner.show}
      <section class="flex items-center justify-center my-12 py-10 px-4 md:px-14 min-h-full">
        <section
          class="mx-auto text-center px-4 lg:px-10 py-20 space-y-4 bg-[#E5E7E0] dark:bg-[#232429] rounded-md w-full md:w-[70%]"
        >
          <div class="flex flex-col items-center gap-8 relative rounded-lg">
            <span class="absolute w-2 h-2 rounded-full bg-red-500 -top-14 left-3" />
            <span class="absolute w-2 h-2 rounded-full bg-white top-10 -left-10" />
            <span class="absolute w-2 h-2 rounded-full bg-yellow-500 -top-10 -right-3" />
            <span class="absolute w-2 h-2 rounded-full bg-blue-800 top-14 -right-10" />

            <p class="text-center text-3xl md:text-5xl font-bold w-full md:w-[90%]">
              {data.data.header.title}
            </p>

            <p class="text-center w-full text-lg text-[#878787] md:w-[70%]">
              {data.data.header.subtitle}
            </p>
          </div>
        </section>
      </section>
    {/if}

    {#if data.data.courses.show}
      <section id="course" class=" pt-4 pb-20 h-full">
        <!-- <div
          class="flex items-center justify-center border-b-2 border-[#ADADAD] bg-[#E5E7E0] dark:bg-[#232429] px-2 mx-auto w-full mb-4"
        >
          <nav class="flex justify-between items-center font-semibold list-none w-full md:w-[80%]">
            {#each navItems as item}
              <li
                class="border-b-4 hover:border-[#F54E00] hover:dark:border-[#EB9D2A] cursor-pointer py-3 px-4 {type ==
                item.type
                  ? ' border-[#F54E00] dark:border-[#EB9D2A]'
                  : 'border-transparent dark:border-transparent'} capitalize"
                on:click={() => displayCourse(item.type)}
              >
                {item.title}
              </li>
            {/each}
          </nav>
        </div> -->
        <div class="w-full lg:w-[90%] mx-auto">
          {#if $courseMetaData.isLoading}
            <div class="cards-container my-4 mx-2">
              <CardLoader />
              <CardLoader />
              <CardLoader />
            </div>
          {:else if data.courses.length > 0}
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
                {#each data.courses.slice(0, viewAll ? data.courses.length : 3) as courseData}
                  <CourseCard
                    slug={courseData.slug}
                    title={courseData.title}
                    description={courseData.description}
                  />
                {/each}
              </section>
            </div>
            {#if data.courses.length > 3}
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
              <EmptyState
                className="dark:bg-[#232429] dark:border-[#EAEAEA]"
                type={type == DISPLAY_COURSE.PATH ? 'pathways' : 'course'}
              />
            </div>
          {/if}
        </div>
      </section>
    {/if}
    <Footer data={data.data} />
  </main>
{/if}
