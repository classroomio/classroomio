<script>
  import { onMount } from 'svelte';
  import CardLoader from './CardLoader.svelte';
  import { courseMetaData } from './store';
  import CourseCard from './CourseCard.svelte';
  import EmptyState from './EmptyState.svelte';
  import { Button } from '$lib/components/ui/button';

  export let data;

  const { org, courses } = data;

  const DISPLAY_COURSE = {
    ALL: 'all',
    COURSE: 'course',
    PATH: 'path'
  };
  let viewAll = false;
  let type = DISPLAY_COURSE.ALL;
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
  const displayCourse = (course) => {
    type = course;
    const url = new URL(window.location);
    url.searchParams.set('type', course);
    window.history.pushState({}, '', url);
  };
  onMount(() => {
    const params = new URLSearchParams(window.location.search);
    const urlType = params.get('type');
    if (urlType && Object.values(DISPLAY_COURSE).includes(urlType)) {
      type = urlType;
    }
  });
</script>

{#if org.courses.show}
  <section id="course" class="px-4 pt-4 pb-20 h-full bg-white">
    <h1 class="text-center text-3xl text-[#3F3F3F] font-bold mb-4">{org.courses.title}</h1>

    <!-- <div class="flex items-center justify-center border-b-2 py-4 px-2 mx-auto w-full mb-4">
      <nav
        class="flex justify-between items-center font-semibold uppercase list-none w-full md:w-[80%]"
      >
        {#each navItems as item}
          <li
            class="hover:bg-[#FFE8FF] hover:text-[#CE02CE] cursor-pointer p-1 {type == item.type &&
              'bg-[#FFE8FF] text-[#CE02CE]'} uppercase"
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
      {:else if courses.length > 0}
        <section class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-3">
          {#each courses.slice(0, viewAll ? courses.length : 3) as courseData}
            <CourseCard
              id={courseData.data.slug}
              slug={courseData.data.slug}
              bannerImage={courseData.data.logo || '/classroomio-course-img-template.jpg'}
              title={courseData.data.title}
              type={courseData.data.type}
              description={courseData.data.description}
              cost={courseData.data.cost}
              currency={courseData.data.currency}
              totalLessons={courseData.lessons}
            />
          {/each}
        </section>
        {#if courses.length > 3}
          <div class="w-full flex items-center justify-center my-5">
            <Button
              class="text-lg font-semibold text-white !bg-[#CE02CE]"
              on:click={() => (viewAll = !viewAll)}
              >View more programs
            </Button>
          </div>
        {/if}
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
