<script>
  import PrimaryButton from '$lib/components/PrimaryButton/index.svelte';
  import { landingPageSettings } from '$lib/components/Org/Settings/store';
  import { courseMetaDeta, courses } from '$lib/components/Courses/store';
  import CardLoader from '$lib/components/Courses/components/Card/Loader.svelte';
  import EmptyState from '../../../components/EmptyState.svelte';
  import CourseCard from './CourseCard.svelte';
  import { get } from 'lodash';
  import { VARIANTS } from '$lib/components/PrimaryButton/constants';
  import { onMount } from 'svelte';

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

{#if $landingPageSettings.courses.show}
  <section id="course" class="px-4 pt-4 pb-20 h-full bg-white">
    <h1 class="text-center text-3xl text-[#3F3F3F]">{$landingPageSettings.courses.title}</h1>

    <div class="flex items-center justify-center border-b-2 py-4 px-2 mx-auto w-full mb-4">
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
    </div>

    <div class="w-full md:w-[80%] mx-auto">
      {#if $courseMetaDeta.isLoading}
        <div class="cards-container my-4 mx-2">
          <CardLoader />
          <CardLoader />
          <CardLoader />
        </div>
      {:else if $courses.length > 0}
        <section class="flex flex-wrap items-center justify-center md:justify-start gap-4 p-4">
          {#each $courses.slice(0, viewAll ? $courses.length : 3) as courseData}
            <CourseCard
              id={courseData.id}
              slug={courseData.slug}
              bannerImage={courseData.logo || '/images/classroomio-course-img-template.jpg'}
              title={courseData.title}
              type={courseData.type}
              description={courseData.description}
              cost={courseData.cost}
              currency={courseData.currency}
              totalLessons={get(courseData, 'lessons[0].count', 0)}
            />
          {/each}
        </section>
        {#if $courses.length > 3}
          <div class="w-full flex items-center justify-center my-5">
            <PrimaryButton
              label="View more programs"
              variant={VARIANTS.NONE}
              className="text-lg font-semibold text-white !bg-[#CE02CE]"
              onClick={() => (viewAll = !viewAll)}
            />
          </div>
        {/if}
      {:else}
        <div class="px-10">
          <EmptyState
            template="org"
            headerClassName="text-[#CE02CE]"
            type={type == DISPLAY_COURSE.PATH ? 'pathways' : 'course'}
          />
        </div>
      {/if}
    </div>
  </section>
{/if}
